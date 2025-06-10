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

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setResponse(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = async () => {
        const base64Image = reader.result?.toString().split(",")[1];
        if (!base64Image) throw new Error("Invalid image format");

        const apiResponse = await fetch("/api/process-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });
        const data = await apiResponse.json();
        if (data.error) throw new Error(data.error);
        setResponse(data);
      };
      reader.onerror = () => {
        throw new Error("Failed to read image");
      };
    } catch (err: unknown) {
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
          </div>
          {image && (
            <div className="mb-4">
              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded poem"
                width={300}
                height={300}
                className="rounded"
              />
            </div>
          )}
          <button
            onClick={processImage}
            disabled={!image || loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Process Image"}
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {response && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Results</h2>
              <p className="text-gray-700 mb-4">
                Detected Language: {response.language}
              </p>
              {response.isPoem ? (
                (response.content as StanzaContent[]).map(
                  (stanza, index: number) => (
                    <div key={index} className="mb-6 p-4 bg-gray-50 rounded">
                      <h3 className="font-semibold">Stanza {index + 1}</h3>
                      <div className="mt-2">
                        <h4 className="font-medium text-gray-800">
                          Original Text:
                        </h4>
                        <p className="text-gray-600">{stanza.original}</p>
                      </div>
                      {stanza.transliteration && (
                        <div className="mt-2">
                          <h4 className="font-medium text-gray-800">
                            Romanized Transliteration:
                          </h4>
                          <p className="text-gray-600">
                            {stanza.transliteration}
                          </p>
                        </div>
                      )}
                      <div className="mt-2">
                        <h4 className="font-medium text-gray-800">
                          English Translation:
                        </h4>
                        <p className="text-gray-600">{stanza.translation}</p>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold">Extracted Text</h3>
                  <div className="mt-2">
                    <h4 className="font-medium text-gray-800">
                      Original Text:
                    </h4>
                    <p className="text-gray-600">
                      {response.content as string}
                    </p>
                  </div>
                  {response.translation && (
                    <div className="mt-2">
                      <h4 className="font-medium text-gray-800">
                        English Translation:
                      </h4>
                      <p className="text-gray-600">{response.translation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
