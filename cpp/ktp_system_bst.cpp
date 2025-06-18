#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <ctime>
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

    // Operator < untuk pengurutan berdasarkan nama (untuk BST berdasarkan nama)
    bool operator<(const Applicant& other) const {
        return name < other.name;
    }
};

// Struktur untuk Node BST
struct BstNode {
    Applicant data;
    BstNode *left;
    BstNode *right;

    BstNode(const Applicant& app)
        : data(app), left(nullptr), right(nullptr) {}
};

// Kelas untuk mengelola aplikasi KTP
class KtpSystem {
private:
    BstNode* bstRootByName; // Root dari Binary Search Tree berdasarkan nama
    string outputFilePath;
    string commandFilePath;
    string responseFilePath;
    string projectRoot;
    const char DELIMITER = '|'; // Delimiter yang digunakan oleh skrip Node.js

    // --- Operasi BST ---
    // Menyisipkan Applicant ke BST berdasarkan nama
    BstNode* bstInsert(BstNode* node, const Applicant& app) {
        if (node == nullptr) {
            return new BstNode(app);
        }
        if (app.name < node->data.name) {
            node->left = bstInsert(node->left, app);
        } else {
            node->right = bstInsert(node->right, app);
        }
        return node;
    }

    // Mencari Applicant di BST berdasarkan nama (mengembalikan node pertama yang cocok)
    BstNode* bstSearchByName(BstNode* node, const string& name) {
        if (node == nullptr || node->data.name == name) {
            return node;
        }
        if (name < node->data.name) {
            return bstSearchByName(node->left, name);
        } else {
            return bstSearchByName(node->right, name);
        }
    }

    // Mencari node dengan nilai minimum (digunakan untuk penghapusan)
    BstNode* bstFindMin(BstNode* node) {
        while (node != nullptr && node->left != nullptr) {
            node = node->left;
        }
        return node;
    }
    
    // Menghapus node BST yang spesifik berdasarkan nama dan ID
    BstNode* bstRemove(BstNode* node, const string& nameToRemove, const string& idToRemove) {
        if (node == nullptr) {
            return nullptr;
        }

        if (nameToRemove < node->data.name) {
            node->left = bstRemove(node->left, nameToRemove, idToRemove);
        } else if (nameToRemove > node->data.name) {
            node->right = bstRemove(node->right, nameToRemove, idToRemove);
        } else { // nameToRemove == node->data.name
            if (node->data.id == idToRemove) {
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
                // Node dengan 2 anak
                BstNode* temp = bstFindMin(node->right);
                node->data = temp->data;
                node->right = bstRemove(node->right, temp->data.name, temp->data.id);
            } else { // Nama sama, tapi ID berbeda, cari di sub-pohon kanan (jika duplikat di kanan)
                node->right = bstRemove(node->right, nameToRemove, idToRemove);
            }
        }
        return node;
    }

    // Traversal in-order untuk mengumpulkan semua Applicant dalam urutan nama
    void bstInOrderTraversal(BstNode* node, vector<Applicant>& result) {
        if (node != nullptr) {
            bstInOrderTraversal(node->left, result);
            result.push_back(node->data);
            bstInOrderTraversal(node->right, result);
        }
    }

    // Membersihkan BST secara rekursif
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

    void writeCommand(const string& command, const string& data) {
        ofstream commandFile(commandFilePath);
        if (commandFile.is_open()) {
            commandFile << command << endl;
            commandFile << data << endl;
            commandFile.close();
            cout << "Perintah dikirim. Menunggu respons dari server..." << endl;
            system(("node \"" + projectRoot + "/scripts/sync_command.js\"").c_str());
            readResponse();
        } else {
            cerr << "Tidak dapat menulis ke: " << commandFilePath << endl;
        }
    }

    void readResponse() {
        ifstream responseFile(responseFilePath);
        if (responseFile.is_open()) {
            string line;
            while (getline(responseFile, line)) {
                cout << line << endl;
            }
            responseFile.close();
        } else {
            cerr << "Tidak dapat membaca dari: " << responseFilePath << endl;
        }
    }

