import Groq from "groq-sdk";

// Ensure you have NEXT_PUBLIC_GROQ_API_KEY in your .env.local
export const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || "dummy_key_to_pass_build" });

export async function generateLearningRoadmap(language: string) {
  const prompt = `Create a comprehensive learning roadmap for a beginner to learn ${language}, starting from absolute basics and ending with Data Structures and Algorithms (DSA). ${language.toLowerCase() === 'python' ? 'Ensure that you explicitly include lessons/modules dedicated to the NumPy and Pandas libraries.' : ''} Provide the response as a JSON array where each object has a 'title' (string), 'description' (string), and 'topics' (array of strings). Return ONLY the JSON, without markdown formatting like \`\`\`json.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });
    
    const textResponse = chatCompletion.choices[0]?.message?.content || "";
    
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

export async function aiDebugger(code: string, language: string, context: string, missingCompiler: boolean = false) {
    let prompt = '';
    
    if (missingCompiler) {
        prompt = `The user is trying to run code in ${language}, but their local Windows machine does not have the necessary compiler installed.
        Generate a very clear, step-by-step guide for the user on how to easily install the required compiler for ${language} on Windows (e.g., MinGW/gcc for C/C++, JDK for Java, .NET SDK for C#). 
        Include exactly what they should download or what command to run (e.g. winget). Make it friendly and concise.`;
    } else {
        const codeWithLines = code.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n');
        prompt = `You are an expert AI debugger. The user is writing code in ${language}. They are trying to achieve the following: "${context}".

Here is their code (with line numbers added for reference):

${codeWithLines}

Analyze the code, find any errors or potential bugs, and explain exactly how to fix them. You MUST clearly state the EXACT line number(s) that need to be changed or where new code should be inserted. Provide corrected code snippets where appropriate. Be concise and helpful.`;
    }
    
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
      });
      return chatCompletion.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
        console.error("Error debugging code:", error);
        throw new Error("Failed to debug code.");
    }
}
