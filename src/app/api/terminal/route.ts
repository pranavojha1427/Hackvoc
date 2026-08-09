import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { promisify } from 'util';

import os from 'os';

const execAsync = promisify(exec);
const getWorkspaceDir = (userId: string) => {
    const baseDir = process.env.VERCEL || process.env.NODE_ENV === 'production' ? os.tmpdir() : process.cwd();
    return path.resolve(baseDir, 'practice_workspace', userId);
};

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
    
    // Intercept "runcode" to run code remotely on Wandbox
    if (trimmedCmd.startsWith('runcode ')) {
        const parts = trimmedCmd.split(' ');
        if (parts.length >= 3) {
            const filename = parts[1];
            const lang = parts[2];
            const filePath = path.resolve(currentDir, filename);
            
            if (!existsSync(filePath)) {
                return NextResponse.json({ 
                    output: `runcode: ${filename}: No such file or directory\r\n`,
                    cwd: currentDir.replace(workspaceDir, '') || '/'
                });
            }
            
            try {
                const code = await readFile(filePath, 'utf-8');
                let stdinData = "";
                const stdinPath = path.resolve(currentDir, '.stdin');
                if (existsSync(stdinPath)) {
                    stdinData = await readFile(stdinPath, 'utf-8');
                }

                let compiler = 'gcc-head-c'; // Default C
                if (lang === 'cpp') compiler = 'gcc-head';
                else if (lang === 'java') compiler = 'openjdk-jdk-22+36';
                else if (lang === 'csharp') compiler = 'mono-6.12.0.199';
                else if (lang === 'python') compiler = 'cpython-head';
                else if (lang === 'javascript') compiler = 'nodejs-20.17.0';

                const response = await fetch("https://wandbox.org/api/compile.json", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: code,
                        compiler: compiler,
                        stdin: stdinData
                    })
                });
                
                const data = await response.json();
                
                // Wandbox outputs might be empty if there are no errors or logs
                let out = "";
                if (data.program_output) out += data.program_output;
                if (data.compiler_error) out += data.compiler_error;
                if (data.compiler_message) out += data.compiler_message;
                if (data.program_error) out += data.program_error;
                
                // if nothing, just return success
                if (!out) out = "Process exited successfully.\n";
                
                return NextResponse.json({ 
                    output: out.replace(/\n/g, '\r\n'),
                    cwd: currentDir.replace(workspaceDir, '') || '/'
                });
            } catch (e: any) {
                return NextResponse.json({ 
                    output: `runcode: Failed to execute code via Wandbox: ${e.message}\r\n`,
                    cwd: currentDir.replace(workspaceDir, '') || '/'
                });
            }
        }
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
