import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for server-side usage
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
