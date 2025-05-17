#include <iostream>
#include <fstream>
#include <string>
#include <ctime>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include <nlohmann/json.hpp>
#include <filesystem>

using json = nlohmann::json;
using namespace std;
namespace fs = std::filesystem;

struct Applicant {
    string id;
    string name;
    string address;
    string region;
    time_t submissionTime;
    string status;
};

class KtpSystem {
private:
    vector<Applicant> applications;
    unordered_map<string, vector<Applicant>> revisionStack;
    string dataFilePath;
    string revisionFilePath;

    string generateId(const string& region) {
        return region + "-" + to_string(time(nullptr));
    }

    void ensureDataDir() {
        fs::path dataDir = fs::path("data");
        if (!fs::exists(dataDir)) {
            fs::create_directories(dataDir);
        }
    }

    void loadApplicationsFromFile() {
        ensureDataDir();
        applications.clear();
        
        ifstream file(dataFilePath);
        if (!file.is_open()) {
            return;
        }
        
        try {
            json data = json::parse(file);
            for (const auto& item : data) {
                Applicant app;
                app.id = item["id"];
                app.name = item["name"];
                app.address = item["address"];
                app.region = item["region"];
                app.submissionTime = item["submissionTime"];
                app.status = item["status"];
                applications.push_back(app);
            }
        } catch (const exception& e) {
            cerr << "Error parsing applications file: " << e.what() << endl;
        }
    }

    void saveApplicationsToFile() {
        ensureDataDir();
        
        json data = json::array();
        for (const auto& app : applications) {
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
        } else {
            cerr << "Could not open file for writing: " << dataFilePath << endl;
        }
    }

    void loadRevisionsFromFile() {
        ensureDataDir();
        revisionStack.clear();
        
        ifstream file(revisionFilePath);
        if (!file.is_open()) {
            return;
        }
        
        try {
            json data = json::parse(file);
            for (auto& [id, revisions] : data.items()) {
                vector<Applicant> appRevisions;
                for (const auto& item : revisions) {
                    Applicant app;
                    app.id = item["id"];
                    app.name = item["name"];
                    app.address = item["address"];
                    app.region = item["region"];
                    app.submissionTime = item["submissionTime"];
                    app.status = item["status"];
                    appRevisions.push_back(app);
                }
                revisionStack[id] = appRevisions;
            }
        } catch (const exception& e) {
            cerr << "Error parsing revisions file: " << e.what() << endl;
        }
    }

