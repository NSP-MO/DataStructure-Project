"use server"

import type { Applicant, ApplicationFormData } from "./types"
import { supabase } from "./supabase"

// Generate a unique ID based on region and timestamp
const generateId = (region: string): string => {
  return `${region}-${Date.now()}`
}

// Get all applications
export async function getApplications(): Promise<Applicant[]> {
  const { data, error } = await supabase
    .from("ktp_applications")
    .select("*")
    .order("submission_time", { ascending: true })

  if (error) {
    console.error("Error fetching applications:", error)
    return []
  }

  return data as Applicant[]
}

// Submit a new application
export async function submitApplication(formData: ApplicationFormData): Promise<Applicant> {
  const newApplication: Applicant = {
    id: generateId(formData.region),
    name: formData.name,
    address: formData.address,
    region: formData.region,
    submissionTime: Date.now(),
    status: "pending",
  }

  const { error } = await supabase.from("ktp_applications").insert(newApplication)

  if (error) {
    console.error("Error submitting application:", error)
    throw new Error("Failed to submit application")
  }

  return newApplication
}

// Process verification for an application
export async function processVerification(id: string): Promise<boolean> {
  const { error } = await supabase.from("ktp_applications").update({ status: "verified" }).eq("id", id)

  if (error) {
    console.error("Error verifying application:", error)
    return false
  }

  return true
}

// Edit an application
export async function editApplication(id: string, formData: ApplicationFormData): Promise<Applicant | null> {
  // First get the current application
  const { data: currentApp, error: fetchError } = await supabase
    .from("ktp_applications")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !currentApp) {
    console.error("Error fetching application for edit:", fetchError)
    return null
  }

  // Store the original application in the revision table
  const { error: revisionError } = await supabase.from("ktp_revisions").insert({
    application_id: id,
    name: currentApp.name,
    address: currentApp.address,
    region: currentApp.region,
    submission_time: currentApp.submissionTime,
    status: currentApp.status,
    revision_time: Date.now(),
  })

  if (revisionError) {
    console.error("Error storing revision:", revisionError)
    return null
  }

  // Update the application
  const updatedApp: Applicant = {
    ...currentApp,
    name: formData.name,
    address: formData.address,
    region: formData.region,
    status: "revision",
  }

  const { error: updateError } = await supabase
    .from("ktp_applications")
    .update({
      name: formData.name,
      address: formData.address,
      region: formData.region,
      status: "revision",
    })
    .eq("id", id)

  if (updateError) {
    console.error("Error updating application:", updateError)
    return null
  }

  return updatedApp
}

// Undo a revision
export async function undoRevision(id: string): Promise<Applicant | null> {
  // Get the latest revision for this application
  const { data: revisions, error: fetchError } = await supabase
    .from("ktp_revisions")
    .select("*")
    .eq("application_id", id)
    .order("revision_time", { ascending: false })
    .limit(1)

  if (fetchError || !revisions || revisions.length === 0) {
    console.error("Error fetching revisions:", fetchError)
    return null
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
    console.error("Error restoring revision:", updateError)
    return null
  }

  // Delete the revision
  const { error: deleteError } = await supabase.from("ktp_revisions").delete().eq("id", lastRevision.id)

  if (deleteError) {
    console.error("Error deleting revision:", deleteError)
  }

  // Return the restored application
  const restoredApp: Applicant = {
    id,
    name: lastRevision.name,
    address: lastRevision.address,
    region: lastRevision.region,
    submissionTime: lastRevision.submission_time,
    status: lastRevision.status,
  }

  return restoredApp
}

// Sort applications by region
export async function sortByRegion(): Promise<Applicant[]> {
  const { data, error } = await supabase.from("ktp_applications").select("*").order("region", { ascending: true })

  if (error) {
    console.error("Error sorting by region:", error)
    return []
  }

  return data as Applicant[]
}

// Sort applications by submission time
export async function sortByTime(): Promise<Applicant[]> {
  const { data, error } = await supabase
    .from("ktp_applications")
    .select("*")
    .order("submission_time", { ascending: true })

  if (error) {
    console.error("Error sorting by time:", error)
    return []
  }

  return data as Applicant[]
}
