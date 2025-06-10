import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing image data" },
        { status: 400 }
      );
    }

    // Validate base64 format (basic check)
    if (!image.match(/^[A-Za-z0-9+/=]+$/)) {
      return NextResponse.json(
        { error: "Invalid base64 image format" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and extract any text you find. Follow these rules:

1. If the text appears to be a poem (has verse structure, rhyme, or poetic formatting):
   - Detect the language
   - Structure as stanzas
   - For each stanza, provide: original text, transliteration (if not in Latin script), and English translation
   - Return: {"language": "detected_language", "isPoem": true, "content": [{"original": "text", "transliteration": "romanized_text", "translation": "english_translation"}]}

2. If the text is not a poem:
   - Extract the text as-is
   - Detect the language
   - Provide English translation if not in English
   - Return: {"language": "detected_language", "isPoem": false, "content": "extracted_text", "translation": "english_translation"}

IMPORTANT: 
- Always return valid JSON only
- No markdown formatting or additional text
- If no text is found, return: {"language": "unknown", "isPoem": false, "content": "No text detected", "translation": "No text detected"}
- Ensure all JSON strings are properly escaped`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
      max_tokens: 3000,
      temperature: 0.1, // Lower temperature for more consistent JSON output
    });

    const content = response.choices[0]?.message.content ?? "";

    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    // Clean the response - remove any markdown formatting or extra text
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\s*|\s*```/g, "");
    cleanedContent = cleanedContent.replace(/```\s*|\s*```/g, "");

    // Find JSON content between first { and last }
    const firstBrace = cleanedContent.indexOf("{");
    const lastBrace = cleanedContent.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("No JSON found in response:", content);
      return NextResponse.json(
        { error: "Invalid response format from OpenAI - no JSON found" },
        { status: 500 }
      );
    }

    const jsonString = cleanedContent.substring(firstBrace, lastBrace + 1);

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Original content:", content);
      console.error("Cleaned content:", jsonString);

      // Fallback: try to create a valid response
      return NextResponse.json(
        {
          error: "Failed to parse OpenAI response as JSON",
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error",
          rawResponse: content.substring(0, 500), // First 500 chars for debugging
        },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!result || typeof result !== "object") {
      return NextResponse.json(
        { error: "Invalid response object from OpenAI" },
        { status: 500 }
      );
    }

    // Ensure required fields exist with defaults
    const validatedResult = {
      language: result.language || "unknown",
      isPoem: Boolean(result.isPoem),
      content: result.content || "No content extracted",
      ...(result.translation && { translation: result.translation }),
    };

    interface Stanza {
      original?: string;
      transliteration?: string;
      translation?: string;
    }

    // Additional validation for poem structure
    if (validatedResult.isPoem && Array.isArray(validatedResult.content)) {
      validatedResult.content = validatedResult.content.map(
        (stanza: Stanza) => ({
          original: stanza.original || "",
          transliteration: stanza.transliteration || undefined,
          translation: stanza.translation || "",
        })
      );
    }

    return NextResponse.json(validatedResult);
  } catch (error: unknown) {
    console.error("API Route Error:", error);

    if (error instanceof Error) {
      // Check for specific OpenAI errors
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key is missing or invalid" },
          { status: 500 }
        );
      }

      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Processing failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred while processing the image" },
      { status: 500 }
    );
  }
}