    void saveRevisionsToFile() {
        ensureDataDir();
        
        json data = json::object();
        for (const auto& [id, revisions] : revisionStack) {
            json revArray = json::array();
            for (const auto& app : revisions) {
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
        } else {
            cerr << "Could not open file for writing: " << revisionFilePath << endl;
        }
    }

public:
    KtpSystem() {
        dataFilePath = "data/ktp_applications.json";
        revisionFilePath = "data/ktp_revisions.json";
        loadApplicationsFromFile();
        loadRevisionsFromFile();
    }

    void submitApplication(const string& name, const string& address, const string& region) {
        Applicant newApp;
        newApp.id = generateId(region);
        newApp.name = name;
        newApp.address = address;
        newApp.region = region;
        newApp.submissionTime = time(nullptr);
        newApp.status = "pending";

        applications.push_back(newApp);
        saveApplicationsToFile();
        
        cout << "Application submitted successfully. ID: " << newApp.id << endl;
    }

    void processVerification(const string& id) {
        auto it = find_if(applications.begin(), applications.end(), 
                         [&id](const Applicant& app) { return app.id == id; });
        
        if (it == applications.end()) {
            cout << "Application with ID " << id << " not found in verification queue.\n";
            return;
        }
        
        it->status = "verified";
        saveApplicationsToFile();
        cout << "Application " << id << " has been verified.\n";
    }

    void editApplication(const string& id, const string& newName, 
                         const string& newAddress, const string& newRegion) {
        auto it = find_if(applications.begin(), applications.end(), 
                         [&id](const Applicant& app) { return app.id == id; });
        
        if (it == applications.end()) {
            cout << "Application with ID " << id << " not found.\n";
            return;
        }

        // Push original application state to the revision stack before modifying
        if (revisionStack.find(id) == revisionStack.end()) {
            revisionStack[id] = vector<Applicant>();
        }
        revisionStack[id].push_back(*it);
        saveRevisionsToFile();

        // Update application
        it->name = newName;
        it->address = newAddress;
        it->region = newRegion;
        it->status = "revision";
        saveApplicationsToFile();
        
        cout << "Application updated. ID: " << id << ".\n";
    }

    void undoRevision(const string& id) {
        if (revisionStack.find(id) == revisionStack.end() || revisionStack[id].empty()) {
            cout << "No revision available for application with ID " << id << ".\n";
            return;
        }

        auto it = find_if(applications.begin(), applications.end(), 
                         [&id](const Applicant& app) { return app.id == id; });
        
        if (it == applications.end()) {
            cout << "Application with ID " << id << " not found.\n";
            return;
        }

        // Get the last revision
        Applicant lastRevision = revisionStack[id].back();
        revisionStack[id].pop_back();
        saveRevisionsToFile();

        // Restore from revision
        *it = lastRevision;
        saveApplicationsToFile();
        
        cout << "Revision undone for application " << id << ".\n";
    }

    void sortByRegion() {
        sort(applications.begin(), applications.end(), 
             [](const Applicant& a, const Applicant& b) { return a.region < b.region; });
        saveApplicationsToFile();
        cout << "Applications sorted by region.\n";
    }

    void sortByTime() {
        sort(applications.begin(), applications.end(), 
             [](const Applicant& a, const Applicant& b) { return a.submissionTime < b.submissionTime; });
        saveApplicationsToFile();
        cout << "Applications sorted by submission time.\n";
    }

    void displayQueue() {
        if (applications.empty()) {
            cout << "No applications in the queue.\n";
            return;
        }
        
        int position = 1;
        for (const auto& app : applications) {
            cout << position++ << ". ID: " << app.id 
                 << "\n   Name: " << app.name
                 << "\n   Region: " << app.region
                 << "\n   Status: " << app.status
                 << "\n   Submitted: " << ctime(&app.submissionTime)
                 << "----------------------------------------\n";
        }
    }
};

int main() {
    KtpSystem system;

    while (true) {
        cout << "\n=== KTP Management System ==="
             << "\n1. Submit New Application"
             << "\n2. Process Verification"
             << "\n3. Sort by Region"
             << "\n4. Sort by Submission Time"
             << "\n5. Edit Application"
             << "\n6. Undo Revision"
             << "\n7. Show Queue"
             << "\n8. Exit"
             << "\nEnter choice: ";

        int choice;
        cin >> choice;
        cin.ignore();

        if (choice == 8) break;

        string id, name, address, region;
        
        switch (choice) {
            case 1:
                cout << "Enter name: ";
                getline(cin, name);
                cout << "Enter address: ";
                getline(cin, address);
                cout << "Enter region: ";
                getline(cin, region);
                system.submitApplication(name, address, region);
                break;
                
            case 2:
                cout << "Enter the application ID to verify: ";
                getline(cin, id);
                system.processVerification(id);
                break;
                
            case 3:
                system.sortByRegion();
                break;
                
            case 4:
                system.sortByTime();
                break;
                
            case 5:
                cout << "Enter application ID: ";
                getline(cin, id);
                cout << "Enter new name: ";
                getline(cin, name);
                cout << "Enter new address: ";
                getline(cin, address);
                cout << "Enter new region: ";
                getline(cin, region);
                system.editApplication(id, name, address, region);
                break;
                
            case 6:
                cout << "Enter application ID: ";
                getline(cin, id);
                system.undoRevision(id);
                break;
                
            case 7:
                system.displayQueue();
                break;
        }
    }

    return 0;
}
