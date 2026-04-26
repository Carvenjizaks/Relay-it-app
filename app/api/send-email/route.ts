import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      campaignId,
      recipientEmail,
      recipientName,
      senderName,
      senderEmail,
      subject,
      htmlContent,
      eventUrl,
      relayToken,
      contactId,
    } = body

    const supabase = await createClient()

    // Get campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Email sending is disabled - SMTP removed
    // TODO: Implement new email provider
    return Response.json(
      { error: "Email sending is currently disabled. Please configure a new email provider." },
      { status: 503 }
    )
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
