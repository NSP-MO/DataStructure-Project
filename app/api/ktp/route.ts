import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET handler to retrieve all applications
export async function GET() {
  const { data, error } = await supabase
    .from("ktp_applications")
    .select("*")
    .order("submission_time", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data })
}

// POST handler to create a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.address || !body.region) {
      return NextResponse.json({ error: "Name, address, and region are required" }, { status: 400 })
    }

    const newApplication = {
      id: `${body.region}-${Date.now()}`,
      name: body.name,
      address: body.address,
      region: body.region,
      submission_time: Date.now(),
      status: "pending",
    }

    const { error } = await supabase.from("ktp_applications").insert(newApplication)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ application: newApplication }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
