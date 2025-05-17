import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// File path for data storage
const DATA_FILE_PATH = path.join(process.cwd(), "data", "ktp_applications.json")

// GET handler to retrieve applications
export async function GET() {
  try {
    // Ensure the file exists
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return NextResponse.json({ applications: [] })
    }

    // Read the file
    const data = fs.readFileSync(DATA_FILE_PATH, "utf8")
    const applications = JSON.parse(data)

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Error reading applications:", error)
    return NextResponse.json({ error: "Failed to read applications" }, { status: 500 })
  }
}