    void ensureDirectoriesExist() {
        fs::path dataPath = fs::path(projectRoot) / "data";
        if (!fs::exists(dataPath)) {
            try {
                fs::create_directories(dataPath);
                cout << "Direktori data dibuat di 'data/'" << endl;
            } catch (const fs::filesystem_error& e) {
                cerr << "Error membuat direktori data: " << e.what() << endl;
            }
        }
    }

    string findProjectRoot() {
        fs::path currentPath = fs::current_path();
        if (currentPath.filename() == "build") {
            return currentPath.parent_path().string();
        }
        return currentPath.string();
    }

    void loadApplicationsFromFile() {
        bstClear(bstRootByName);
        bstRootByName = nullptr;

        cout << "Memuat data aplikasi dari database..." << endl;
        system(("node \"" + projectRoot + "/scripts/sync_data.js\"").c_str());
        readResponse();

        ifstream file(outputFilePath);
        if (!file.is_open()) {
            cerr << "Tidak dapat membuka file data aplikasi: " << outputFilePath << endl;
            return;
        }

        string line;
        while (getline(file, line)) {
            if (line.empty()) continue;
            stringstream ss(line);
            string token;
            vector<string> tokens;

            while (getline(ss, token, DELIMITER)) {
                tokens.push_back(token);
            }

            if (tokens.size() == 6) {
                Applicant app;
                app.id = tokens[0];
                app.name = tokens[1];
                app.address = tokens[2];
                app.region = tokens[3];
                try {
                    app.submissionTime = stoll(tokens[4]);
                } catch (const std::exception& e) {
                    cerr << "Format submissionTime tidak valid untuk ID " << app.id << ": " << tokens[4] << " - " << e.what() << endl;
                    app.submissionTime = time(nullptr); // Fallback ke waktu saat ini
                }
                app.status = tokens[5];
                bstRootByName = bstInsert(bstRootByName, app); // Sisipkan ke BST berbasis nama
            } else {
                cerr << "Baris tidak valid di file aplikasi: " << line << endl;
            }
        }
        file.close();
        cout << "Data aplikasi berhasil dimuat dan BST dibangun ulang." << endl;
    }

public:
    KtpSystem() : bstRootByName(nullptr) {
        projectRoot = findProjectRoot();
        outputFilePath = (fs::path(projectRoot) / "data" / "ktp_applications_sync.txt").string();
        commandFilePath = (fs::path(projectRoot) / "data" / "ktp_command.txt").string();
        responseFilePath = (fs::path(projectRoot) / "data" / "ktp_response.txt").string();

        ensureDirectoriesExist();
        ofstream(outputFilePath, ios::app).close();
        ofstream(commandFilePath, ios::app).close();
        ofstream(responseFilePath, ios::app).close();

        cout << "Inisialisasi Sistem KTP dengan Integrasi Supabase..." << endl;
        loadApplicationsFromFile(); // Memuat data dari Supabase saat startup
        cout << "Sistem KTP Diinisialisasi." << endl;
    }

    ~KtpSystem() {
        bstClear(bstRootByName);
    }

    void submitApplication(const string& name, const string& address, const string& region) {
        string id = generateId(region);
        time_t now = time(nullptr);
        stringstream ss;
        ss << id << DELIMITER << name << DELIMITER << address << DELIMITER << region << DELIMITER << now << DELIMITER << "pending";
        writeCommand("submit", ss.str());
        loadApplicationsFromFile();
        cout << "Aplikasi berhasil diajukan. ID: " << id << endl;
    }

    void processVerification(const string& id) {
        writeCommand("verify", id);
        loadApplicationsFromFile();
        cout << "Aplikasi '" << id << "' telah diverifikasi.\n";
    }

    void editApplication(const string& id, const string& newName,
                         const string& newAddress, const string& newRegion) {
        stringstream ss;
        ss << id << DELIMITER << newName << DELIMITER << newAddress << DELIMITER << newRegion;
        writeCommand("edit", ss.str());
        loadApplicationsFromFile();
        cout << "Aplikasi diperbarui. ID: " << id << "\n";
    }

