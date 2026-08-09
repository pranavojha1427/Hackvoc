import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Database Directory
const DB_DIR = process.env.VERCEL || process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : path.resolve(process.cwd(), 'local_db');

// Helper to get user's db file path
const getUserDbPath = (userId: string) => path.join(DB_DIR, `${userId}.json`);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const language = url.searchParams.get('language');

    if (!userId || !language) {
      return NextResponse.json({ error: 'User ID and language are required' }, { status: 400 });
    }

    const dbPath = getUserDbPath(userId);
    
    if (!existsSync(dbPath)) {
       return NextResponse.json({ exists: false });
    }

    const fileContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(fileContent);

    if (db.roadmaps && db.roadmaps[language]) {
        return NextResponse.json({ exists: true, data: db.roadmaps[language] });
    }

    return NextResponse.json({ exists: false });

  } catch (error: any) {
    console.error('Local DB GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, language, action, data } = await req.json();

    if (!userId || !language || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!existsSync(DB_DIR)) {
      await fs.mkdir(DB_DIR, { recursive: true });
    }

    const dbPath = getUserDbPath(userId);
    let db: any = { roadmaps: {} };

    if (existsSync(dbPath)) {
      const fileContent = await fs.readFile(dbPath, 'utf-8');
      db = JSON.parse(fileContent);
    }

    if (!db.roadmaps) db.roadmaps = {};
    if (!db.roadmaps[language]) db.roadmaps[language] = { roadmap: [], completed: [], completedTopics: [] };

    if (action === 'save_roadmap') {
        db.roadmaps[language] = {
            ...db.roadmaps[language],
            roadmap: data.roadmap,
            createdAt: new Date().toISOString()
        };
    } else if (action === 'update_progress') {
        db.roadmaps[language] = {
            ...db.roadmaps[language],
            completed: data.completed
        };
    } else if (action === 'update_topic_progress') {
        const currentTopics = db.roadmaps[language].completedTopics || [];
        const newTopics = Array.from(new Set([...currentTopics, ...data.completedTopics]));
        db.roadmaps[language] = {
            ...db.roadmaps[language],
            completedTopics: newTopics
        };
    } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Local DB POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
