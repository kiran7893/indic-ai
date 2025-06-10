"use client";

import { useState } from "react";
import Image from "next/image";
import Head from "next/head";

interface StanzaContent {
  original: string;
  transliteration?: string;
  translation: string;
}

interface ResponseData {
  language: string;
  isPoem: boolean;
  content: StanzaContent[] | string;
  translation?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  rawResponse?: string;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image file is too large. Please select an image under 10MB.");
        return;
      }

      setImage(file);
      setResponse(null);
      setError(null);
      setDebugInfo(null);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);

      reader.onload = async () => {
        try {
          const dataUrl = reader.result?.toString();
          if (!dataUrl) throw new Error("Failed to read image file");

          const base64Image = dataUrl.split(",")[1];
          if (!base64Image) throw new Error("Invalid image format");

          console.log("Sending request to API...");
          const apiResponse = await fetch("/api/process-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Image }),
          });

          console.log("API Response status:", apiResponse.status);

          if (!apiResponse.ok) {
            const errorData: ErrorResponse = await apiResponse.json();
            console.error("API Error:", errorData);

            // Show detailed error information
            let errorMessage =
              errorData.error || `HTTP Error: ${apiResponse.status}`;
            if (errorData.details) {
              errorMessage += `\n\nDetails: ${errorData.details}`;
            }
            if (errorData.rawResponse) {
              setDebugInfo(`Raw API Response: ${errorData.rawResponse}`);
            }

            throw new Error(errorMessage);
          }

          const data: ResponseData = await apiResponse.json();
          console.log("Received data:", data);

          // Validate response structure
          if (!data || typeof data !== "object") {
            throw new Error("Invalid response format from server");
          }

          if (!data.language || typeof data.isPoem !== "boolean") {
            throw new Error("Incomplete response data from server");
          }

          setResponse(data);
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }
      };

      reader.onerror = () => {
        throw new Error("Failed to read the selected image file");
      };
    } catch (err: unknown) {
      console.error("Processing error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Poem Transliteration and Translation</title>
        <meta
          name="description"
          content="Upload a poem image to get its transliteration and translation"
        />
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
        <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Poem Transliteration and Translation
          </h1>

          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>

          {image && (
            <div className="mb-4">
              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded poem"
                width={300}
                height={300}
                className="rounded mx-auto"
                style={{ objectFit: "contain" }}
              />
              <p className="text-sm text-gray-600 text-center mt-2">
                {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          <button
            onClick={processImage}
            disabled={!image || loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Process Image"
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700 whitespace-pre-wrap">{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="text-red-600 cursor-pointer">
                    Debug Information
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-auto">
                    {debugInfo}
                  </pre>
                </details>
              )}
            </div>
          )}

          {response && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Results</h2>
              <p className="text-gray-700 mb-4">
                Detected Language:{" "}
                <span className="font-medium">{response.language}</span>
              </p>

              {response.isPoem ? (
                <div>
                  <h3 className="text-lg font-medium mb-3">Poem Analysis</h3>
                  {(response.content as StanzaContent[]).map(
                    (stanza, index: number) => (
                      <div
                        key={index}
                        className="mb-6 p-4 bg-gray-50 rounded-lg"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Stanza {index + 1}
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-1">
                              Original Text:
                            </h5>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {stanza.original}
                            </p>
                          </div>

                          {stanza.transliteration && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-1">
                                Romanized Transliteration:
                              </h5>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {stanza.transliteration}
                              </p>
                            </div>
                          )}

                          <div>
                            <h5 className="font-medium text-gray-800 mb-1">
                              English Translation:
                            </h5>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {stanza.translation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Extracted Text
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">
                        Original Text:
                      </h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {response.content as string}
                      </p>
                    </div>

                    {response.translation && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">
                          English Translation:
                        </h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {response.translation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
