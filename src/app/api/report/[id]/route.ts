import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from "path";

export async function GET(request: NextRequest, { params }) {

    const { id } = params;

    
    try {

        const filePath = path.join(process.cwd(), 'temp');

        const data = await fs.readFile(`${filePath}/${id}-result.json`, 'utf8');
        
        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No report was found.' }, { status: 400 })
        }

        const jsonData = JSON.parse(data);

        return NextResponse.json(
            { data: jsonData }
        )

    } catch (error: any) {
        return NextResponse.json({ error: "Report not found." }, { status: 400 })
    }
}