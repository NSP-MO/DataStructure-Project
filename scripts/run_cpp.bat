@echo off
echo Running KTP System with Supabase integration...

REM Sync data from Supabase first
call npm run sync

REM Run the C++ program
ktp_system_simple.exe

echo Done.
