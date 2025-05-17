#include <iostream>
#include <fstream>
#include <string>
#include <ctime>
#include <sstream>
#include <cstdlib>
#include <filesystem>
#include <vector>

using namespace std;
namespace fs = std::filesystem;

// Applicant record
struct Applicant {
    string id;
    string name;
    string address;
    string region;
    time_t submissionTime;
    string status;
};

// BST node for Applicant, keyed by id
struct BstNode {
    Applicant data;
    BstNode* left;
    BstNode* right;
    BstNode(const Applicant& app)
        : data(app), left(nullptr), right(nullptr) {}
};

// Insert an applicant into BST
void insertNode(BstNode*& root, const Applicant& app) {
    if (!root) {
        root = new BstNode(app);
    } else if (app.id < root->data.id) {
        insertNode(root->left, app);
    } else {
        insertNode(root->right, app);
    }
}

// Search for a node by id
BstNode* searchNode(BstNode* root, const string& id) {
    if (!root || root->data.id == id) return root;
    if (id < root->data.id) return searchNode(root->left, id);
    return searchNode(root->right, id);
}

// Find minimum node in subtree
BstNode* findMin(BstNode* root) {
    while (root && root->left) root = root->left;
    return root;
}

// Delete a node by id
BstNode* deleteNode(BstNode* root, const string& id) {
    if (!root) return nullptr;
    if (id < root->data.id) {
        root->left = deleteNode(root->left, id);
    } else if (id > root->data.id) {
        root->right = deleteNode(root->right, id);
    } else {
        if (!root->left) {
            BstNode* temp = root->right;
            delete root;
            return temp;
        } else if (!root->right) {
            BstNode* temp = root->left;
            delete root;
            return temp;
        } else {
            BstNode* succ = findMin(root->right);
            root->data = succ->data;
            root->right = deleteNode(root->right, succ->data.id);
        }
    }
    return root;
}

// In-order traversal to collect applicants
void inorderTraversal(BstNode* root, vector<Applicant>& out) {
    if (!root) return;
    inorderTraversal(root->left, out);
    out.push_back(root->data);
    inorderTraversal(root->right, out);
}

// Recursively delete entire tree
void deleteTree(BstNode* root) {
    if (!root) return;
    deleteTree(root->left);
    deleteTree(root->right);
    delete root;
}

class KtpSystem {
private:
    BstNode* root;
    string outputFilePath;
    string commandFilePath;
    string responseFilePath;
    string projectRoot;

    string generateId(const string& region) {
        return region + "-" + to_string(time(nullptr));
    }

    void writeCommand(const string& command, const string& data) {
        ofstream commandFile(commandFilePath);
        if (commandFile.is_open()) {
            commandFile << command << endl;
            commandFile << data << endl;
            commandFile.close();
            cout << "Command written. Waiting for response..." << endl;
            system(("node \"" + projectRoot + "/scripts/sync_command.js\"").c_str());
            readResponse();
        } else {
            cerr << "Cannot write to: " << commandFilePath << endl;
        }
    }

    void readResponse() {
        ifstream responseFile(responseFilePath);
        if (responseFile.is_open()) {
            string line;
            while (getline(responseFile, line)) cout << line << endl;
        }
    }

    void ensureDirectoriesExist() {
        fs::path dataPath = fs::path(projectRoot) / "data";
        if (!fs::exists(dataPath)) fs::create_directories(dataPath);
    }

    string findProjectRoot() {
        return fs::current_path().string();
    }

