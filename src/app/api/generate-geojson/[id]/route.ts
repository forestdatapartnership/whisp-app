
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from "path";
import { Feature, FeatureCollection } from 'geojson';

export async function GET(request: NextRequest, { params }: any) {

	if (!params || !params.id) {
		return NextResponse.json({ error: 'ID parameter is missing.' }, { status: 400 });
	}

	const { id } = params;

	function combineGeometriesToFeatureCollection(data: any): any {
		const features: Feature[] = data.map((item: any) => (
			{
				type: "Feature",
				properties: {name: String(item.plotId)},
				geometry: item.geometry
			}
		));

		return {
			type: "FeatureCollection",
			features: features,
			name: {
 
				"en" : "WHISP Plots",
				"fr" : "Parcelles WHISP",
				"pt" : "Parcelas WHISP",
				"es" : "Parcelas WHISP"
			},
		};
	}

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

		const geojson = combineGeometriesToFeatureCollection(parsedData);
		
		return NextResponse.json(geojson);

	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
		} else {
			return NextResponse.json({ error: 'An error occurred while processing the request.' }, { status: 500 });
		}
	}
}