    void undoRevision(const string& id) {
        writeCommand("undo", id);
        loadApplicationsFromFile();
        cout << "Revisi dibatalkan untuk aplikasi '" << id << "'.\n";
    }

    void displayAllApplications(const string& sortBy = "name") {
        vector<Applicant> apps;
        bstInOrderTraversal(bstRootByName, apps);

        if (apps.empty()) {
            cout << "Tidak ada aplikasi untuk ditampilkan.\n";
            return;
        }

        if (sortBy == "region") {
            sort(apps.begin(), apps.end(), [](const Applicant& a, const Applicant& b) {
                return a.region < b.region;
            });
            cout << "\n--- Daftar Aplikasi KTP (Urut Region) --- (" << apps.size() << " aplikasi)\n";
        } else if (sortBy == "time") {
            sort(apps.begin(), apps.end(), [](const Applicant& a, const Applicant& b) {
                return a.submissionTime < b.submissionTime;
            });
            cout << "\n--- Daftar Aplikasi KTP (Urut Waktu Pengajuan) --- (" << apps.size() << " aplikasi)\n";
        } else {
            cout << "\n--- Daftar Aplikasi KTP (Urut Nama via BST) --- (" << apps.size() << " aplikasi)\n";
        }

        int position = 1;
        for (const auto& app : apps) {
            char timeBuffer[80];
            strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%d %H:%M:%S", localtime(&app.submissionTime));
            cout << position++ << ". ID: " << app.id << "\n   Nama: " << app.name << "\n   Alamat: " << app.address
                 << "\n   Region: " << app.region << "\n   Status: " << app.status << "\n   Diajukan: " << timeBuffer << "\n----------------------------------------\n";
        }
    }

    void refreshData() {
        loadApplicationsFromFile(); // Muat ulang data dari database
    }
};

int main() {
    KtpSystem system;

    while (true) {
        cout << "\n=== Sistem Manajemen KTP (Terhubung Supabase) ==="
             << "\n1. Ajukan Aplikasi Baru"
             << "\n2. Proses Verifikasi"
             << "\n3. Edit Aplikasi"
             << "\n4. Batalkan Edit/Revisi Terakhir"
             << "\n5. Tampilkan Aplikasi (Urut Nama)"
             << "\n6. Tampilkan Aplikasi (Urut Region)"
             << "\n7. Tampilkan Aplikasi (Urut Waktu Pengajuan)"
             << "\n8. Muat Ulang Data dari Server"
             << "\n9. Keluar"
             << "\nMasukkan pilihan: ";

        int choice;
        cin >> choice;

        if (cin.fail()) {
            cout << "Input tidak valid. Silakan masukkan angka." << endl;
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            continue;
        }
        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        if (choice == 9) {
            cout << "Keluar dari sistem." << endl;
            break;
        }

        string id, name, address, region;

        switch (choice) {
            case 1:
                cout << "Nama: "; getline(cin, name);
                cout << "Alamat: "; getline(cin, address);
                cout << "Region: "; getline(cin, region);
                system.submitApplication(name, address, region);
                break;
            case 2:
                cout << "ID verifikasi: "; getline(cin, id);
                system.processVerification(id);
                break;
            case 3:
                cout << "ID edit: "; getline(cin, id);
                cout << "Nama baru: "; getline(cin, name);
                cout << "Alamat baru: "; getline(cin, address);
                cout << "Region baru: "; getline(cin, region);
                system.editApplication(id, name, address, region);
                break;
            case 4:
                cout << "ID undo: ";
                getline(cin, id);
                system.undoRevision(id);
                break;
            case 5:
                system.displayAllApplications("name");
                break;
            case 6:
                system.displayAllApplications("region");
                break;
            case 7:
                system.displayAllApplications("time");
                break;
            case 8:
                system.refreshData();
                break;
            default:
                cout << "Pilihan tidak valid. Silakan coba lagi.\n";
        }
    }
    return 0;
}