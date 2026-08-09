import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { language, topic, message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = `You are a friendly, encouraging, and expert AI tutor for a coding platform.
The user is currently learning about "${topic}" in "${language}".
Answer their questions directly, simply, and effectively. Use code examples when helpful. 
Keep your answers concise and focused on the topic to prevent overwhelming the student.`;

    // Construct the messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error("No response generated.");
    }

    return NextResponse.json({ response: responseContent });
    
  } catch (error) {
    console.error('Tutor API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
