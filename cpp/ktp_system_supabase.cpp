#include <iostream>
#include <string>
#include <ctime>
#include <vector>
#include <algorithm>
#include <nlohmann/json.hpp>
#include <curl/curl.h>

using json = nlohmann::json;
using namespace std;

// Callback function for curl to write response data
size_t WriteCallback(void* contents, size_t size, size_t nmemb, string* s) {
    size_t newLength = size * nmemb;
    try {
        s->append((char*)contents, newLength);
        return newLength;
    } catch(std::bad_alloc& e) {
        // Handle memory problem
        return 0;
    }
}

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
    string apiBaseUrl;
    
    // Helper function to make HTTP GET request
    json makeGetRequest(const string& endpoint) {
        CURL* curl;
        CURLcode res;
        string readBuffer;
        
        curl = curl_easy_init();
        if (curl) {
            string url = apiBaseUrl + endpoint;
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
            
            res = curl_easy_perform(curl);
            curl_easy_cleanup(curl);
            
            if (res != CURLE_OK) {
                cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << endl;
                return json::object();
            }
        }
        
        try {
            return json::parse(readBuffer);
        } catch (const exception& e) {
            cerr << "Error parsing JSON response: " << e.what() << endl;
            return json::object();
        }
    }
    
    // Helper function to make HTTP POST request
    json makePostRequest(const string& endpoint, const json& data) {
        CURL* curl;
        CURLcode res;
        string readBuffer;
        
        curl = curl_easy_init();
        if (curl) {
            string url = apiBaseUrl + endpoint;
            string jsonData = data.dump();
            
            struct curl_slist* headers = NULL;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonData.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
            
            res = curl_easy_perform(curl);
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            
            if (res != CURLE_OK) {
                cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << endl;
                return json::object();
            }
        }
        
        try {
            return json::parse(readBuffer);
        } catch (const exception& e) {
            cerr << "Error parsing JSON response: " << e.what() << endl;
            return json::object();
        }
    }
    
    // Helper function to make HTTP PUT request
    json makePutRequest(const string& endpoint, const json& data) {
        CURL* curl;
        CURLcode res;
        string readBuffer;
        
        curl = curl_easy_init();
        if (curl) {
            string url = apiBaseUrl + endpoint;
            string jsonData = data.dump();
            
            struct curl_slist* headers = NULL;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "PUT");
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonData.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
            
            res = curl_easy_perform(curl);
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            
            if (res != CURLE_OK) {
                cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << endl;
                return json::object();
            }
        }
        
        try {
            return json::parse(readBuffer);
        } catch (const exception& e) {
            cerr << "Error parsing JSON response: " << e.what() << endl;
            return json::object();
        }
    }
    
    // Helper function to make HTTP PATCH request
    json makePatchRequest(const string& endpoint, const json& data) {
        CURL* curl;
        CURLcode res;
        string readBuffer;
        
        curl = curl_easy_init();
        if (curl) {
            string url = apiBaseUrl + endpoint;
            string jsonData = data.dump();
            
            struct curl_slist* headers = NULL;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "PATCH");
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonData.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
            
            res = curl_easy_perform(curl);
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            
            if (res != CURLE_OK) {
                cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << endl;
                return json::object();
            }
        }
        
        try {
            return json::parse(readBuffer);
        } catch (const exception& e) {
            cerr << "Error parsing JSON response: " << e.what() << endl;
            return json::object();
        }
    }
    
    void loadApplicationsFromAPI() {
        applications.clear();
        
        json response = makeGetRequest("/api/ktp");
        if (response.contains("applications") && response["applications"].is_array()) {
            for (const auto& item : response["applications"]) {
                Applicant app;
                app.id = item["id"];
                app.name = item["name"];
                app.address = item["address"];
                app.region = item["region"];
                app.submissionTime = item["submission_time"];
                app.status = item["status"];
                applications.push_back(app);
            }
            cout << "Loaded " << applications.size() << " applications from API." << endl;
        } else {
            cerr << "Failed to load applications from API." << endl;
        }
    }

public:
    KtpSystem(const string& baseUrl) : apiBaseUrl(baseUrl) {
        // Initialize curl globally
        curl_global_init(CURL_GLOBAL_ALL);
        loadApplicationsFromAPI();
    }
    
    ~KtpSystem() {
        // Cleanup curl
        curl_global_cleanup();
    }

    void submitApplication(const string& name, const string& address, const string& region) {
        json data = {
            {"name", name},
            {"address", address},
            {"region", region}
        };
        
        json response = makePostRequest("/api/ktp", data);
        
        if (response.contains("application")) {
            cout << "Application submitted successfully. ID: " << response["application"]["id"] << endl;
            loadApplicationsFromAPI(); // Refresh the local cache
        } else {
            cerr << "Failed to submit application." << endl;
        }
    }

    void processVerification(const string& id) {
        json data = {
            {"action", "verify"}
        };
        
        json response = makePatchRequest("/api/ktp/" + id, data);
        
        if (response.contains("application")) {
            cout << "Application " << id << " has been verified." << endl;
            loadApplicationsFromAPI(); // Refresh the local cache
        } else {
            cerr << "Failed to verify application with ID " << id << "." << endl;
        }
    }

    void editApplication(const string& id, const string& newName, 
                         const string& newAddress, const string& newRegion) {
        json data = {
            {"name", newName},
            {"address", newAddress},
            {"region", newRegion}
        };
        
        json response = makePutRequest("/api/ktp/" + id, data);
        
        if (response.contains("application")) {
            cout << "Application updated. ID: " << id << "." << endl;
            loadApplicationsFromAPI(); // Refresh the local cache
        } else {
            cerr << "Failed to update application with ID " << id << "." << endl;
        }
    }

    void undoRevision(const string& id) {
        json data = {
            {"action", "undo"}
        };
        
        json response = makePatchRequest("/api/ktp/" + id, data);
        
        if (response.contains("application")) {
            cout << "Revision undone for application " << id << "." << endl;
            loadApplicationsFromAPI(); // Refresh the local cache
        } else {
            cerr << "Failed to undo revision for application with ID " << id << "." << endl;
        }
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
            time_t submissionTime = app.submissionTime / 1000; // Convert from milliseconds to seconds
            cout << position++ << ". ID: " << app.id 
                 << "\n   Name: " << app.name
                 << "\n   Region: " << app.region
                 << "\n   Status: " << app.status
                 << "\n   Submitted: " << ctime(&submissionTime)
                 << "----------------------------------------" << endl;
        }
    }
    
    void refreshData() {
        loadApplicationsFromAPI();
        cout << "Data refreshed from server." << endl;
    }
};

int main() {
    // Replace with your actual API URL
    string apiUrl = "http://localhost:3000";
    cout << "Connecting to API at: " << apiUrl << endl;
    
    KtpSystem system(apiUrl);

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
