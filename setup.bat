@echo off
echo Setting up KTP System with Supabase integration...

REM Create necessary directories
mkdir data 2>nul

REM Install Node.js dependencies
echo Installing Node.js dependencies...
call npm install @supabase/supabase-js dotenv

REM Setup environment variables
echo Setting up environment variables...
node scripts/setup_env.js

REM Sync data from Supabase
echo Syncing data from Supabase...
node scripts/sync_data.js

echo Setup complete. You can now run the KTP System.
echo To run the system, use: run_ktp.bat
