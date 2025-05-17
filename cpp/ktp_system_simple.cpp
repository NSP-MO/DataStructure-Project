#include <iostream>
#include <fstream>
#include <string>
#include <ctime>
#include <vector>
#include <algorithm>
#include <sstream>
#include <cstdlib>

using namespace std;

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
    string outputFilePath;
    string commandFilePath;
    string responseFilePath;

    // Helper function to generate a unique ID
    string generateId(const string& region) {
        return region + "-" + to_string(time(nullptr));
    }

    // Helper function to write a command to the command file
    void writeCommand(const string& command, const string& data) {
        ofstream commandFile(commandFilePath);
        if (commandFile.is_open()) {
            commandFile << command << endl;
            commandFile << data << endl;
            commandFile.close();
            cout << "Command written to file. Waiting for response..." << endl;
            
            // Wait for the response file to be updated
            // Use the correct path to the Node.js script
            // Note: This assumes the script is in the same directory as the executable
            system("node ../scripts/sync_command.js");
            
            // Read the response
            readResponse();
        } else {
            cerr << "Could not open command file for writing." << endl;
        }
    }

    // Helper function to read the response file
    void readResponse() {
        ifstream responseFile(responseFilePath);
        if (responseFile.is_open()) {
            string line;
            while (getline(responseFile, line)) {
                cout << line << endl;
            }
            responseFile.close();
        } else {
            cerr << "Could not open response file for reading." << endl;
        }
    }

    // Helper function to load applications from the output file
    void loadApplicationsFromFile() {
        applications.clear();
        
        ifstream file(outputFilePath);
        if (!file.is_open()) {
            cerr << "Could not open applications file for reading." << endl;
            return;
        }
        
        string line;
        while (getline(file, line)) {
            // Skip empty lines
            if (line.empty()) continue;
            
            // Parse the line
            // Format: id|name|address|region|submissionTime|status
            Applicant app;
            stringstream ss(line);
            string token;
            
            getline(ss, app.id, '|');
            getline(ss, app.name, '|');
            getline(ss, app.address, '|');
            getline(ss, app.region, '|');
            
            string timeStr;
            getline(ss, timeStr, '|');
            try {
                app.submissionTime = stoll(timeStr);
            } catch (const exception& e) {
                cerr << "Error parsing time: " << e.what() << endl;
                app.submissionTime = time(nullptr);
            }
            
            getline(ss, app.status, '|');
            
            applications.push_back(app);
        }
        
        file.close();
        cout << "Loaded " << applications.size() << " applications from file." << endl;
    }

    // Create directories if they don't exist
    void ensureDirectoriesExist() {
        // Create data directory
        system("mkdir data 2>nul");
    }

public:
    KtpSystem() {
        // Use relative paths that work from the current directory
        outputFilePath = "data/ktp_applications_sync.txt";
        commandFilePath = "data/ktp_command.txt";
        responseFilePath = "data/ktp_response.txt";
        
        // Ensure directories exist
        ensureDirectoriesExist();
        
        // Create empty files if they don't exist
        ofstream outputFile(outputFilePath, ios::app);
        outputFile.close();
        
        ofstream commandFile(commandFilePath, ios::app);
        commandFile.close();
        
        ofstream responseFile(responseFilePath, ios::app);
        responseFile.close();
        
        loadApplicationsFromFile();
    }

    void submitApplication(const string& name, const string& address, const string& region) {
        string id = generateId(region);
        time_t submissionTime = time(nullptr);
        
        // Format: submit|id|name|address|region|submissionTime
        stringstream ss;
        ss << "submit|" << id << "|" << name << "|" << address << "|" << region << "|" << submissionTime;
        
        writeCommand("submit", ss.str());
        loadApplicationsFromFile(); // Refresh the local cache
    }

    void processVerification(const string& id) {
        // Format: verify|id
        writeCommand("verify", id);
        loadApplicationsFromFile(); // Refresh the local cache
    }

    void editApplication(const string& id, const string& newName, 
                         const string& newAddress, const string& newRegion) {
        // Format: edit|id|newName|newAddress|newRegion
        stringstream ss;
        ss << "edit|" << id << "|" << newName << "|" << newAddress << "|" << newRegion;
        
        writeCommand("edit", ss.str());
        loadApplicationsFromFile(); // Refresh the local cache
    }

    void undoRevision(const string& id) {
        // Format: undo|id
        writeCommand("undo", id);
        loadApplicationsFromFile(); // Refresh the local cache
    }

    void sortByRegion() {
        sort(applications.begin(), applications.end(), 
             [](const Applicant& a, const Applicant& b) { return a.region < b.region; });
        cout << "Applications sorted by region." << endl;
    }

    void sortByTime() {
        sort(applications.begin(), applications.end(), 
             [](const Applicant& a, const Applicant& b) { return a.submissionTime < b.submissionTime; });
        cout << "Applications sorted by submission time." << endl;
    }

    void displayQueue() {
        if (applications.empty()) {
            cout << "No applications in the queue." << endl;
            return;
        }
        
        int position = 1;
        for (const auto& app : applications) {
            time_t submissionTime = app.submissionTime;
            cout << position++ << ". ID: " << app.id 
                 << "\n   Name: " << app.name
                 << "\n   Region: " << app.region
                 << "\n   Status: " << app.status
                 << "\n   Submitted: " << ctime(&submissionTime)
                 << "----------------------------------------" << endl;
        }
    }
    
    void refreshData() {
        // Use the correct path to the Node.js script
        system("node ../scripts/sync_data.js");
        loadApplicationsFromFile();
        cout << "Data refreshed from server." << endl;
    }
};

int main() {
    cout << "Starting KTP Management System..." << endl;
    cout << "This system will sync data with Supabase." << endl;
    
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
             << "\n8. Refresh Data from Server"
             << "\n9. Exit"
             << "\nEnter choice: ";

        int choice;
        cin >> choice;
        cin.ignore();

        if (choice == 9) break;

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
                
            case 8:
                system.refreshData();
                break;
        }
    }

    return 0;
}
