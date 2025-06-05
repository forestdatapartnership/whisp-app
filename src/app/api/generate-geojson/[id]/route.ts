import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from "path";

export async function GET(request: NextRequest, { params }: any) {

	if (!params || !params.id) {
		return NextResponse.json({ error: 'ID parameter is missing.' }, { status: 400 });
	}

	const { id } = params;

	try {
		const filePath = path.join(process.cwd(), 'temp');
		const data = await fs.readFile(`${filePath}/${id}-result.json`, 'utf8');

		if (!data || data.length === 0) {
			return NextResponse.json({ error: 'No report was found.' }, { status: 400 });
		}

		let parsedData;
		try {
			parsedData = JSON.parse(data);
		} catch (parseError) {
			return NextResponse.json({ error: 'Failed to parse JSON data.' }, { status: 500 });
		}

		// Add the multilingual name property to the parsed data
		const geojson = {
			...parsedData,
			name: {
				"en": "WHISP Plots",
				"fr": "Parcelles WHISP",
				"pt": "Parcelas WHISP",
				"es": "Parcelas WHISP"
			}
		};

		return NextResponse.json(geojson);

	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
		} else {
			return NextResponse.json({ error: 'An error occurred while processing the request.' }, { status: 500 });
		}
	}
}
