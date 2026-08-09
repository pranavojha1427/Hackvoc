import { NextResponse } from 'next/server';
import { generateLearningRoadmap } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { language } = await req.json();

    if (!language) {
      return NextResponse.json(
        { error: 'Language is required' },
        { status: 400 }
      );
    }

    const roadmap = await generateLearningRoadmap(language);
    
    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error('Roadmap API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap' },
      { status: 500 }
    );
  }
}
