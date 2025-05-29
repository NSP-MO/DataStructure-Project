#include <iostream>
#include <fstream>
#include <string>
#include <sstream>    
#include <ctime>
#include <unordered_map>
#include <list>
#include <vector>
#include <algorithm>
#include <filesystem> 
#include <limits>     

namespace fs = std::filesystem;
using namespace std;

// Struktur untuk menyimpan data pemohon
struct Applicant {
    string id;
    string name;
    string address;
    string region;
    time_t submissionTime;
    string status;

    bool operator<(const Applicant& other) const {
        return name < other.name;
    }
};

// Memecah string berdasarkan delimiter
vector<string> split(const string& s, char delimiter) {
    vector<string> tokens;
    string token;
    istringstream tokenStream(s);
    while (getline(tokenStream, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

// Struktur untuk Node BST
struct BstNode {
    list<Applicant>::iterator applicantIter; // Iterator ke Applicant di applicationQueue
    string keyName; // Nama pemohon sebagai kunci BST
    BstNode *left;
    BstNode *right;

    BstNode(list<Applicant>::iterator iter)
        : applicantIter(iter), keyName(iter->name), left(nullptr), right(nullptr) {}
};

// Kelas untuk mengelola aplikasi KTP
class KtpSystem {
private:
    list<Applicant> applicationQueue; // Linked List (FIFO)
    unordered_map<string, list<Applicant>::iterator> applicationMap; // Hash Table (ID -> Iterator)
    BstNode* bstRootByName; // Root dari Binary Search Tree berdasarkan nama

    unordered_map<string, vector<Applicant>> revisionStack;
    string dataFilePath;
    string revisionFilePath;
    string projectRoot;
    const char DELIMITER = '\t';

    // --- Operasi BST ---
    BstNode* bstInsert(BstNode* node, list<Applicant>::iterator appIter) {
        if (node == nullptr) {
            return new BstNode(appIter);
        }
        if (appIter->name < node->keyName) {
            node->left = bstInsert(node->left, appIter);
        } else { // appIter->name >= node->keyName
            node->right = bstInsert(node->right, appIter);
        }
        return node;
    }

    BstNode* bstFindMin(BstNode* node) {
        while (node != nullptr && node->left != nullptr) {
            node = node->left;
        }
        return node;
    }
    
    // Menghapus node BST yang spesifik berdasarkan iteratornya (untuk nama yang sama tapi iterator berbeda)
    BstNode* bstRemove(BstNode* node, const string& nameToRemove, list<Applicant>::iterator iterToRemove) {
        if (node == nullptr) {
            return nullptr;
        }

        if (nameToRemove < node->keyName) {
            node->left = bstRemove(node->left, nameToRemove, iterToRemove);
        } else if (nameToRemove > node->keyName) {
            node->right = bstRemove(node->right, nameToRemove, iterToRemove);
        } else {
            if (node->applicantIter == iterToRemove) {
                if (node->left == nullptr && node->right == nullptr) {
                    delete node;
                    return nullptr;
                } else if (node->left == nullptr) {
                    BstNode* temp = node->right;
                    delete node;
                    return temp;
                } else if (node->right == nullptr) {
                    BstNode* temp = node->left;
                    delete node;
                    return temp;
                }
                BstNode* temp = bstFindMin(node->right);
                node->applicantIter = temp->applicantIter;
                node->keyName = temp->keyName;
                // Hapus inorder successor
                node->right = bstRemove(node->right, temp->keyName, temp->applicantIter);
            } else { // Nama sama tapi iterator beda, cari di sub-pohon kanan
                node->right = bstRemove(node->right, nameToRemove, iterToRemove);
            }
        }
        return node;
    }


    void bstInOrderTraversal(BstNode* node, vector<list<Applicant>::iterator>& result) {
        if (node != nullptr) {
            bstInOrderTraversal(node->left, result);
            result.push_back(node->applicantIter);
            bstInOrderTraversal(node->right, result);
        }
    }

    void bstClear(BstNode* node) {
        if (node == nullptr) {
            return;
        }
        bstClear(node->left);
        bstClear(node->right);
        delete node;
    }
    // --- Akhir Operasi BST ---


    string generateId(const string& region) {
        return region + "-" + to_string(time(nullptr));
    }

    void ensureDataDir() {
        fs::path dataDir = fs::path(projectRoot) / "data";
        if (!fs::exists(dataDir)) {
            try {
                fs::create_directories(dataDir);
                cout << "Direktori data dibuat di 'data/'" << endl;
            } catch (const fs::filesystem_error& e) {
                cerr << "Error membuat direktori data: " << e.what() << endl;
            }
        }
    }

    void loadApplicationsFromFile() {
        ensureDataDir();
        applicationQueue.clear();
        applicationMap.clear();
        bstClear(bstRootByName);
        bstRootByName = nullptr;


        ifstream file(dataFilePath);
        if (!file.is_open()) {
            cout << "File aplikasi '" << dataFilePath << "' tidak ditemukan. Memulai dengan daftar kosong." << endl;
            return;
        }

        string line;
        while (getline(file, line)) {
            vector<string> tokens = split(line, DELIMITER);
            if (tokens.size() == 6) {
                Applicant app;
                app.id = tokens[0];
                app.name = tokens[1];
                app.address = tokens[2];
                app.region = tokens[3];
                try {
                    app.submissionTime = stoll(tokens[4]);
                } catch (const std::exception& e) {
                    cerr << "Format submissionTime tidak valid untuk ID " << app.id << ": " << tokens[4] << endl;
                    app.submissionTime = time(nullptr);
                }
                app.status = tokens[5];

                applicationQueue.push_back(app);
                list<Applicant>::iterator currentIter = prev(applicationQueue.end());
                applicationMap[app.id] = currentIter;
                bstRootByName = bstInsert(bstRootByName, currentIter); // Tambahkan ke BST
            } else {
                cerr << "Baris tidak valid di file aplikasi: " << line << endl;
            }
        }
        cout << "Memuat " << applicationQueue.size() << " aplikasi dari '" << dataFilePath << "'" << endl;
        file.close();
    }

    void saveApplicationsToFile() {
        ensureDataDir();
        ofstream file(dataFilePath);
        if (!file.is_open()) {
            cerr << "Tidak bisa membuka file untuk menulis: " << dataFilePath << endl;
            return;
        }

        for (const auto& app : applicationQueue) {
            file << app.id << DELIMITER
                 << app.name << DELIMITER
                 << app.address << DELIMITER
                 << app.region << DELIMITER
                 << app.submissionTime << DELIMITER
                 << app.status << endl;
        }
        cout << "Menyimpan " << applicationQueue.size() << " aplikasi ke '" << dataFilePath << "'" << endl;
        file.close();
    }

    void loadRevisionsFromFile() {
        ensureDataDir();
        revisionStack.clear();
        ifstream file(revisionFilePath);
        if (!file.is_open()) { cout << "File revisi tidak ditemukan." << endl; 
            return; 
        }
        string line;
        while (getline(file, line)) {
            string originalAppId = line;
            if (!getline(file, line)) break;
            int revisionCount;
            try { revisionCount = stoi(line); } catch (const std::exception&) { continue; }
            vector<Applicant> appRevisions;
            for (int i = 0; i < revisionCount; ++i) {
                if (!getline(file, line)) break;
                vector<string> tokens = split(line, DELIMITER);
                if (tokens.size() == 6) {
                    Applicant app;
                    app.id = tokens[0]; app.name = tokens[1]; app.address = tokens[2];
                    app.region = tokens[3];
                    try { app.submissionTime = stoll(tokens[4]); } catch (const std::exception&) { app.submissionTime = time(nullptr); }
                    app.status = tokens[5];
                    appRevisions.push_back(app);
                }
            }
            if (!appRevisions.empty() || revisionCount == 0) { revisionStack[originalAppId] = appRevisions; }
        }
        file.close();
    }

    void saveRevisionsToFile() {
        ensureDataDir();
        ofstream file(revisionFilePath);
        if (!file.is_open()) { 
            cerr << "Tidak bisa membuka file revisi." << endl; 
            return; 
        }
        for (const auto& pair : revisionStack) {
            file << pair.first << endl;
            file << pair.second.size() << endl;
            for (const auto& app : pair.second) {
                file << app.id << DELIMITER << app.name << DELIMITER << app.address << DELIMITER
                     << app.region << DELIMITER << app.submissionTime << DELIMITER << app.status << endl;
            }
        }
        file.close();
    }
    
    void rebuildMap() {
        applicationMap.clear();
        for (auto it = applicationQueue.begin(); it != applicationQueue.end(); ++it) {
            applicationMap[it->id] = it;
        }
    }

public:
    KtpSystem() : bstRootByName(nullptr) {
        projectRoot = fs::current_path().string();
        dataFilePath = (fs::path(projectRoot) / "data" / "ktp_applications.txt").string();
        revisionFilePath = (fs::path(projectRoot) / "data" / "ktp_revisions.txt").string();

        cout << "Inisialisasi Sistem KTP..." << endl;
        loadApplicationsFromFile();
        loadRevisionsFromFile();
        cout << "Sistem KTP Diinisialisasi." << endl;
    }

    ~KtpSystem() {
        bstClear(bstRootByName);
    }

    void submitApplication(const string& name, const string& address, const string& region) {
        Applicant newApp;
        newApp.id = generateId(region);
        newApp.name = name;
        newApp.address = address;
        newApp.region = region;
        newApp.submissionTime = time(nullptr);
        newApp.status = "pending";

        applicationQueue.push_back(newApp);
        list<Applicant>::iterator currentIter = prev(applicationQueue.end());
        applicationMap[newApp.id] = currentIter;
        bstRootByName = bstInsert(bstRootByName, currentIter);

        saveApplicationsToFile();
        cout << "Aplikasi berhasil diajukan. ID: " << newApp.id << endl;
    }

    void processVerification(const string& id) {
        auto map_it = applicationMap.find(id);
        if (map_it == applicationMap.end()) {
            cout << "Aplikasi dengan ID '" << id << "' tidak ditemukan.\n";
            return;
        }
        auto app_it = map_it->second;
        if (app_it->status == "verified") { cout << "Aplikasi sudah diverifikasi.\n";
            return; 
        }
        app_it->status = "verified";
        saveApplicationsToFile();
        cout << "Aplikasi '" << id << "' telah diverifikasi.\n";
    }

    void editApplication(const string& id, const string& newName,
                         const string& newAddress, const string& newRegion) {
        auto map_it = applicationMap.find(id);
        if (map_it == applicationMap.end()) {
            cout << "Aplikasi dengan ID '" << id << "' tidak ditemukan.\n";
            return;
        }
        auto app_it = map_it->second;
        string oldName = app_it->name;

        revisionStack[id].push_back(*app_it);
        
        if (oldName != newName) {
             bstRootByName = bstRemove(bstRootByName, oldName, app_it);
        }

        app_it->name = newName;
        app_it->address = newAddress;
        app_it->region = newRegion;
        app_it->status = "revision";
        
        if (oldName != newName) {bstRootByName = bstInsert(bstRootByName, app_it);
        } else if (bstRootByName != nullptr && app_it->name == oldName) {}


        saveApplicationsToFile();
        saveRevisionsToFile();
        cout << "Aplikasi diperbarui. ID: " << id << " (Status: revision)\n";
    }

    void undoRevision(const string& id) {
        if (revisionStack.find(id) == revisionStack.end() || revisionStack[id].empty()) {
            cout << "Tidak ada revisi untuk dibatalkan.\n";
            return;
        }
        auto map_it = applicationMap.find(id);
        if (map_it == applicationMap.end()) { 
            cout << "Aplikasi tidak ditemukan.\n";  
            return; 
        }

        auto app_it = map_it->second;
        string nameBeforeUndo = app_it->name;

        Applicant lastRevision = revisionStack[id].back();
        revisionStack[id].pop_back();
        if (revisionStack[id].empty()) {
            revisionStack.erase(id);
        }
        
        // Update BST jika nama berubah
        if (nameBeforeUndo != lastRevision.name) {
            bstRootByName = bstRemove(bstRootByName, nameBeforeUndo, app_it);
        }

        *app_it = lastRevision; // Kembalikan data
        
        if (nameBeforeUndo != app_it->name) { // Jika nama berubah setelah undo
            bstRootByName = bstInsert(bstRootByName, app_it); // Masukkan kembali ke BST dengan nama yang sudah di-undo
        }

        saveApplicationsToFile();
        saveRevisionsToFile();
        cout << "Revisi dibatalkan untuk aplikasi '" << id << "'.\n";
    }

    void sortByRegion() {
        applicationQueue.sort([](const Applicant& a, const Applicant& b) { return a.region < b.region; });
        rebuildMap();
        cout << "Aplikasi diurutkan berdasarkan region.\n";
    }

    void sortByTime() {
        applicationQueue.sort([](const Applicant& a, const Applicant& b) { return a.submissionTime < b.submissionTime; });
        rebuildMap();
        cout << "Aplikasi diurutkan berdasarkan waktu pengajuan.\n";
    }

    void displayQueue() {
        if (applicationQueue.empty()) { 
            cout << "Antrian kosong.\n";  
            return; 
        }
        cout << "\n--- Antrian Aplikasi KTP (FIFO) --- (" << applicationQueue.size() << " aplikasi)\n";
        int position = 1;
        for (const auto& app : applicationQueue) {
            char timeBuffer[80];
            strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%d %H:%M:%S", localtime(&app.submissionTime));
            cout << position++ << ". ID: " << app.id << "\n   Nama: " << app.name << "\n   Alamat: " << app.address
                 << "\n   Region: " << app.region << "\n   Status: " << app.status << "\n   Diajukan: " << timeBuffer << "\n----------------------------------------\n";
        }
    }
    
    void displayByBSTName() {
        if (bstRootByName == nullptr) {
            cout << "Tidak ada aplikasi untuk ditampilkan (BST kosong).\n";
            return;
        }
        vector<list<Applicant>::iterator> sortedApps;
        bstInOrderTraversal(bstRootByName, sortedApps);

        cout << "\n--- Daftar Aplikasi KTP (Urut Nama via BST) --- (" << sortedApps.size() << " aplikasi)\n";
        int position = 1;
        for (const auto& app_iter : sortedApps) {
            char timeBuffer[80];
            strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%d %H:%M:%S", localtime(&app_iter->submissionTime));
            cout << position++ << ". ID: " << app_iter->id << "\n   Nama: " << app_iter->name << "\n   Alamat: " << app_iter->address
                 << "\n   Region: " << app_iter->region << "\n   Status: " << app_iter->status << "\n   Diajukan: " << timeBuffer << "\n----------------------------------------\n";
        }
    }
};

int main() {
    KtpSystem system;

    while (true) {
        cout << "\n=== Sistem Manajemen KTP ==="
             << "\n1. Ajukan Aplikasi Baru"
             << "\n2. Proses Verifikasi"
             << "\n3. Edit Aplikasi"
             << "\n4. Batalkan Edit/Revisi Terakhir"
             << "\n5. Urutkan berdasarkan Region (Tampilan FIFO)"
             << "\n6. Urutkan berdasarkan Waktu Pengajuan (Tampilan FIFO)"
             << "\n7. Tampilkan Antrian (FIFO)"
             << "\n8. Tampilkan Aplikasi Urut Nama (BST)" // Opsi Baru
             << "\n9. Keluar"
             << "\nMasukkan pilihan: ";

        int choice;
        cin >> choice;

        if (cin.fail()) {
            cout << "Input tidak valid. Silakan masukkan angka." << endl;
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            continue;
        }
        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        if (choice == 9) { cout << "Keluar dari sistem." << endl; break; }

        string id, name, address, region;

        switch (choice) {
            case 1:
                cout << "Nama: "; getline(cin, name); cout << "Alamat: "; getline(cin, address);
                cout << "Region: "; getline(cin, region); system.submitApplication(name, address, region);
                break;
            case 2: cout << "ID verifikasi: "; getline(cin, id); system.processVerification(id); break;
            case 3:
                cout << "ID edit: "; getline(cin, id); cout << "Nama baru: "; getline(cin, name);
                cout << "Alamat baru: "; getline(cin, address); cout << "Region baru: "; getline(cin, region);
                system.editApplication(id, name, address, region);
                break;
            case 4: 
                cout << "ID undo: "; 
                getline(cin, id); 
                system.undoRevision(id); 
                break;
            case 5: 
                system.sortByRegion(); 
                system.displayQueue(); 
                break;
            case 6: 
                system.sortByTime(); 
                system.displayQueue(); 
                break;
            case 7: 
                system.displayQueue(); 
                break;
            case 8: 
                system.displayByBSTName(); 
                break;
            default: 
                cout << "Pilihan tidak valid.\n";
        }
    }
    return 0;
}
