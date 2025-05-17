@echo off
echo Setting up KTP System with Supabase integration...

REM Create necessary directories
mkdir data 2>nul

REM Create .env file with Supabase credentials
echo Creating .env file with Supabase credentials...
echo NEXT_PUBLIC_SUPABASE_URL=https://kohsgblrsoptwyqwnnlr.supabase.co > .env
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaHNnYmxyc29wdHd5cXdubmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjY4MzcsImV4cCI6MjA2MzA0MjgzN30.SyHoT0rNFxLiZXXV0NEnv4RpizqrNtTYeR0J04c--EE >> .env
echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaHNnYmxyc29wdHd5cXdubmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ2NjgzNywiZXhwIjoyMDYzMDQyODM3fQ.cG2rNW19OsOBMvmov2BP-sDkTEepjItY7X3ElNW5QnA >> .env

REM Install Node.js dependencies
echo Installing Node.js dependencies...
call npm install @supabase/supabase-js dotenv

REM Sync data from Supabase
echo Syncing data from Supabase...
node scripts/sync_data.js

echo Setup complete. You can now run the KTP System.
echo To run the system, use: run_ktp.bat
