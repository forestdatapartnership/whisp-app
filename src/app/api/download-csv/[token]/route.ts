import { type NextRequest } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, context: { params: any }) {
    // Extract the token from the context parameters
    const { token } = context.params;

    const filePath = path.join(process.cwd(), '/temp', `${token}-result.csv`); 

    let fileHandle;
    try {
        // Read the file asynchronously
        fileHandle = await fs.promises.open(filePath, 'r'); // Explicitly open the file
        const fileContents = await fileHandle.readFile('utf8'); 

        // Generate timestamp for filename
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const filename = `whisp_analysis_${year}_${month}_${day}_${hours}_${minutes}.csv`;

        // Return the CSV file with appropriate headers
        return new Response(fileContents, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('Failed to read CSV file:', error);
        return new Response('File not found or server error.', {
            status: 500,
        });
    } finally {
        // Explicitly close the file handle if it was opened
        if (fileHandle) {
            fileHandle.close();
        }
    }
}
