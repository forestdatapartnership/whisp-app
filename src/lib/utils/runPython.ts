import { spawn, ChildProcess } from 'child_process';
import { LogFunction } from "@/lib/logger"

// Define a UUID type as a branded string
type UUID = string & { readonly __brand: unique symbol };

/**
 * Options for running a Python script
 */
export interface PythonScriptOptions {
  /** Path to the Python executable */
  pythonPath?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to stream stdout in real-time */
  streamOutput?: boolean;
  /** Callback for real-time stdout streaming */
  onOutput?: (data: string) => void;
}

/**
 * Runs any Python script with the given arguments
 * 
 * @param scriptPath - Path to the Python script to run
 * @param args - Array of arguments to pass to the script
 * @param log - Logging function
 * @param options - Additional options for running the script
 * @returns Promise that resolves to the stdout of the script or rejects with an error
 */
export const runPythonScript = async (
  scriptPath: string, 
  args: string[], 
  log: LogFunction,
  options?: PythonScriptOptions
): Promise<string> => {
  const {
    pythonPath = process.env.PYTHON_PATH || 'python',
    timeout = 90000,
    streamOutput = false,
    onOutput
  } = options || {};

  return new Promise((resolve, reject) => {
    const childProcess = spawn(pythonPath, [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      stdout += dataStr;
      
      if (streamOutput && onOutput) {
        onOutput(dataStr);
      }
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      log("debug", `Python Stdout: ${stdout}`);
      
      if (code !== 0) {
        log("error", `Python Stderr: ${stderr}`);
        reject(`Python script exited with code ${code}: ${stderr}`);
        return;
      }
      
      resolve(stdout);
    });

    childProcess.on('error', (error) => {
      log("error", `Failed to start Python process: ${error.message}`);
      reject(error.message);
    });

    // Set a timeout
    const timeoutId = setTimeout(() => {
      if (!childProcess.killed) {
        log("error", `Analysis timed out after ${timeout/1000} seconds.`);
        killProcess(childProcess);
        reject('Analysis timed out.');
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
 * @param {PythonScriptOptions} options - Additional options for running the script
 * @param {boolean} useLegacyFormat - Whether to use the legacy format output
 * @return {Promise<boolean>} - A promise that resolves to `true` if the analysis is successful,
 *                              and rejects with an error message if it fails.
 */
export const analyzeGeoJson = async (
  token: string, 
  log: LogFunction,
  options?: PythonScriptOptions,
  useLegacyFormat: boolean = false
): Promise<boolean> => {
  const scriptPath = 'src/python/analysis.py';
  const dataPath = `temp/${token}.json`;
  
  // Add the "legacy" argument when useLegacyFormat is true
  const args = useLegacyFormat ? [dataPath, "legacy"] : [dataPath];
  
  try {
    await runPythonScript(scriptPath, args, log, options);
    return true;
  } catch (error) {
    throw error; // Re-throw to maintain the original error handling
  }
};
