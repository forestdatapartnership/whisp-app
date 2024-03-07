import { type NextRequest } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, context: { params: any }) {
    // Extract the token from the context parameters
    const { token } = context.params;

    const filePath = path.join(process.cwd(), '/temp', `${token}-result.csv`); 

    try {
        // Read the file asynchronously
        const fileContents = await fs.promises.readFile(filePath, 'utf8');

        // Return the CSV file with appropriate headers
        return new Response(fileContents, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${token}.csv"`
            }
        });
    } catch (error) {
        console.error('Failed to read CSV file:', error);
        return new Response('File not found or server error.', {
            status: 500,
        });
    }
}
