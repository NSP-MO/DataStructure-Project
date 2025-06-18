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
  // Fallback to hardcoded values if needed (not recommended for production)
  console.log("Using hardcoded Supabase credentials as fallback...")
  supabaseUrl = "https://kohsgblrsoptwyqwnnlr.supabase.co"
  supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaHNnYmxyc29wdHd5cXdubmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ2NjgzNywiZXhwIjoyMDYzMDQyODM3fQ.cG2rNW19OsOBMvmov2BP-sDkTEepjItY7X3ElNW5QnA"
}

console.log("Connecting to Supabase at:", supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseKey)

// File paths
const dataDir = path.join(process.cwd(), "data")
const commandFilePath = path.join(dataDir, "ktp_command.txt")
const responseFilePath = path.join(dataDir, "ktp_response.txt")
const applicationsFilePath = path.join(dataDir, "ktp_applications_sync.txt")

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Helper function to write response
function writeResponse(message) {
  fs.writeFileSync(responseFilePath, message)
  console.log(message)
}

// Helper function to write all applications to a sync file
async function writeApplicationsToFile() {
  try {
    const { data, error } = await supabase
      .from("ktp_applications")
      .select("*")
      .order("submission_time", { ascending: true })

    if (error) {
      writeResponse(`Error fetching applications: ${error.message}`)
      return
    }

    const fileContent =
      data?.map((app) => `${app.id}|${app.name}|${app.address}|${app.region}|${app.submission_time}|${app.status}`).join("\n") + "\n"

    fs.writeFileSync(applicationsFilePath, fileContent)
    writeResponse(`Successfully synced ${data ? data.length : 0} applications from Supabase.`)
  } catch (error) {
    writeResponse(`Error writing applications to file: ${error.message}`)
  }
}

// Handle submit command
async function handleSubmit(data) {
  try {
    const parts = data.split("|")
    if (parts.length < 6) {
      writeResponse("Invalid submit data format.")
      return
    }

    const [id, name, address, region, submissionTimeStr, status] = parts
    const submissionTime = parseInt(submissionTimeStr, 10)

    if (isNaN(submissionTime)) {
      writeResponse(`Invalid submission time format: "${submissionTimeStr}"`)
      return
    }

    const { error } = await supabase.from("ktp_applications").insert({
      id,
      name,
      address,
      region,
      submission_time: submissionTime, // Store time as provided by C++
      status,
    })

    if (error) {
      writeResponse(`Error submitting application: ${error.message}`)
      return
    }

    writeResponse(`Application submitted successfully. ID: ${id}`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error in handleSubmit: ${error.message}`)
  }
}

// Handle verify command
async function handleVerify(id) {
  try {
    const { error } = await supabase.from("ktp_applications").update({ status: "verified" }).eq("id", id)
    if (error) throw error
    writeResponse(`Application ${id} has been verified.`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error verifying application: ${error.message}`)
  }
}

// Handle edit command
async function handleEdit(data) {
  try {
    const parts = data.split("|")
    if (parts.length < 4) {
      writeResponse("Invalid edit data format.")
      return
    }

    const [id, newName, newAddress, newRegion] = parts

    const { data: currentApp, error: fetchError } = await supabase
      .from("ktp_applications")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const { error: revisionError } = await supabase.from("ktp_revisions").insert({
      application_id: id,
      name: currentApp.name,
      address: currentApp.address,
      region: currentApp.region,
      submission_time: currentApp.submission_time,
      status: currentApp.status,
      revision_time: new Date().toISOString(),
    })

    if (revisionError) throw revisionError

    const { error: updateError } = await supabase
      .from("ktp_applications")
      .update({ name: newName, address: newAddress, region: newRegion, status: "revision" })
      .eq("id", id)

    if (updateError) throw updateError

    writeResponse(`Application updated. ID: ${id}`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error editing application: ${error.message}`)
  }
}

// Handle undo command
async function handleUndo(id) {
  try {
    const { data: revisions, error: fetchError } = await supabase
      .from("ktp_revisions")
      .select("*")
      .eq("application_id", id)
      .order("revision_time", { ascending: false })
      .limit(1)

    if (fetchError) throw fetchError
    if (!revisions || revisions.length === 0) {
      writeResponse(`No revisions found for application ${id}`)
      return
    }

    const lastRevision = revisions[0]
    const { error: updateError } = await supabase
      .from("ktp_applications")
      .update({
        name: lastRevision.name,
        address: lastRevision.address,
        region: lastRevision.region,
        status: lastRevision.status,
      })
      .eq("id", id)

    if (updateError) throw updateError

    await supabase.from("ktp_revisions").delete().eq("id", lastRevision.id)

    writeResponse(`Revision undone for application ${id}`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error undoing revision: ${error.message}`)
  }
}

// Process command from file
async function processCommand() {
  try {
    if (!fs.existsSync(commandFilePath)) {
      writeResponse("Command file not found.")
      return
    }

    const fileContent = fs.readFileSync(commandFilePath, "utf8").split("\n")
    const command = fileContent[0]?.trim()
    const data = fileContent[1]?.trim()

    if (!command || !data) {
      writeResponse("Invalid command file format.")
      return
    }

    console.log(`Processing command: ${command}`)

    switch (command) {
      case "submit":
        await handleSubmit(data)
        break
      case "verify":
        await handleVerify(data)
        break
      case "edit":
        await handleEdit(data)
        break
      case "undo":
        await handleUndo(data)
        break
      case "refresh":
        await writeApplicationsToFile()
        break
      default:
        writeResponse(`Unknown command: ${command}`)
    }
  } catch (error) {
    writeResponse(`Error processing command: ${error.message}`)
  }
}

// Main function
async function main() {
  console.log("Starting command processing...")
  await processCommand()
  console.log("Command processing complete.")
}

main().catch((error) => writeResponse(`Unhandled error in main: ${error.message}`))