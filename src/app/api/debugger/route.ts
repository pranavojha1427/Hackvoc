import { NextResponse } from 'next/server';
import { aiDebugger } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { code, language, context, missingCompiler } = await req.json();

    if ((!code || !language || !context) && !missingCompiler) {
      return NextResponse.json(
        { error: 'Code, language, and context are required' },
        { status: 400 }
      );
    }

    const result = await aiDebugger(code || "", language, context || "", missingCompiler);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Debugger API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze code' },
      { status: 500 }
    );
  }
}
