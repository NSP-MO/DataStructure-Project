@echo off
echo Setting up KTP System with Supabase integration...

REM Sync data from Supabase first
echo Syncing data from Supabase...
node scripts/sync_data.js

REM Run the C++ program
echo.
echo Starting KTP System...
echo.
ktp_system_simple.exe

echo Done.