    void loadApplicationsFromFile() {
        deleteTree(root);
        root = nullptr;
        ifstream file(outputFilePath);
        if (!file.is_open()) {
            cerr << "Cannot open: " << outputFilePath << endl;
            return;
        }
        string line;
        while (getline(file, line)) {
            if (line.empty()) continue;
            stringstream ss(line);
            Applicant app;
            getline(ss, app.id, '|');
            getline(ss, app.name, '|');
            getline(ss, app.address, '|');
            getline(ss, app.region, '|');
            string timeStr; getline(ss, timeStr, '|');
            app.submissionTime = stoll(timeStr);
            getline(ss, app.status, '|');
            insertNode(root, app);
        }
    }

public:
    KtpSystem() : root(nullptr) {
        projectRoot = findProjectRoot();
        outputFilePath  = projectRoot + "/data/ktp_applications_sync.txt";
        commandFilePath = projectRoot + "/data/ktp_command.txt";
        responseFilePath= projectRoot + "/data/ktp_response.txt";
        ensureDirectoriesExist();
        ofstream(outputFilePath, ios::app).close();
        ofstream(commandFilePath, ios::app).close();
        ofstream(responseFilePath, ios::app).close();
        loadApplicationsFromFile();
    }

    ~KtpSystem() { deleteTree(root); }

    void submitApplication(const string& name, const string& address, const string& region) {
        string id = generateId(region);
        time_t now = time(nullptr);
        stringstream ss;
        ss << "submit|" << id << "|" << name << "|" << address << "|" << region << "|" << now;
        writeCommand("submit", ss.str());
        loadApplicationsFromFile();
    }

    void processVerification(const string& id) {
        writeCommand("verify", id);
        loadApplicationsFromFile();
    }

    void editApplication(const string& id, const string& newName,
                         const string& newAddress, const string& newRegion) {
        stringstream ss;
        ss << id << "|" << newName << "|" << newAddress << "|" << newRegion;
        writeCommand("edit", ss.str());
        loadApplicationsFromFile();
    }

    void undoRevision(const string& id) {
        writeCommand("undo", id);
        loadApplicationsFromFile();
    }

    void displayQueue() {
        vector<Applicant> apps;
        inorderTraversal(root, apps);
        if (apps.empty()) { cout << "No applications." << endl; return; }
        int pos = 1;
        for (auto& app : apps) {
            cout << pos++ << ". ID: " << app.id
                 << " | Name: " << app.name
                 << " | Region: " << app.region
                 << " | Status: " << app.status
                 << " | Submitted: " << ctime(&app.submissionTime);
        }
    }

    void refreshData() {
        system(("node \"" + projectRoot + "/scripts/sync_data.js\"").c_str());
        loadApplicationsFromFile();
    }
};

int main() {
    cout << "Starting KTP System with BST..." << endl;
    KtpSystem system;
    while (true) {
        cout << "\n=== KTP Management System ==="
             << "\n1. Submit New Application"
             << "\n2. Process Verification"
             << "\n3. Edit Application"
             << "\n4. Undo Revision"
             << "\n5. Show Queue"
             << "\n6. Refresh Data from Server"
             << "\n9. Exit"
             << "\nEnter choice: ";
        int choice;
        cin >> choice;
        cin.ignore();
        if (choice == 9) break;
        string id, name, address, region;
        switch (choice) {
            case 1:
                cout << "Enter name: "; getline(cin, name);
                cout << "Enter address: "; getline(cin, address);
                cout << "Enter region: "; getline(cin, region);
                system.submitApplication(name, address, region);
                break;
            case 2:
                cout << "Enter application ID to verify: "; getline(cin, id);
                system.processVerification(id);
                break;
            case 3:
                cout << "Enter application ID to edit: "; getline(cin, id);
                cout << "Enter new name: "; getline(cin, name);
                cout << "Enter new address: "; getline(cin, address);
                cout << "Enter new region: "; getline(cin, region);
                system.editApplication(id, name, address, region);
                break;
            case 4:
                cout << "Enter application ID to undo revision: "; getline(cin, id);
                system.undoRevision(id);
                break;
            case 5:
                system.displayQueue();
                break;
            case 6:
                system.refreshData();
                break;
            default:
                cout << "Invalid choice, please try again." << endl;
        }
    }
    return 0;
}
