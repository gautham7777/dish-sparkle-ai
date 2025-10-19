import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const cleanImagePrompt = "Clean all the dishes in this image, making them look sparkling clean. Do not change the background, the shape of the dishes, or the table. Only remove the dirt, smudges, and food residue from the dishes to make them look perfectly clean and new.";
const validationPrompt = `Does this image contain dirty dishes, such as plates, bowls, or cutlery with food residue, stains, or smudges? The image should be a photograph, not a drawing. Answer with only "yes" or "no".`;

const parseError = (error: unknown): string => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('api key not valid')) {
        return "Your API key is invalid. Please check your configuration.";
      }
      if (message.includes('quota')) {
        return "You have exceeded your API usage quota. Please check your billing and try again later.";
      }
      if (message.includes('deadline exceeded') || message.includes('timeout')) {
        return "The request timed out. Please check your internet connection and try again.";
      }
      if (message.includes('api error')) {
        return "An issue occurred with the AI service. Please try again later.";
      }
      return error.message;
    }
    return 'An unknown error occurred.';
  };
  

export const isImageOfDirtyDishes = async (dataUrl: string): Promise<boolean> => {
    const [header, base64Data] = dataUrl.split(',');
    if (!base64Data) {
      throw new Error("Invalid data URL provided for validation.");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: validationPrompt,
            },
          ],
        },
      });
  
      const validationText = response.text.trim().toLowerCase();
      return validationText === 'yes';
    } catch (error) {
      console.error("Error validating image content:", error);
      throw new Error(parseError(error));
    }
  };

export const generateCleanedImage = async (dataUrl: string): Promise<string> => {
  const [header, base64Data] = dataUrl.split(',');
  if (!base64Data) {
    throw new Error("Invalid data URL provided.");
  }
  
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: cleanImagePrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image data found in the API response.");

  } catch (error) {
    console.error("Error generating cleaned image:", error);
    throw new Error(parseError(error));
  }
};