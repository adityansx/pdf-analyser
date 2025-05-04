"use server"

import { google } from "@ai-sdk/google"
import { generateText } from "ai"

/**
 * Generates a summary of a PDF document using Google Gemini
 * @param fileData - The PDF file data as Uint8Array
 * @param fileName - The name of the PDF file
 * @param prompt - The prompt to use for generating the summary
 * @returns The generated summary
 */
export async function summarizePdf(fileData: Uint8Array, fileName: string, prompt: string): Promise<string> {
  try {
    // Create a message with the PDF file and prompt
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "file",
              mimeType: "application/pdf",
              data: fileData,
              filename: fileName,
            },
          ],
        },
      ],
    })

    return text
  } catch (error) {
    console.error("Error generating summary:", error)
    return "Failed to generate summary. Please try again."
  }
}
