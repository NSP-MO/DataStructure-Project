const fs = require("fs")
const path = require("path")

// Check if .env file exists, if not create it
const envPath = path.join(process.cwd(), ".env")
if (!fs.existsSync(envPath)) {
  console.log("Creating .env file with Supabase credentials...")

  const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://yoethrjvsfleuyavgflw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZXRocmp2c2ZsZXV5YXZnZmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjY2NzMsImV4cCI6MjA2MzA0MjY3M30.Yd_JBRhJkUmf1RXwHULwkNz2jd9Rg_QwgpYvHVoVxIk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZXRocmp2c2ZsZXV5YXZnZmx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ2NjY3MywiZXhwIjoyMDYzMDQyNjczfQ.0LKYk9ZB0KmeyW1kX-uv0KwEzAROqSE9sNOBvYkk1EE
`

  fs.writeFileSync(envPath, envContent)
  console.log(".env file created successfully.")
} else {
  console.log(".env file already exists.")
}

// Load environment variables
require("dotenv").config()

console.log("Environment setup complete.")
