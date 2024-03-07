import { createCollectEarthProject } from "@/utils/createCollectEarthProject";
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest, context: { params: any }) {

    const { token } = context.params;;

    if (!token) {
        return NextResponse.json({ error: 'Missing request body' }, { status: 400 })
    }

    try {
        const cepPath = path.join(process.cwd(), 'temp', `${token}.cep`);
        const fileContents = await fs.readFile(cepPath, 'utf8');
        const headers = new Headers();
        headers.append("Content-Type", "application/zip");
        headers.append("Content-Disposition", `attachment; filename="${token}.cep"`);
        return new NextResponse(fileContents, { headers });
    } catch (error) {
        // Directory does not exist
        console.log(`.cep with token ${token} already exists`);
    }

    let fileExists = false;

    const filePath = path.join(process.cwd(), 'temp', `${token}.json`);
    const targetDir = path.join(process.cwd(), 'temp', `${token}`);

    try {
        try {
            await fs.access(filePath);
            fileExists = true;
        } catch (error) {
            // Directory does not exist
            fileExists = false;
        }

        if (fileExists) {
            await fs.mkdir(targetDir, { recursive: true });
            await createCollectEarthProject(token);

            const cepPath = path.join(process.cwd(), 'temp', `${token}.cep`);
            const fileContents = await fs.readFile(cepPath, 'utf8');

            const headers = new Headers();
            headers.append("Content-Type", "application/zip");
            headers.append("Content-Disposition", `attachment; filename="${token}.cep"`);
            return new NextResponse(fileContents, { headers });
        } else {
            return NextResponse.json({ error: "No file found." }, { status: 400 })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}