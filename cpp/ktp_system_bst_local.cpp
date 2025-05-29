#include <iostream>
#include <fstream>
#include <string>
#include <ctime>
#include <unordered_map>
#include <list> // Menggunakan std::list sebagai Double Linked List
#include <vector>
#include <algorithm>
#include <nlohmann/json.hpp> // Pustaka eksternal untuk JSON
#include <filesystem>        // Untuk pembuatan direktori
#include <limits>            // Untuk numeric_limits

namespace fs = std::filesystem;
using json = nlohmann::json;
using namespace std;

// Struktur untuk menyimpan data pemohon
struct Applicant {
    string id;
    string name;
    string address;
    string region;
    time_t submissionTime;
    string status;
};

// Kelas untuk mengelola aplikasi KTP
class KtpSystem {
private:
    list<Applicant> applicationQueue; // Menggunakan std::list sebagai Double Linked List (FIFO)
    unordered_map<string, list<Applicant>::iterator> applicationMap; // Hash Table untuk pencarian O(1)
    unordered_map<string, vector<Applicant>> revisionStack; // Menyimpan versi sebelumnya untuk undo
    string dataFilePath;
    string revisionFilePath;
    string projectRoot;

    // Menghasilkan ID unik
    string generateId(const string& region) {
        return region + "-" + to_string(time(nullptr));
    }

    // Memastikan direktori 'data' ada
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

    // Memuat aplikasi dari file JSON
    void loadApplicationsFromFile() {
        ensureDataDir();
        applicationQueue.clear();
        applicationMap.clear();

        ifstream file(dataFilePath);
        if (!file.is_open()) {
            cout << "File aplikasi '" << dataFilePath << "' tidak ditemukan. Memulai dengan daftar kosong." << endl;
            return;
        }

        try {
            json data = json::parse(file);
            for (const auto& item : data) {
                Applicant app;
                app.id = item.value("id", "");
                app.name = item.value("name", "");
                app.address = item.value("address", "");
                app.region = item.value("region", "");
                app.submissionTime = item.value("submissionTime", time_t(0));
                app.status = item.value("status", "pending");
                
                applicationQueue.push_back(app);
                applicationMap[app.id] = prev(applicationQueue.end());
            }
            cout << "Memuat " << applicationQueue.size() << " aplikasi dari '" << dataFilePath << "'" << endl;
        } catch (const json::parse_error& e) {
            cerr << "Error parsing file aplikasi '" << dataFilePath << "': " << e.what() << ". Memulai dengan daftar kosong." << endl;
            applicationQueue.clear();
            applicationMap.clear();
        } catch (const exception& e) {
            cerr << "Terjadi error saat memuat aplikasi: " << e.what() << endl;
            applicationQueue.clear();
            applicationMap.clear();
        }
        file.close();
    }

    // Menyimpan aplikasi ke file JSON
    void saveApplicationsToFile() {
        ensureDataDir();

        json data = json::array();
        for (const auto& app : applicationQueue) {
            json item;
            item["id"] = app.id;
            item["name"] = app.name;
            item["address"] = app.address;
            item["region"] = app.region;
            item["submissionTime"] = app.submissionTime;
            item["status"] = app.status;
            data.push_back(item);
        }

        ofstream file(dataFilePath);
        if (file.is_open()) {
            file << data.dump(2);
            cout << "Menyimpan " << applicationQueue.size() << " aplikasi ke '" << dataFilePath << "'" << endl;
        } else {
            cerr << "Tidak bisa membuka file untuk menulis: " << dataFilePath << endl;
        }
        file.close();
    }

    // Memuat riwayat revisi dari file JSON
    void loadRevisionsFromFile() {
        ensureDataDir();
        revisionStack.clear();

        ifstream file(revisionFilePath);
        if (!file.is_open()) {
            cout << "File revisi '" << revisionFilePath << "' tidak ditemukan. Memulai tanpa riwayat revisi." << endl;
            return;
        }

        try {
            json data = json::parse(file);
            for (auto& [id, revisions_json] : data.items()) {
                vector<Applicant> appRevisions;
                for (const auto& item : revisions_json) {
                    Applicant app;
                    app.id = item.value("id", "");
                    app.name = item.value("name", "");
                    app.address = item.value("address", "");
                    app.region = item.value("region", "");
                    app.submissionTime = item.value("submissionTime", time_t(0));
                    app.status = item.value("status", "pending");
                    appRevisions.push_back(app);
                }
                revisionStack[id] = appRevisions;
            }
            cout << "Memuat riwayat revisi untuk " << revisionStack.size() << " aplikasi dari '" << revisionFilePath << "'" << endl;
        } catch (const json::parse_error& e) {
            cerr << "Error parsing file revisi '" << revisionFilePath << "': " << e.what() << ". Memulai tanpa riwayat revisi." << endl;
            revisionStack.clear();
        } catch (const exception& e) {
            cerr << "Terjadi error saat memuat revisi: " << e.what() << endl;
            revisionStack.clear();
        }
        file.close();
    }

