#include <iostream>
#include <fstream>
#include <string>
#include <ctime>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include <nlohmann/json.hpp> // External library for JSON
#include <filesystem> // For directory creation

// Namespace for filesystem operations
namespace fs = std::filesystem;
using json = nlohmann::json; // Alias for nlohmann::json
using namespace std;

// Structure to hold applicant data
struct Applicant {
    string id;
    string name;
    string address;
    string region;
    time_t submissionTime; // Unix timestamp
    string status;         // e.g., "pending", "verified", "revision"
};

// Class to manage KTP applications
class KtpSystem {
private:
    vector<Applicant> applications; // Main list of applications
    unordered_map<string, vector<Applicant>> revisionStack; // Stores previous versions of applications for undo
    string dataFilePath;        // Path to the applications JSON file
    string revisionFilePath;    // Path to the revisions JSON file

    // Generates a unique ID for an applicant based on region and current time
    string generateId(const string& region) {
        return region + "-" + to_string(time(nullptr));
    }

    // Ensures the 'data' directory exists, creates it if not
    void ensureDataDir() {
        fs::path dataDir = fs::path("data");
        if (!fs::exists(dataDir)) {
            try {
                fs::create_directories(dataDir);
                cout << "Data directory created at 'data/'" << endl;
            } catch (const fs::filesystem_error& e) {
                cerr << "Error creating data directory: " << e.what() << endl;
            }
        }
    }

    // Loads applications from the JSON file into the 'applications' vector
    void loadApplicationsFromFile() {
        ensureDataDir(); // Make sure 'data' directory exists
        applications.clear(); // Clear existing in-memory applications
        
        ifstream file(dataFilePath);
        if (!file.is_open()) {
            // If file doesn't exist or can't be opened, assume no data yet
            cout << "Applications file '" << dataFilePath << "' not found. Starting with an empty list." << endl;
            return;
        }
        
        try {
            json data = json::parse(file); // Parse the JSON from file
            for (const auto& item : data) {
                Applicant app;
                app.id = item.value("id", "");
                app.name = item.value("name", "");
                app.address = item.value("address", "");
                app.region = item.value("region", "");
                app.submissionTime = item.value("submissionTime", time_t(0));
                app.status = item.value("status", "pending");
                applications.push_back(app);
            }
            cout << "Loaded " << applications.size() << " applications from '" << dataFilePath << "'" << endl;
        } catch (const json::parse_error& e) {
            cerr << "Error parsing applications file '" << dataFilePath << "': " << e.what() << ". Starting with an empty list." << endl;
            applications.clear(); // Ensure list is empty if parsing fails
        } catch (const exception& e) {
            cerr << "An unexpected error occurred while loading applications: " << e.what() << endl;
            applications.clear();
        }
        file.close();
    }

    // Saves the current 'applications' vector to the JSON file
    void saveApplicationsToFile() {
        ensureDataDir(); // Make sure 'data' directory exists
        
        json data = json::array(); // Create a JSON array
        for (const auto& app : applications) {
            json item;
            item["id"] = app.id;
            item["name"] = app.name;
            item["address"] = app.address;
            item["region"] = app.region;
            item["submissionTime"] = app.submissionTime;
            item["status"] = app.status;
            data.push_back(item); // Add each applicant to the JSON array
        }
        
        ofstream file(dataFilePath);
        if (file.is_open()) {
            file << data.dump(2); // Write JSON data to file, pretty-printed with indent 2
            cout << "Saved " << applications.size() << " applications to '" << dataFilePath << "'" << endl;
        } else {
            cerr << "Could not open file for writing: " << dataFilePath << endl;
        }
        file.close();
    }

