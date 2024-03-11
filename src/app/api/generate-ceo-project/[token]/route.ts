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
        console.error(error);
        return NextResponse.json({ error: "There was an error with the request. Please try again later." }, { status: 500 });
    }
}