    // Menyimpan riwayat revisi ke file JSON
    void saveRevisionsToFile() {
        ensureDataDir();

        json data = json::object();
        for (const auto& [id, revisions_vec] : revisionStack) {
            json revArray = json::array();
            for (const auto& app : revisions_vec) {
                json item;
                item["id"] = app.id;
                item["name"] = app.name;
                item["address"] = app.address;
                item["region"] = app.region;
                item["submissionTime"] = app.submissionTime;
                item["status"] = app.status;
                revArray.push_back(item);
            }
            data[id] = revArray;
        }

        ofstream file(revisionFilePath);
        if (file.is_open()) {
            file << data.dump(2);
            cout << "Menyimpan riwayat revisi untuk " << revisionStack.size() << " aplikasi ke '" << revisionFilePath << "'" << endl;
        } else {
            cerr << "Tidak bisa membuka file untuk menulis: " << revisionFilePath << endl;
        }
        file.close();
    }
    
    // Membangun ulang map setelah sorting
    void rebuildMap() {
        applicationMap.clear();
        for (auto it = applicationQueue.begin(); it != applicationQueue.end(); ++it) {
            applicationMap[it->id] = it;
        }
        cout << "Application map rebuilt after sorting." << endl;
    }


public:
    // Konstruktor
    KtpSystem() {
        projectRoot = fs::current_path().string();
        dataFilePath = (fs::path(projectRoot) / "data" / "ktp_applications.json").string();
        revisionFilePath = (fs::path(projectRoot) / "data" / "ktp_revisions.json").string();

        cout << "Inisialisasi Sistem KTP..." << endl;
        cout << "File data aplikasi: " << dataFilePath << endl;
        cout << "File data revisi: " << revisionFilePath << endl;

        loadApplicationsFromFile();
        loadRevisionsFromFile();
        cout << "Sistem KTP Diinisialisasi." << endl;
    }

    // Mengajukan aplikasi baru
    void submitApplication(const string& name, const string& address, const string& region) {
        Applicant newApp;
        newApp.id = generateId(region);
        newApp.name = name;
        newApp.address = address;
        newApp.region = region;
        newApp.submissionTime = time(nullptr);
        newApp.status = "pending";

        applicationQueue.push_back(newApp);
        applicationMap[newApp.id] = prev(applicationQueue.end());
        saveApplicationsToFile();

        cout << "Aplikasi berhasil diajukan. ID: " << newApp.id << endl;
    }

    // Memproses verifikasi aplikasi
    void processVerification(const string& id) {
        auto map_it = applicationMap.find(id);
        if (map_it == applicationMap.end()) {
            cout << "Aplikasi dengan ID '" << id << "' tidak ditemukan.\n";
            return;
        }

        auto app_it = map_it->second;
        if (app_it->status == "verified") {
            cout << "Aplikasi dengan ID '" << id << "' sudah diverifikasi.\n";
            return;
        }

        app_it->status = "verified";
        saveApplicationsToFile();
        cout << "Aplikasi '" << id << "' telah diverifikasi.\n";
    }

    // Mengedit aplikasi yang ada
    void editApplication(const string& id, const string& newName,
                         const string& newAddress, const string& newRegion) {
        auto map_it = applicationMap.find(id);
        if (map_it == applicationMap.end()) {
            cout << "Aplikasi dengan ID '" << id << "' tidak ditemukan.\n";
            return;
        }

        auto app_it = map_it->second;

        revisionStack[id].push_back(*app_it);
        saveRevisionsToFile();

        app_it->name = newName;
        app_it->address = newAddress;
        app_it->region = newRegion;
        app_it->status = "revision";
        saveApplicationsToFile();

        cout << "Aplikasi diperbarui. ID: " << id << " (Status: revision)\n";
    }

