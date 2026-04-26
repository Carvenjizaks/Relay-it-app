import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get current user to check if authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Test 1: Check if we can get any campaigns (respects RLS)
    const { data: allCampaigns, error: allError, count: allCount } = await supabase
      .from("campaigns")
      .select("*", { count: "exact" })

    // Test 2: Check campaigns table with specific columns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    // Test 3: Check contacts table
    const { data: contacts, error: contactsError, count: contactsCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .limit(10)

    // Check if tables exist and have data (for admin/debug purposes)
    let totalCampaignsInDB = 0
    let totalContactsInDB = 0
    
    // Try to get counts using a different method (RPC if available)
    try {
      const { count: cCount } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
      totalCampaignsInDB = cCount || 0
    } catch {}
    
    try {
      const { count: ctCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
      totalContactsInDB = ctCount || 0
    } catch {}

    // Return detailed results
    return Response.json({
      success: true,
      message: "Database test completed",
      auth: {
        is_authenticated: !!user,
        user_id: user?.id || null,
        email: user?.email || null
      },
      tests: {
        all_campaigns_query: allError ? `Error: ${allError.message}` : "OK",
        campaigns_query: campaignsError ? `Error: ${campaignsError.message}` : "OK",
        contacts_query: contactsError ? `Error: ${contactsError.message}` : "OK"
      },
      data: {
        visible_to_user: {
          campaigns_count: allCount,
          contacts_count: contactsCount
        },
        sample_campaigns: campaigns?.map(c => ({ 
          id: c.id, 
          title: c.title,
          created_at: c.created_at 
        })) || [],
        sample_contacts: contacts?.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          campaign_id: c.campaign_id,
          created_at: c.created_at
        })) || [],
        errors: {
          all: allError?.message || null,
          campaigns: campaignsError?.message || null,
          contacts: contactsError?.message || null
        }
      },
      explanation: !user 
        ? "You are not authenticated. RLS policies hide data from unauthenticated users. Login to see your campaigns and contacts."
        : allCount === 0 
          ? "You are authenticated but no campaigns are visible. Campaigns may be owned by a different user or RLS policies need adjustment."
          : "Data is visible. Database is working correctly."
    })
  } catch (error) {
    console.error("[DB Test] Error:", error)
    return Response.json(
      { 
        error: "Unexpected error during database test", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
