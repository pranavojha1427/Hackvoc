import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);
const getWorkspaceDir = (userId: string) => path.resolve(process.cwd(), 'practice_workspace', userId);

export async function POST(req: Request) {
  try {
    const { userId, command, cwd } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    if (!command) {
        return NextResponse.json({ output: '' });
    }

    const workspaceDir = getWorkspaceDir(userId);
    
    // Resolve current working directory
    let currentDir = cwd ? path.resolve(workspaceDir, cwd) : workspaceDir;
    
    // Prevent breaking out of workspace (optional, but good for safety)
    if (!currentDir.startsWith(workspaceDir)) {
        currentDir = workspaceDir;
    }

    // Handle "cd" command manually because exec is stateless
    const trimmedCmd = command.trim();
    if (trimmedCmd.startsWith('cd ') || trimmedCmd === 'cd') {
        const target = trimmedCmd.substring(3).trim();
        let newDir = currentDir;
        
        if (target === '/' || target === '\\') {
            newDir = workspaceDir;
        } else if (target === '..') {
            newDir = path.dirname(currentDir);
            if (!newDir.startsWith(workspaceDir)) newDir = workspaceDir;
        } else if (target) {
            newDir = path.resolve(currentDir, target);
        }

        if (!existsSync(newDir)) {
            return NextResponse.json({ 
                output: `cd: ${target}: No such file or directory\n`,
                cwd: currentDir.replace(workspaceDir, '') || '/'
            });
        }
        
        return NextResponse.json({ 
            output: '',
            cwd: newDir.replace(workspaceDir, '') || '/'
        });
    }

    // Execute other commands
    try {
      const { stdout, stderr } = await execAsync(command, { 
          cwd: currentDir,
          shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
      });
      
      // Clean up output a bit for xterm
      const output = (stdout + stderr).replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      
      return NextResponse.json({ 
          output, 
          cwd: currentDir.replace(workspaceDir, '') || '/' 
      });
    } catch (execError: any) {
      const output = (execError.stdout + (execError.stderr || execError.message)).replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      return NextResponse.json({ 
          output, 
          cwd: currentDir.replace(workspaceDir, '') || '/' 
      });
    }
  } catch (error: any) {
    console.error('Terminal API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
