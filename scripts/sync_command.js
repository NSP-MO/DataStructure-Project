const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// File paths
const commandFilePath = "data/ktp_command.txt"
const responseFilePath = "data/ktp_response.txt"
const applicationsFilePath = "data/ktp_applications_sync.txt"

// Helper function to write response
function writeResponse(message) {
  fs.writeFileSync(responseFilePath, message)
}

// Helper function to write applications to file
async function writeApplicationsToFile() {
  try {
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

// Process command
async function processCommand() {
  try {
    // Read command file
    const fileContent = fs.readFileSync(commandFilePath, "utf8").split("\n")
    const command = fileContent[0].trim()
    const data = fileContent[1].trim()

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

// Handle submit command
async function handleSubmit(data) {
  try {
    // Parse data
    // Format: submit|id|name|address|region|submissionTime
    const [_, id, name, address, region, submissionTimeStr] = data.split("|")
    const submissionTime = Number.parseInt(submissionTimeStr)

    // Insert into Supabase
    const { error } = await supabase.from("ktp_applications").insert({
      id,
      name,
      address,
      region,
      submission_time: submissionTime,
      status: "pending",
    })

    if (error) {
      writeResponse(`Error submitting application: ${error.message}`)
      return
    }

    writeResponse(`Application submitted successfully. ID: ${id}`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error submitting application: ${error.message}`)
  }
}

// Handle verify command
async function handleVerify(id) {
  try {
    // Update status in Supabase
    const { error } = await supabase.from("ktp_applications").update({ status: "verified" }).eq("id", id)

    if (error) {
      writeResponse(`Error verifying application: ${error.message}`)
      return
    }

    writeResponse(`Application ${id} has been verified.`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error verifying application: ${error.message}`)
  }
}

// Handle edit command
async function handleEdit(data) {
  try {
    // Parse data
    // Format: edit|id|newName|newAddress|newRegion
    const [_, id, newName, newAddress, newRegion] = data.split("|")

    // First get the current application
    const { data: currentApp, error: fetchError } = await supabase
      .from("ktp_applications")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      writeResponse(`Error fetching application: ${fetchError.message}`)
      return
    }

    // Store the original application in the revision table
    const { error: revisionError } = await supabase.from("ktp_revisions").insert({
      application_id: id,
      name: currentApp.name,
      address: currentApp.address,
      region: currentApp.region,
      submission_time: currentApp.submission_time,
      status: currentApp.status,
      revision_time: Date.now(),
    })

    if (revisionError) {
      writeResponse(`Error storing revision: ${revisionError.message}`)
      return
    }

    // Update the application
    const { error: updateError } = await supabase
      .from("ktp_applications")
      .update({
        name: newName,
        address: newAddress,
        region: newRegion,
        status: "revision",
      })
      .eq("id", id)

    if (updateError) {
      writeResponse(`Error updating application: ${updateError.message}`)
      return
    }

    writeResponse(`Application updated. ID: ${id}`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error editing application: ${error.message}`)
  }
}

// Handle undo command
async function handleUndo(id) {
  try {
    // Get the latest revision for this application
    const { data: revisions, error: fetchError } = await supabase
      .from("ktp_revisions")
      .select("*")
      .eq("application_id", id)
      .order("revision_time", { ascending: false })
      .limit(1)

    if (fetchError || !revisions || revisions.length === 0) {
      writeResponse(`No revisions found for application ${id}`)
      return
    }

    const lastRevision = revisions[0]

    // Update the application with the revision data
    const { error: updateError } = await supabase
      .from("ktp_applications")
      .update({
        name: lastRevision.name,
        address: lastRevision.address,
        region: lastRevision.region,
        status: lastRevision.status,
      })
      .eq("id", id)

    if (updateError) {
      writeResponse(`Error restoring revision: ${updateError.message}`)
      return
    }

    // Delete the revision
    const { error: deleteError } = await supabase.from("ktp_revisions").delete().eq("id", lastRevision.id)

    if (deleteError) {
      writeResponse(`Error deleting revision: ${deleteError.message}`)
    }

    writeResponse(`Revision undone for application ${id}`)
    await writeApplicationsToFile()
  } catch (error) {
    writeResponse(`Error undoing revision: ${error.message}`)
  }
}

// Main function
async function main() {
  try {
    await processCommand()
  } catch (error) {
    writeResponse(`Error: ${error.message}`)
  }
}

// Run the main function
main()
