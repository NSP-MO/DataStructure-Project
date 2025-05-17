import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET handler to retrieve a specific application
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  const { data, error } = await supabase.from("ktp_applications").select("*").eq("id", id).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 })
  }

  return NextResponse.json({ application: data })
}

// PUT handler to update an application
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.address || !body.region) {
      return NextResponse.json({ error: "Name, address, and region are required" }, { status: 400 })
    }

    // First get the current application
    const { data: currentApp, error: fetchError } = await supabase
      .from("ktp_applications")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: fetchError.code === "PGRST116" ? 404 : 500 })
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
      return NextResponse.json({ error: revisionError.message }, { status: 500 })
    }

    // Update the application
    const { data, error: updateError } = await supabase
      .from("ktp_applications")
      .update({
        name: body.name,
        address: body.address,
        region: body.region,
        status: "revision",
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ application: data })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

// PATCH handler to verify an application
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    if (!body.action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    if (body.action === "verify") {
      const { data, error } = await supabase
        .from("ktp_applications")
        .update({ status: "verified" })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ application: data })
    } else if (body.action === "undo") {
      // Get the latest revision for this application
      const { data: revisions, error: fetchError } = await supabase
        .from("ktp_revisions")
        .select("*")
        .eq("application_id", id)
        .order("revision_time", { ascending: false })
        .limit(1)

      if (fetchError || !revisions || revisions.length === 0) {
        return NextResponse.json({ error: "No revisions found" }, { status: 404 })
      }

      const lastRevision = revisions[0]

      // Update the application with the revision data
      const { data, error: updateError } = await supabase
        .from("ktp_applications")
        .update({
          name: lastRevision.name,
          address: lastRevision.address,
          region: lastRevision.region,
          status: lastRevision.status,
        })
        .eq("id", id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Delete the revision
      await supabase.from("ktp_revisions").delete().eq("id", lastRevision.id)

      return NextResponse.json({ application: data })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
