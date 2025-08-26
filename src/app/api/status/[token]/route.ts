import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from "path";
import { StatusResponse } from "@/types/api";

export async function GET(request: NextRequest, { params }: any): Promise<NextResponse<StatusResponse>> {
    const { token } = params;
    const filePath = path.join(process.cwd(), 'temp');
    
    try {
        // Check if result exists (analysis completed)
        if (await fileExists(`${filePath}/${token}-result.json`)) {
            return NextResponse.json({ 
                status: 'completed',
                resultUrl: `/api/report/${token}`
            } as StatusResponse);
        }
        
        // Check if error exists (analysis failed)
        if (await fileExists(`${filePath}/${token}-error.json`)) {
            const errorData = await fs.readFile(`${filePath}/${token}-error.json`, 'utf8');
            const errorInfo = JSON.parse(errorData);
            return NextResponse.json({ 
                status: 'failed',
                error: errorInfo.error
            } as StatusResponse);
        }
        
        // Check if input exists (analysis was submitted and is processing)
        if (await fileExists(`${filePath}/${token}.json`)) {
            return NextResponse.json({ 
                status: 'processing',
                message: 'Analysis in progress...'
            } as StatusResponse);
        }
        
        // Token not found
        return NextResponse.json({ 
            status: 'not_found',
            error: 'Job not found'
        } as StatusResponse, { status: 404 });
        
    } catch (error: any) {
        return NextResponse.json({ 
            status: 'error',
            error: 'Unable to check job status'
        } as StatusResponse, { status: 500 });
    }
}

const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};
