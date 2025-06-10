# Poem Transliteration and Translation App

This is a Next.js 15 application using the App Router that allows users to upload an image of a poem or text, processes it using the OpenAI API for OCR, transliteration, translation, and language detection, and displays the results in a structured format.

## Features

- Upload an image of a poem or any text
- Detect the language of the text
- For poems: Display original text, Romanized transliteration, and English translation for each stanza
- For non-poem text: Display extracted text and English translation
- Responsive UI with Tailwind CSS

## Prerequisites

- Node.js (v18 or higher, as Next.js 15 requires it)
- npm or yarn
- OpenAI API key (obtain from https://platform.openai.com/api-keys)

## Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd poem-transliteration-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your-api-key-here
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000** in your browser to view the app.

6. **Build for production (optional)**:
   ```bash
   npm run build
   npm run start
   ```

## Usage

1. Open the app in your browser.
2. Upload an image containing text (e.g., PNG, JPG).
3. Click "Process Image" to send the image to the OpenAI API.
4. View the detected language and either:
   - **For poems**: Original text, Romanized transliteration, and English translation for each stanza.
   - **For non-poems**: Extracted text and English translation.

## Notes

- Ensure the image is clear for accurate OCR results.
- The OpenAI API key must be kept secure and stored in a server-side environment variable (`OPENAI_API_KEY`) for production use.
- For API details, refer to https://platform.openai.com/docs/api-reference.
- The app handles both poem and non-poem text, but results are best for clear, text-based images.
- If you encounter 500 errors, verify your OpenAI API key, ensure the gpt-4o model is accessible, and check the image format.

## Bonus Features

- **Language Detection**: The app automatically detects the text's language using OpenAI's capabilities.
- **Non-Poem Support**: The app processes non-poem text (e.g., signs, receipts) by extracting and translating without stanza structure.
