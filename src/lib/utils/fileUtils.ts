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