    // Loads revision history from the JSON file into 'revisionStack'
    void loadRevisionsFromFile() {
        ensureDataDir(); // Make sure 'data' directory exists
        revisionStack.clear(); // Clear existing in-memory revisions
        
        ifstream file(revisionFilePath);
        if (!file.is_open()) {
             // If file doesn't exist or can't be opened, assume no revisions yet
            cout << "Revisions file '" << revisionFilePath << "' not found. Starting with no revision history." << endl;
            return;
        }
        
        try {
            json data = json::parse(file); // Parse the JSON from file
            for (auto& [id, revisions_json] : data.items()) { // Iterate through each application ID in the JSON object
                vector<Applicant> appRevisions;
                for (const auto& item : revisions_json) { // Iterate through revisions for that ID
                    Applicant app;
                    app.id = item.value("id", "");
                    app.name = item.value("name", "");
                    app.address = item.value("address", "");
                    app.region = item.value("region", "");
                    app.submissionTime = item.value("submissionTime", time_t(0));
                    app.status = item.value("status", "pending");
                    appRevisions.push_back(app);
                }
                revisionStack[id] = appRevisions; // Store the vector of revisions for the ID
            }
             cout << "Loaded revision history for " << revisionStack.size() << " applications from '" << revisionFilePath << "'" << endl;
        } catch (const json::parse_error& e) {
            cerr << "Error parsing revisions file '" << revisionFilePath << "': " << e.what() << ". Starting with no revision history." << endl;
            revisionStack.clear();
        } catch (const exception& e) {
            cerr << "An unexpected error occurred while loading revisions: " << e.what() << endl;
            revisionStack.clear();
        }
        file.close();
    }

    // Saves the current 'revisionStack' to the JSON file
    void saveRevisionsToFile() {
        ensureDataDir(); // Make sure 'data' directory exists
        
        json data = json::object(); // Create a JSON object
        for (const auto& [id, revisions_vec] : revisionStack) {
            json revArray = json::array(); // Create a JSON array for revisions of one applicant
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
            data[id] = revArray; // Add the array of revisions to the main JSON object with applicant ID as key
        }
        
        ofstream file(revisionFilePath);
        if (file.is_open()) {
            file << data.dump(2); // Write JSON data to file, pretty-printed
            cout << "Saved revision history for " << revisionStack.size() << " applications to '" << revisionFilePath << "'" << endl;
        } else {
            cerr << "Could not open file for writing: " << revisionFilePath << endl;
        }
        file.close();
    }

public:
    // Constructor: initializes file paths and loads data from files
    KtpSystem() {
        projectRoot = fs::current_path().string(); // Assuming the executable is run from the project root
        dataFilePath = projectRoot + "/data/ktp_applications.json";
        revisionFilePath = projectRoot + "/data/ktp_revisions.json";
        
        cout << "KTP System Initializing..." << endl;
        cout << "Application data file: " << dataFilePath << endl;
        cout << "Revision data file: " << revisionFilePath << endl;
        
        loadApplicationsFromFile();
        loadRevisionsFromFile();
        cout << "KTP System Initialized." << endl;
    }
    
    string projectRoot; // Added to store the project root

    // Submits a new application
    void submitApplication(const string& name, const string& address, const string& region) {
        Applicant newApp;
        newApp.id = generateId(region);
        newApp.name = name;
        newApp.address = address;
        newApp.region = region;
        newApp.submissionTime = time(nullptr); // Current time as submission time
        newApp.status = "pending";             // Default status

        applications.push_back(newApp); // Add to in-memory list
        saveApplicationsToFile();       // Save updated list to file
        
        cout << "Application submitted successfully. ID: " << newApp.id << endl;
    }

    // Processes verification for an application
    void processVerification(const string& id) {
        auto it = find_if(applications.begin(), applications.end(), 
                         [&id](const Applicant& app) { return app.id == id; });
        
        if (it == applications.end()) {
            cout << "Application with ID '" << id << "' not found.\n";
            return;
        }
        
        if (it->status == "verified") {
            cout << "Application with ID '" << id << "' is already verified.\n";
            return;
        }

        it->status = "verified";    // Change status
        saveApplicationsToFile();   // Save changes
        cout << "Application '" << id << "' has been verified.\n";
    }

    // Edits an existing application
    void editApplication(const string& id, const string& newName, 
                         const string& newAddress, const string& newRegion) {
        auto it = find_if(applications.begin(), applications.end(), 
                         [&id](const Applicant& app) { return app.id == id; });
        
        if (it == applications.end()) {
            cout << "Application with ID '" << id << "' not found.\n";
            return;
        }

        // Push current state to revision stack before modifying
        revisionStack[id].push_back(*it); // revisionStack is an unordered_map
        saveRevisionsToFile();            // Save updated revision history

        // Update application details
        it->name = newName;
        it->address = newAddress;
        it->region = newRegion;
        it->status = "revision"; // Set status to 'revision' after edit
        saveApplicationsToFile();   // Save updated application list
        
        cout << "Application updated. ID: " << id << " (Status: revision)\n";
    }

