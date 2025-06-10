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
      model: "gpt-4o", // Updated to gpt-4o for 2025 compatibility
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract any text from this image. If it’s a poem, detect its language, transliterate each line into Roman script, and provide a simple English translation with meanings, structuring the response as stanzas. If it’s not a poem, return the extracted text, detected language, and English translation without stanza structure. Return the response in JSON format: { language: string, isPoem: boolean, content: [{ original: string, transliteration?: string, translation: string }] or string, translation?: string }. Ensure the response is valid JSON.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
      max_tokens: 2000, // Increased to handle larger responses
    });

    const content = response.choices[0]?.message.content ?? "{}";
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json(
        { error: `Invalid JSON response from OpenAI: ${parseError}` },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!result.language || typeof result.isPoem !== "boolean") {
      return NextResponse.json(
        { error: "Invalid response structure from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process image",
      },
      { status: 500 }
    );
  }
}
