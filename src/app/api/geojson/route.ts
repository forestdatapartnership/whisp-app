import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/utils/analizePlots";
import { createFeatureCollection, addGeoId, validateGeoJSON } from "@/utils/geojsonUtils";
import { GEOMETRY_LIMIT } from "@/utils/constants";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useBadRequestResponse } from "@/lib/hooks/responses";
import { LogFunction } from "@/lib/logger";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/utils/compose";
import { getIssues } from '@placemarkio/check-geojson';

export const POST = compose(
    withLogging,
    withErrorHandling,
    withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
    const generateGeoids = body.generateGeoids || false;

    const geojsonErrors = validateGeoJSON(JSON.stringify(body));
    if (geojsonErrors.length > 0) {
        return useBadRequestResponse(
            `The body does not contain a valid GeoJSON. Errors:\n${geojsonErrors
                .map(error => `- ${error.message}`)
                .join('\n')}`
        );
    }

    let featureCollection = createFeatureCollection(body);

    if (featureCollection.features.length > GEOMETRY_LIMIT) {
        return useBadRequestResponse(`The are more than ${GEOMETRY_LIMIT} features in this collection. Please do not exceed more than ${GEOMETRY_LIMIT} individual features.`);
    }

    if (generateGeoids) {
        featureCollection = await addGeoId(featureCollection);
    }

    featureCollection = { ...featureCollection, generateGeoids };

    return await analyzePlots(featureCollection, log);
});