    // Undoes the last revision for an application
    void undoRevision(const string& id) {
        // Check if there are any revisions for this ID
        if (revisionStack.find(id) == revisionStack.end() || revisionStack[id].empty()) {
            cout << "No revision available to undo for application ID '" << id << "'.\n";
            return;
        }

        // Find the current application in the main list
        auto it = find_if(applications.begin(), applications.end(), 
                         [&id](const Applicant& app) { return app.id == id; });
        
        if (it == applications.end()) {
            // This case should ideally not happen if a revision exists,
            // but good to handle.
            cout << "Application with ID '" << id << "' not found in the main list, cannot undo revision.\n";
            return;
        }

        // Get the last revision from the stack for this ID
        Applicant lastRevision = revisionStack[id].back();
        revisionStack[id].pop_back(); // Remove the last revision from the stack
         if (revisionStack[id].empty()) {
            revisionStack.erase(id); // If no more revisions for this ID, remove the key
        }
        saveRevisionsToFile(); // Save the updated revision stack

        // Restore the application details from the last revision
        *it = lastRevision;
        saveApplicationsToFile(); // Save the restored application to the main list
        
        cout << "Revision undone for application '" << id << "'. Restored to previous state.\n";
    }

    // Sorts applications by region alphabetically
    void sortByRegion() {
        sort(applications.begin(), applications.end(), 
             [](const Applicant& a, const Applicant& b) { return a.region < b.region; });
        // No need to save to file here, as sorting is a view concern for display.
        // If persistence of this sort order is desired, then call saveApplicationsToFile().
        cout << "Applications sorted by region (for current view).\n";
    }

    // Sorts applications by submission time (oldest first)
    void sortByTime() {
        sort(applications.begin(), applications.end(), 
             [](const Applicant& a, const Applicant& b) { return a.submissionTime < b.submissionTime; });
        // Similar to sortByRegion, saving is optional depending on whether the sorted order should persist.
        cout << "Applications sorted by submission time (for current view).\n";
    }

    // Displays all applications in the queue
    void displayQueue() {
        if (applications.empty()) {
            cout << "No applications in the queue.\n";
            return;
        }
        
        cout << "\n--- KTP Application Queue --- (" << applications.size() << " applications)\n";
        int position = 1;
        for (const auto& app : applications) {
            char timeBuffer[80];
            // Convert submissionTime to a human-readable string
            strftime(timeBuffer, sizeof(timeBuffer), "%Y-%m-%d %H:%M:%S", localtime(&app.submissionTime));
            
            cout << position++ << ". ID: " << app.id 
                 << "\n   Name: " << app.name
                 << "\n   Address: " << app.address
                 << "\n   Region: " << app.region
                 << "\n   Status: " << app.status
                 << "\n   Submitted: " << timeBuffer
                 << "\n----------------------------------------\n";
        }
    }
};

int main() {
    KtpSystem system;

    while (true) {
        cout << "\n=== KTP Management System (Local JSON Storage) ==="
             << "\n1. Submit New Application"
             << "\n2. Process Verification"
             << "\n3. Edit Application"
             << "\n4. Undo Last Edit/Revision"
             << "\n5. Sort by Region (current view)"
             << "\n6. Sort by Submission Time (current view)"
             << "\n7. Show Queue"
             << "\n9. Exit"
             << "\nEnter choice: ";

        int choice;
        if (!(cin >> choice)) {
            cout << "Invalid input. Please enter a number." << endl;
            cin.clear(); // Clear error flags
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Discard invalid input
            continue; 
        }
        cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Remove newline character)

        if (choice == 9) {
            cout << "Exiting system." << endl;
            break; // Exit the loop and program
        }

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
                cout << "Enter application ID to edit: ";
                getline(cin, id);
                cout << "Enter new name: ";
                getline(cin, name);
                cout << "Enter new address: ";
                getline(cin, address);
                cout << "Enter new region: ";
                getline(cin, region);
                system.editApplication(id, name, address, region);
                break;
                
            case 4:
                cout << "Enter application ID to undo last edit for: ";
                getline(cin, id);
                system.undoRevision(id);
                break;

            case 5:
                system.sortByRegion();
                system.displayQueue(); // Display after sorting
                break;
                
            case 6:
                system.sortByTime();
                system.displayQueue(); // Display after sorting
                break;
                
            case 7:
                system.displayQueue();
                break;
            
            default:
                cout << "Invalid choice. Please try again.\n";
        }
    }

    return 0;
}