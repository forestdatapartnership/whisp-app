import 'server-only';
import fs from 'fs/promises';

export const fileExists = async (filePath: string): Promise<boolean> => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (error: any) {
      if (error.code === 'ENOENT') return false;
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return false;
};

export const readFile = async (filePath: string): Promise<string> => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('Should not reach here');
};

export const atomicWriteFile = async (finalPath: string, content: string): Promise<void> => {
  const tempPath = finalPath + '.tmp';
  try {
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, finalPath);
  } catch (error) {
    try { await fs.unlink(tempPath); } catch { /* ignore */ }
    throw error;
  }
};
