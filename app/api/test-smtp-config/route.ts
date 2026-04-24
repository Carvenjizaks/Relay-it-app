import { smtpConfig } from "@/lib/smtp-config"

export async function GET() {
  // Step 1: Verify API key by listing channels
  try {
    const channelsRes = await fetch("https://api.smtp.com/v4/channels", {
      headers: {
        "Authorization": `Bearer ${smtpConfig.apiKey}`,
      },
    })

    const channelsData = await channelsRes.json()

    if (!channelsRes.ok) {
      return Response.json({
        status: "fail",
        step: "api_key_check",
        error: "Invalid API key",
        details: channelsData,
      })
    }

    // Step 2: Check if our channel exists
    const channels = channelsData?.data?.items || channelsData?.data || []
    const channelNames = Array.isArray(channels) ? channels.map((c: { name?: string }) => c.name) : []

    return Response.json({
      status: "ok",
      apiKeyValid: true,
      configuredChannel: smtpConfig.channel,
      availableChannels: channelNames,
      channelFound: channelNames.includes(smtpConfig.channel),
      senderEmail: smtpConfig.senderEmail,
      senderName: smtpConfig.senderName,
    })
  } catch (error) {
    return Response.json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
