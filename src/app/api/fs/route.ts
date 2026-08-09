import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Helper to get workspace dir for a specific user
const getWorkspaceDir = (userId: string) => path.resolve(process.cwd(), 'practice_workspace', userId);

// Helper to ensure path is within user's workspace (prevent directory traversal)
function getSafePath(userId: string, reqPath: string) {
  const workspaceDir = getWorkspaceDir(userId);
  const safePath = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(workspaceDir, safePath);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const targetPath = url.searchParams.get('path') || '/';
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const workspaceDir = getWorkspaceDir(userId);
    const absolutePath = getSafePath(userId, targetPath);

    if (!existsSync(workspaceDir)) {
      await fs.mkdir(workspaceDir, { recursive: true });
    }

    if (action === 'readfile') {
      if (!existsSync(absolutePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const content = await fs.readFile(absolutePath, 'utf-8');
      return NextResponse.json({ content });
    } 
    
    // Default action: read directory tree
    async function readTree(dirPath: string, relativePath: string = ''): Promise<any[]> {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const tree = [];
      for (const entry of entries) {
        const entryRelativePath = path.posix.join(relativePath, entry.name);
        if (entry.isDirectory()) {
          tree.push({
            name: entry.name,
            type: 'directory',
            path: entryRelativePath,
            children: await readTree(path.join(dirPath, entry.name), entryRelativePath)
          });
        } else {
          tree.push({
            name: entry.name,
            type: 'file',
            path: entryRelativePath
          });
        }
      }
      return tree;
    }

    const tree = await readTree(workspaceDir);
    return NextResponse.json({ tree });

  } catch (error: any) {
    console.error('FS API GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, action, path: targetPath, content } = await req.json();
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const absolutePath = getSafePath(userId, targetPath);

    if (action === 'writefile') {
      // Create parent directories if they don't exist
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content || '', 'utf-8');
      return NextResponse.json({ success: true });
    }

    if (action === 'mkdir') {
      await fs.mkdir(absolutePath, { recursive: true });
      return NextResponse.json({ success: true });
    }
    
    if (action === 'delete') {
       if (existsSync(absolutePath)) {
          const stats = await fs.stat(absolutePath);
          if (stats.isDirectory()) {
             await fs.rm(absolutePath, { recursive: true, force: true });
          } else {
             await fs.unlink(absolutePath);
          }
       }
       return NextResponse.json({ success: true });
    }

    if (action === 'rename') {
        const { newPath } = await req.json();
        if (!newPath) return NextResponse.json({ error: 'newPath is required' }, { status: 400 });
        const absoluteNewPath = getSafePath(userId, newPath);
        if (existsSync(absolutePath)) {
            await fs.rename(absolutePath, absoluteNewPath);
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('FS API POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
