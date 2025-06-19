# DataStructure-Project

A simple C++ application for managing KTP applications using a binary search tree (BST) with NextJs + Supabase data sync.

### Data Will Be Shown at: **[https://monitoring-ktp-strukdat.vercel.app](https://monitoring-ktp-strukdat.vercel.app/)**

---

## 🚀 Quick Start

### 1. Clone the Repo

\`\`\`bash
git clone https://github.com/NSP-MO/DataStructure-Project.git
cd DataStructure-Project
\`\`\`

### 2. Configure Your Supabase (optional)

Create a file named `.env` in the project root (next to `setup.bat`) with **your** Supabase credentials:

\`\`\`ini
# .env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<your-service-key>
\`\`\`

> Replace `<your-project-ref>` and `<your-service-key>` with the values from your Supabase dashboard.

---

## 🔧 Setup & Initial Sync

On **Windows**, just run:

\`\`\`batch
setup.bat
\`\`\`

This will:

1. Create necessary directories (`build/`, `data/`, etc.)
2. Install any required scripts/tools
3. Perform an initial sync of KTP data from **your** Supabase

---

## ▶️ Running the KTP System

After setup, start the app with:

\`\`\`batch
run_ktp.bat
\`\`\`

This will:

1. Sync the latest data from **your** Supabase
2. Launch the C++ console application

---

## 📋 Using the C++ Console

Once the app is running, you can:

1. **Submit** new KTP applications
2. **Process** pending verifications
3. **Edit** existing applications
4. **View & sort** the application queue
5. **Export** or **print** summaries
6. And more...

Follow on-screen menus to navigate.

---

## 🛠️ Build Manually

If you prefer to compile by hand:

\`\`\`bash
mkdir -p build
cd build
g++ -std=c++17 ../src/ktp_system_simple-bst.cpp -o ktp_system
./ktp_system
\`\`\`

---

## ❓ Troubleshooting

* **supabaseUrl is required**
  • Make sure your `.env` is in the project root, and `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` are correct.

* **Compiler errors**
  • Verify you’re using C++17 or later and that `src/ktp_system_simple-bst.cpp` exists.

* **Data not syncing**
  • Check network connectivity and that your Supabase project is active.

---
