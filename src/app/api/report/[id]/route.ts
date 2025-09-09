import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from "path";

export async function GET(request: NextRequest, { params } : any ) {

    const { id } = params;
    
    try {

        const filePath = path.join(process.cwd(), 'temp');

        const data = await fs.readFile(`${filePath}/${id}-result.json`, 'utf8');
        
        if (!data || data.length === 0) {
            const response = NextResponse.json({ error: 'No report was found.' }, { status: 400 });
            response.headers.set('X-Deprecated', 'true');
            response.headers.set('X-Deprecation-Warning', 'This endpoint is deprecated and will be removed in a future version');
            return response;
        }

        const jsonData = JSON.parse(data);

        const response = NextResponse.json({
            data: jsonData,
            _deprecated: true,
            _deprecationMessage: "This endpoint is deprecated and will be removed in a future version. Please migrate to the new API."
        });

        response.headers.set('X-Deprecated', 'true');
        response.headers.set('X-Deprecation-Warning', 'This endpoint is deprecated and will be removed in a future version');
        response.headers.set('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

        return response;

    } catch (error: any) {
        const response = NextResponse.json({ error: "Report not found." }, { status: 400 });
        response.headers.set('X-Deprecated', 'true');
        response.headers.set('X-Deprecation-Warning', 'This endpoint is deprecated and will be removed in a future version');
        return response;
    }
}