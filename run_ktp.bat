@echo off
echo Setting up KTP System with Supabase integration...

REM Create necessary directories
mkdir data 2>nul

REM Install Node.js dependencies if needed
npm install @supabase/supabase-js

REM Sync data from Supabase first
node scripts/sync_data.js

REM Run the C++ program
echo.
echo Starting KTP System...
echo.
ktp_system_simple.exe

echo Done.
