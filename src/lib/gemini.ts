import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have NEXT_PUBLIC_GEMINI_API_KEY in your .env.local
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function generateLearningRoadmap(language: string) {
  const prompt = `Create a comprehensive learning roadmap for a beginner to learn ${language}, starting from absolute basics and ending with Data Structures and Algorithms (DSA). Provide the response as a JSON array where each object has a 'title' (string), 'description' (string), and 'topics' (array of strings). Return ONLY the JSON, without markdown formatting like \`\`\`json.`;

  try {
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // Parse JSON
    try {
        return JSON.parse(textResponse);
    } catch (e) {
        // Fallback cleanup if the model returned markdown
        const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw new Error("Failed to generate learning roadmap.");
  }
}

export async function aiDebugger(code: string, language: string, context: string) {
    const prompt = `You are an expert AI debugger. The user is writing code in ${language}. They are trying to achieve the following: "${context}".\n\nHere is their code:\n\n${code}\n\nAnalyze the code, find any errors or potential bugs, and explain how to fix them. Provide corrected code snippets where appropriate. Be concise and helpful.`;
    
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error debugging code:", error);
        throw new Error("Failed to debug code.");
    }
}