    // Membatalkan revisi terakhir
    void undoRevision(const string& id) {
        if (revisionStack.find(id) == revisionStack.end() || revisionStack[id].empty()) {
            cout << "Tidak ada revisi yang bisa dibatalkan untuk ID aplikasi '" << id << "'.\n";
            return;
        }

        auto map_it = applicationMap.find(id);
        if (map_it == applicationMap.end()) {
            cout << "Aplikasi dengan ID '" << id << "' tidak ditemukan, tidak bisa membatalkan revisi.\n";
            return;
        }

        auto app_it = map_it->second;
        Applicant lastRevision = revisionStack[id].back();
        revisionStack[id].pop_back();
        if (revisionStack[id].empty()) {
            revisionStack.erase(id);
        }
        saveRevisionsToFile();

        *app_it = lastRevision;
        saveApplicationsToFile();

        cout << "Revisi dibatalkan untuk aplikasi '" << id << "'. Kembali ke status sebelumnya.\n";
    }

    // Mengurutkan berdasarkan region
    void sortByRegion() {
        applicationQueue.sort([](const Applicant& a, const Applicant& b) {
            return a.region < b.region;
        });
        rebuildMap(); // Map harus dibangun ulang setelah sorting
        cout << "Aplikasi diurutkan berdasarkan region.\n";
    }

    // Mengurutkan berdasarkan waktu pengajuan
    void sortByTime() {
        applicationQueue.sort([](const Applicant& a, const Applicant& b) {
            return a.submissionTime < b.submissionTime;
        });
        rebuildMap(); // Map harus dibangun ulang setelah sorting
        cout << "Aplikasi diurutkan berdasarkan waktu pengajuan.\n";
    }

    // Menampilkan antrian
    void displayQueue() {
        if (applicationQueue.empty()) {
            cout << "Tidak ada aplikasi dalam antrian.\n";
            return;
        }

        cout << "\n--- Antrian Aplikasi KTP --- (" << applicationQueue.size() << " aplikasi)\n";
        int position = 1;
        for (const auto& app : applicationQueue) {
            char timeBuffer[80];
            strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%d %H:%M:%S", localtime(&app.submissionTime));

            cout << position++ << ". ID: " << app.id
                 << "\n   Nama: " << app.name
                 << "\n   Alamat: " << app.address
                 << "\n   Region: " << app.region
                 << "\n   Status: " << app.status
                 << "\n   Diajukan: " << timeBuffer
                 << "\n----------------------------------------\n";
        }
    }
};

int main() {
    KtpSystem system;

    while (true) {
        cout << "\n=== Sistem Manajemen KTP (Penyimpanan JSON Lokal) ==="
             << "\n1. Ajukan Aplikasi Baru"
             << "\n2. Proses Verifikasi"
             << "\n3. Edit Aplikasi"
             << "\n4. Batalkan Edit/Revisi Terakhir"
             << "\n5. Urutkan berdasarkan Region"
             << "\n6. Urutkan berdasarkan Waktu Pengajuan"
             << "\n7. Tampilkan Antrian"
             << "\n9. Keluar"
             << "\nMasukkan pilihan: ";

        int choice;
        cin >> choice;

        // Penanganan input yang tidak valid
        if (cin.fail()) {
            cout << "Input tidak valid. Silakan masukkan angka." << endl;
            cin.clear(); // Hapus flag error
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Buang input yang salah
            continue; 
        }
        cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Hapus karakter newline

        if (choice == 9) {
            cout << "Keluar dari sistem." << endl;
            break;
        }

        string id, name, address, region;

        switch (choice) {
            case 1:
                cout << "Masukkan nama: ";
                getline(cin, name);
                cout << "Masukkan alamat: ";
                getline(cin, address);
                cout << "Masukkan region: ";
                getline(cin, region);
                system.submitApplication(name, address, region);
                break;

            case 2:
                cout << "Masukkan ID aplikasi untuk verifikasi: ";
                getline(cin, id);
                system.processVerification(id);
                break;

            case 3:
                cout << "Masukkan ID aplikasi untuk diedit: ";
                getline(cin, id);
                cout << "Masukkan nama baru: ";
                getline(cin, name);
                cout << "Masukkan alamat baru: ";
                getline(cin, address);
                cout << "Masukkan region baru: ";
                getline(cin, region);
                system.editApplication(id, name, address, region);
                break;

            case 4:
                cout << "Masukkan ID aplikasi untuk membatalkan edit terakhir: ";
                getline(cin, id);
                system.undoRevision(id);
                break;

            case 5:
                system.sortByRegion();
                system.displayQueue(); // Tampilkan setelah diurutkan
                break;

            case 6:
                system.sortByTime();
                system.displayQueue(); // Tampilkan setelah diurutkan
                break;

            case 7:
                system.displayQueue();
                break;

            default:
                cout << "Pilihan tidak valid. Silakan coba lagi.\n";
        }
    }

    return 0;
}
