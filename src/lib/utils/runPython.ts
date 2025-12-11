import { spawn, ChildProcess } from 'child_process';
import { LogFunction } from "@/lib/logger";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from '@/types/systemError';
import { jobCache } from './jobCache';
import { sseEmitter } from './sseEmitter';

/**
 * Runs any Python script with the given arguments
 * 
 * @param scriptPath - Path to the Python script to run
 * @param args - Array of arguments to pass to the script
 * @param log - Logging function
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves to the stdout of the script or rejects with an error
 */
export const runPythonScript = async (
  token: string,
  scriptPath: string,
  args: string[],
  log: LogFunction,
  timeout: number
): Promise<string> => {
  const pythonPath = process.env.PYTHON_PATH || 'python';
  const updateProgress = (token: string, message: string, percent: number | null = null) => {
    const metadata = jobCache.get(token);
    if (metadata) {
      const processStatusMessages = metadata.processStatusMessages || [];
      processStatusMessages.push(message);
      const updated = { 
        ...metadata, 
        processStatusMessages,
        ...(percent !== null && { percent })
      };
      jobCache.set(token, updated);
      sseEmitter.emit(token, { code: SystemCode.ANALYSIS_PROCESSING, data: updated });
    }
  };
  

  return new Promise((resolve, reject) => {
    const childProcess = spawn(pythonPath, [scriptPath, ...args]);
    updateProgress(token, "Starting analysis", 0);
    
    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      stdout += dataStr;
      
      const infoMatch = dataStr.match(/INFO: (.+)/);
      if (infoMatch) {
        const message = infoMatch[1].trim();
        
        const shouldSkip = 
          message.startsWith('Mode:') ||
          message.includes('Concurrent processing + formatting + validation complete');
        
        if (shouldSkip) {
          return;
        }
        
        let percent = null;
        const progressMatch = message.match(/Progress: \d+\/\d+ batches \((\d+)%\)/);
        if (progressMatch) {
          const parsedPercent = parseInt(progressMatch[1], 10);
          if (!isNaN(parsedPercent)) {
            percent = parsedPercent;
          }
        }
        
        updateProgress(token, message, percent);
      }
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      log("debug", `Python Stdout: ${stdout}`);
      
      if (code !== 0) {
        reject(new SystemError(SystemCode.ANALYSIS_ERROR, [], `Python script exited with code ${code}: ${stderr}`));
        return;
      }
      
      resolve(stdout);
    });

    childProcess.on('error', (error) => {
      reject(new SystemError(SystemCode.ANALYSIS_ERROR, [], `Failed to start Python process: ${error.message}`));
    });

    // Set a timeout
    const timeoutId = setTimeout(() => {
      if (!childProcess.killed) {
        killProcess(childProcess);
        reject(new SystemError(SystemCode.ANALYSIS_TIMEOUT, [timeout/1000], `Analysis timed out after ${timeout/1000} seconds.`));
      }
    }, timeout);

    // Clear the timeout if the process finishes
    childProcess.on('exit', () => {
      clearTimeout(timeoutId);
    });

    // Handle parent process termination
    const handleSignal = (signal: NodeJS.Signals) => {
      log("debug", `Received ${signal}, terminating child process.`);
      killProcess(childProcess);
    };

    // Add signal handlers
    process.once('SIGINT', handleSignal);
    process.once('SIGTERM', handleSignal);
    
    // Remove signal handlers once the child process exits
    childProcess.on('exit', () => {
      process.off('SIGINT', handleSignal);
      process.off('SIGTERM', handleSignal);
    });
  });
};

/**
 * Helper function to properly kill a child process
 */
const killProcess = (childProcess: ChildProcess) => {
  if (!childProcess.killed) {
    try {
      // Try with SIGTERM first
      childProcess.kill('SIGTERM');
      
      // Fallback to SIGKILL after a short delay if still running
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
        }
      }, 500);
    } catch (error) {
      // Ignore errors during kill
    }
  }
};

/**
 * Asynchronously analyzes data by executing a Python script using a provided token.
 * The function expects a unique token to identify the data file, which should be located in the `temp` directory.
 * The Python script is executed with the path to the data file as its argument.
 * Uses Node.js spawn for better performance with large outputs.
 * 
 * @param {string} token - A unique identifier for the data file to be analyzed.
 * @param {LogFunction} log - Function for logging messages
 * @param {number} timeout - Timeout in milliseconds
 * @param {boolean} useLegacyFormat - Whether to use the legacy format output
 * @return {Promise<boolean>} - A promise that resolves to `true` if the analysis is successful,
 *                              and rejects with an error message if it fails.
 */
export const analyzeGeoJson = async (
  token: string, 
  log: LogFunction,
  timeout: number,
  useLegacyFormat: boolean = false
): Promise<boolean> => {
  const scriptPath = 'src/python/analysis.py';
  const dataPath = `temp/${token}.json`;
  const logSource = "runPython.ts";
  
  const args = useLegacyFormat ? [dataPath, "legacy"] : [dataPath];
  
  const pythonStartTime = Date.now();
  log("debug", `Starting Python script execution for token ${token}`, logSource);
  
  const metadata = jobCache.get(token);
  if (metadata) {
    jobCache.set(token, { ...metadata, pythonStartTime });
  }
  
  await runPythonScript(token, scriptPath, args, log, timeout);
  
  const finishTime = Date.now();
  const pythonDuration = finishTime - pythonStartTime;
  
  const updatedMetadata = jobCache.get(token);
  if (updatedMetadata) {
    jobCache.set(token, { ...updatedMetadata, finishTime });
  }
  
  const featureCount = updatedMetadata?.featureCount ?? 'na';
  const totalDuration = updatedMetadata?.startTime ? finishTime - updatedMetadata.startTime : 'na';
  
  log("info", `Analysis completed - Token: ${token}, Features: ${featureCount}, Total duration: ${totalDuration === 'na' ? 'na' : totalDuration + 'ms'}, Python duration: ${pythonDuration}ms`, logSource);
  
  return true;
};
