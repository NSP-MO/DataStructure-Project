@echo off
echo Setting up KTP System with Supabase integration...

REM Sync data from Supabase first
echo Syncing data from Supabase...
node scripts/sync_data.js

REM Run the C++ program
echo.
echo Starting KTP System...
echo.
C:\Users\Hp\Documents\workspace\CS60\Semester4\Strukdat\DataStructure-Project\cpp\output\ktp_system_bst.exe

echo Done.
