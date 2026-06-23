import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractConversationInsights(callLogId: string, transcript: string, summary: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[Conversation Insights] OPENAI_API_KEY is missing. Skipping insight extraction.");
    return;
  }

  const prompt = `
    You are an expert conversational intelligence analyst.
    Analyze the following call transcript and summary.
    
    Extract the following JSON strictly:
    {
      "intent": "Short 2-4 word description of why they called (e.g. 'Support Request', 'Pricing Inquiry', 'Table Booking')",
      "sentiment": "POSITIVE", "NEUTRAL", or "NEGATIVE",
      "bookingRequested": boolean,
      "leadQualified": boolean
    }
    
    Transcript:
    ${transcript}
    
    Summary:
    ${summary}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    await prisma.conversationInsight.create({
      data: {
        callId: callLogId,
        summary: summary || "",
        intent: result.intent || "Unknown",
        sentiment: result.sentiment || "NEUTRAL",
        bookingRequested: result.bookingRequested || false,
        leadQualified: result.leadQualified || false,
      },
    });

    console.log(`[Conversation Insights] Extracted insights for CallLog ${callLogId}`);
  } catch (error) {
    console.error("[Conversation Insights] Failed to extract insights:", error);
  }
}
