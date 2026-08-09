import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { language, code } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 });
    }

    const tmpDir = os.tmpdir();
    const fileName = `code_${Date.now()}`;
    
    let command = '';
    let filePath = '';

    if (language === 'python') {
      filePath = path.join(tmpDir, `${fileName}.py`);
      await fs.writeFile(filePath, code);
      command = `python "${filePath}"`;
    } else if (language === 'javascript' || language === 'react') {
      filePath = path.join(tmpDir, `${fileName}.js`);
      await fs.writeFile(filePath, code);
      command = `node "${filePath}"`;
    } else if (language === 'cpp') {
      filePath = path.join(tmpDir, `${fileName}.cpp`);
      const exePath = path.join(tmpDir, `${fileName}.exe`);
      await fs.writeFile(filePath, code);
      command = `g++ "${filePath}" -o "${exePath}" && "${exePath}"`;
    } else if (language === 'c') {
      filePath = path.join(tmpDir, `${fileName}.c`);
      const exePath = path.join(tmpDir, `${fileName}.exe`);
      await fs.writeFile(filePath, code);
      command = `gcc "${filePath}" -o "${exePath}" && "${exePath}"`;
    } else if (language === 'java') {
      filePath = path.join(tmpDir, `Main.java`);
      await fs.writeFile(filePath, code);
      command = `javac "${filePath}" && java -cp "${tmpDir}" Main`;
    } else if (language === 'csharp') {
      filePath = path.join(tmpDir, `${fileName}.cs`);
      const exePath = path.join(tmpDir, `${fileName}.exe`);
      await fs.writeFile(filePath, code);
      command = `csc /out:"${exePath}" "${filePath}" && "${exePath}"`;
    } else {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 5000 });
      return NextResponse.json({ output: stdout || stderr || 'Program finished with no output.' });
    } catch (execError: any) {
      const errOut = execError.stderr || execError.stdout || execError.message || '';
      
      // Check for missing compiler in stderr
      if (
        errOut.includes('is not recognized as an internal or external command') ||
        errOut.includes('command not found')
      ) {
        return NextResponse.json({ 
          error: errOut,
          missingCompiler: true,
          language
        }, { status: 400 });
      }

      return NextResponse.json({ 
        output: errOut || 'Execution failed.' 
      });
    }

  } catch (error) {
    console.error('Execution API Error:', error);
    return NextResponse.json({ error: 'Failed to execute code' }, { status: 500 });
  }
}
