import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { language, topic } = await req.json();

    if (!language || !topic) {
      return NextResponse.json({ error: 'Language and topic are required' }, { status: 400 });
    }

    const prompt = `You are an expert programming instructor. 
Create a comprehensive, engaging tutorial for the topic "${topic}" in the programming language "${language}".
At the very end of the markdown tutorial, you MUST include a "Practice Exercises" section containing 3-5 coding challenges related to the topic.
Your response MUST be a valid JSON object matching this exact structure:

{
  "content": "A detailed Markdown string containing the lesson tutorial. Use headings, code blocks, bold text, and clear explanations. End with a 'Practice Exercises' section.",
  "mcqs": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0, // The index of the correct option (0-3)
      "explanation": "Why this answer is correct."
    }
  ]
}

DO NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY the raw JSON object. You MUST generate exactly 10 multiple choice questions.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error("No response generated.");
    }

    const data = JSON.parse(responseContent);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Lesson Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
