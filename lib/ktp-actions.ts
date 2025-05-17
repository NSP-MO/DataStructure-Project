"use server"

import type { Applicant, ApplicationFormData } from "./types"
import fs from "fs"
import path from "path"

// File path for data storage
const DATA_FILE_PATH = path.join(process.cwd(), "data", "ktp_applications.json")
const REVISION_FILE_PATH = path.join(process.cwd(), "data", "ktp_revisions.json")

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Helper function to read applications from file
const readApplicationsFromFile = (): Applicant[] => {
  ensureDataDir()

  if (!fs.existsSync(DATA_FILE_PATH)) {
    return []
  }

  try {
    const data = fs.readFileSync(DATA_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading applications file:", error)
    return []
  }
}

// Helper function to write applications to file
const writeApplicationsToFile = (applications: Applicant[]) => {
  ensureDataDir()

  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(applications, null, 2))
  } catch (error) {
    console.error("Error writing applications file:", error)
  }
}

// Helper function to read revisions from file
const readRevisionsFromFile = (): Record<string, Applicant[]> => {
  ensureDataDir()

  if (!fs.existsSync(REVISION_FILE_PATH)) {
    return {}
  }

  try {
    const data = fs.readFileSync(REVISION_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading revisions file:", error)
    return {}
  }
}

// Helper function to write revisions to file
const writeRevisionsToFile = (revisions: Record<string, Applicant[]>) => {
  ensureDataDir()

  try {
    fs.writeFileSync(REVISION_FILE_PATH, JSON.stringify(revisions, null, 2))
  } catch (error) {
    console.error("Error writing revisions file:", error)
  }
}

// Generate a unique ID based on region and timestamp
const generateId = (region: string): string => {
  return `${region}-${Date.now()}`
}

// Get all applications
export async function getApplications(): Promise<Applicant[]> {
  return readApplicationsFromFile()
}

// Submit a new application
export async function submitApplication(formData: ApplicationFormData): Promise<Applicant> {
  const applications = readApplicationsFromFile()

  const newApplication: Applicant = {
    id: generateId(formData.region),
    name: formData.name,
    address: formData.address,
    region: formData.region,
    submissionTime: Date.now(),
    status: "pending",
  }

  applications.push(newApplication)
  writeApplicationsToFile(applications)

  return newApplication
}

// Process verification for an application
export async function processVerification(id: string): Promise<boolean> {
  const applications = readApplicationsFromFile()

  const appIndex = applications.findIndex((app) => app.id === id)
  if (appIndex === -1) return false

  applications[appIndex].status = "verified"
  writeApplicationsToFile(applications)

  return true
}

// Edit an application
export async function editApplication(id: string, formData: ApplicationFormData): Promise<Applicant | null> {
  const applications = readApplicationsFromFile()

  // Find the application
  const appIndex = applications.findIndex((app) => app.id === id)
  if (appIndex === -1) return null

  // Store the original application in the revision stack
  const revisions = readRevisionsFromFile()

  if (!revisions[id]) {
    revisions[id] = []
  }

  revisions[id].push({ ...applications[appIndex] })
  writeRevisionsToFile(revisions)

  // Update the application
  const updatedApp: Applicant = {
    ...applications[appIndex],
    name: formData.name,
    address: formData.address,
    region: formData.region,
    status: "revision",
  }

  applications[appIndex] = updatedApp
  writeApplicationsToFile(applications)

  return updatedApp
}

// Undo a revision
export async function undoRevision(id: string): Promise<Applicant | null> {
  const applications = readApplicationsFromFile()
  const revisions = readRevisionsFromFile()

  if (!revisions[id] || revisions[id].length === 0) {
    return null
  }

  // Find the application
  const appIndex = applications.findIndex((app) => app.id === id)
  if (appIndex === -1) return null

  // Get the last revision
  const lastRevision = revisions[id].pop()
  if (!lastRevision) return null

  // Update revisions file
  writeRevisionsToFile(revisions)

  // Restore the application
  applications[appIndex] = lastRevision
  writeApplicationsToFile(applications)

  return lastRevision
}

// Sort applications by region
export async function sortByRegion(): Promise<Applicant[]> {
  const applications = readApplicationsFromFile()

  const sorted = [...applications].sort((a, b) => a.region.localeCompare(b.region))
  writeApplicationsToFile(sorted)

  return sorted
}

// Sort applications by submission time
export async function sortByTime(): Promise<Applicant[]> {
  const applications = readApplicationsFromFile()

  const sorted = [...applications].sort((a, b) => a.submissionTime - b.submissionTime)
  writeApplicationsToFile(sorted)

  return sorted
}
