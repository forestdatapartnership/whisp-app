import fs from 'fs/promises';
import { LogFunction } from '@/lib/logger';

export const fileExists = async (filePath: string, log?: LogFunction): Promise<boolean> => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      
      if (log) {
        log('warn', `File existence check attempt ${attempt} failed for ${filePath}: ${error.message}`, 'fileUtils.ts');
      }
      
      if (attempt === 3) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return false;
};

export const readFile = async (filePath: string, log?: LogFunction): Promise<string> => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error: any) {
      if (log) {
        log('warn', `File read attempt ${attempt} failed for ${filePath}: ${error.message}`, 'fileUtils.ts');
      }
      
      if (attempt === 3) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error('Should not reach here');
};

export const atomicWriteFile = async (
    finalPath: string,
    content: string,
    log?: LogFunction
  ): Promise<void> => {
    const tempPath = finalPath + '.tmp';
    
    try {
      await fs.writeFile(tempPath, content, 'utf8');

      await fs.rename(tempPath, finalPath);
      
      if (log) {
        log('debug', `Atomically wrote file: ${finalPath}`, 'fileUtils.ts');
      }
    } catch (error: any) {
      try {
        await fs.unlink(tempPath);
      } catch {
      }
      
      if (log) {
        log('error', `Atomic write failed for ${finalPath}: ${error.message}`, 'fileUtils.ts');
      }
      
      throw error;
    }
  };