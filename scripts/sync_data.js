// Load environment variables from .env file
require("dotenv").config()

const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

// Get Supabase credentials from environment variables
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if environment variables are loaded
if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are not set.")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "***" : "undefined")

  // Hardcode the values as a fallback
  console.log("Using hardcoded Supabase credentials as fallback...")
  supabaseUrl = "https://kohsgblrsoptwyqwnnlr.supabase.co"
  supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaHNnYmxyc29wdHd5cXdubmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ2NjgzNywiZXhwIjoyMDYzMDQyODM3fQ.cG2rNW19OsOBMvmov2BP-sDkTEepjItY7X3ElNW5QnA"
}

console.log("Connecting to Supabase at:", supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseKey)

// File paths - use path.join for cross-platform compatibility
const dataDir = path.join(process.cwd(), "data")
const applicationsFilePath = path.join(dataDir, "ktp_applications_sync.txt")
const responseFilePath = path.join(dataDir, "ktp_response.txt")

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Helper function to write response
function writeResponse(message) {
  fs.writeFileSync(responseFilePath, message)
  console.log(message)
}

// Sync data from Supabase to local file
async function syncFromSupabase() {
  try {
    console.log("Syncing data from Supabase...")

    // Get all applications from Supabase
    const { data, error } = await supabase
      .from("ktp_applications")
      .select("*")
      .order("submission_time", { ascending: true })

    if (error) {
      writeResponse(`Error fetching applications: ${error.message}`)
      return
    }

    // Write applications to file
    let fileContent = ""
    if (data && data.length > 0) {
      for (const app of data) {
        fileContent += `${app.id}|${app.name}|${app.address}|${app.region}|${app.submission_time}|${app.status}\n`
      }
      fs.writeFileSync(applicationsFilePath, fileContent)
      writeResponse(`Successfully synced ${data.length} applications from Supabase.`)
    } else {
      fs.writeFileSync(applicationsFilePath, "")
      writeResponse("No applications found in Supabase.")
    }
  } catch (error) {
    writeResponse(`Error: ${error.message}`)
  }
}

// Main function
async function main() {
  try {
    await syncFromSupabase()
  } catch (error) {
    writeResponse(`Error: ${error.message}`)
  }
}

// Run the main function
main()
