import { generateText, Output } from "ai"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      campaignName, 
      description, 
      eventUrl, 
      eventDate, 
      eventLocation,
      targetAudience,
      tone,
      keyBenefits,
      callToAction 
    } = body

    const prompt = `Generate a professional and engaging email for the following event/campaign:

Campaign Name: ${campaignName}
Description: ${description}
Event/Registration URL: ${eventUrl}
${eventDate ? `Date: ${eventDate}` : ""}
${eventLocation ? `Location: ${eventLocation}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
${tone ? `Tone: ${tone}` : "Professional and friendly"}
${keyBenefits ? `Key Benefits/Highlights: ${keyBenefits}` : ""}
${callToAction ? `Call to Action: ${callToAction}` : "Register now"}

Requirements:
1. Create a compelling subject line
2. Write personalized greeting (use {{recipient_name}} as placeholder)
3. Engaging opening that captures attention
4. Clear description of the event/campaign value
5. Include the event URL prominently with clear call-to-action button text
6. Add a "Relay This" section at the end with this exact text: "Know someone who would benefit from this? Share this opportunity with them - just enter their name and email, and we'll send them a personalized invitation on your behalf."
7. Professional closing with sender name placeholder {{sender_name}}

The email should feel personal, not mass-marketed.`

    const result = await generateText({
      model: "openai/gpt-4o",
      prompt,
      output: Output.object({
        schema: z.object({
          subject: z.string().describe("Email subject line"),
          greeting: z.string().describe("Personalized greeting with {{recipient_name}} placeholder"),
          body: z.string().describe("Main email body content in HTML format"),
          callToActionText: z.string().describe("Text for the CTA button"),
          relaySection: z.string().describe("The relay/share section in HTML format"),
          closing: z.string().describe("Professional closing with {{sender_name}} placeholder"),
        }),
      }),
    })

    return Response.json({ email: result.output })
  } catch (error) {
    console.error("Error generating email:", error)
    return Response.json(
      { error: "Failed to generate email" },
      { status: 500 }
    )
  }
}
