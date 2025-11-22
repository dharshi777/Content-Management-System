
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBlogContent = async (title: string, currentContent: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert content writer for a high-end lifestyle blog. 
      Write a structured, engaging blog post HTML body based on the following title: "${title}".
      
      Existing content context (if any): "${currentContent.substring(0, 200)}..."

      Requirements:
      - Use semantic HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <strong>).
      - Do NOT include the <h1> title or <html>/<body> tags, just the body content.
      - Include a "Key Takeaways" section formatted as an HTML table with headers if appropriate for the topic.
      - Keep the tone professional yet accessible.
      - Length: Approximately 300-500 words.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};

export const improveGrammar = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Fix grammar, spelling, and improve flow of the following HTML content, keeping the HTML structure intact: ${text}`,
    });
    return response.text || text;
  } catch (error) {
    return text;
  }
};
