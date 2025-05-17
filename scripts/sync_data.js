const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
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
    for (const app of data) {
      fileContent += `${app.id}|${app.name}|${app.address}|${app.region}|${app.submission_time}|${app.status}\n`
    }

    fs.writeFileSync(applicationsFilePath, fileContent)
    writeResponse(`Successfully synced ${data.length} applications from Supabase.`)
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
