import { createCeoProject } from "@/utils/ceoGenerator";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: any }) {

    const { token } = context.params;;

    try {
        const ceoProjectLink = await createCeoProject(token);

        return NextResponse.json(
            { ceoProjectLink }
        )
    } catch (error: any) {
        return NextResponse.json({ error }, { status: 500 })
    }
}