import { exec } from 'child_process';
import { LogFunction } from "@/lib/logger"

// Define a UUID type as a branded string
type UUID = string & { readonly __brand: unique symbol };

/**
 * Asynchronously analyzes data by executing a Python script using a provided token.
 * The function expects a unique token to identify the data file, which should be located in the `temp` directory.
 * The Python script (`polm.py`) is executed with the path to the data file as its argument.
 * 
 * @param {string} token - A unique identifier for the data file to be analyzed.
 * @return {Promise<boolean>} - A promise that resolves to `true` if the analysis is successful,
 *                              and rejects with an error message if it fails due to execution errors or script errors.
 */
export const analyzeGeoJson = async (token: string, log: LogFunction): Promise<boolean> => {

    return new Promise((resolve, reject) => {

        const command = `${process.env.PYTHON_PATH} src/python/analysis.py "temp/${token}.json"`;
        const childProcess = exec(command, (error, stdout, stderr) => {
            log("debug", `Python Stdout: ${stdout}`);

            if (error) {
                log("error", `Python Stderr: ${stderr}`);
                if (childProcess && !childProcess.killed) {
                    childProcess.kill();
                }
                reject(error.message);
                return;
            }

            // Check exit code:
            if (childProcess.exitCode !== 0) {
                log("error", `Python Stderr: ${stderr}`);
                reject(`Python script exited with code ${childProcess.exitCode}`);
            } else {
                resolve(true);
            }
        });
        // Set a timeout
        const timeoutId = setTimeout(() => {
            if (childProcess && !childProcess.killed) {
                console.error('Analysis timed out after 90 seconds.');
                childProcess.kill();
                reject('Analysis timed out.');
            }
        }, 90000); // 90 seconds in milliseconds

        // Clear the timeout if the process finishes before the timeout
        childProcess.on('exit', () => {
            clearTimeout(timeoutId);
        });
    });
};
