import ee from '@google/earthengine';

export const initializeEE = () => {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(privateKey, () => {
            ee.initialize(null, null, () => {
                console.log('Earth Engine initialized successfully!');
                resolve();
            }, (e) => {
                console.error('Initialization error:', e);
                reject(e);
            });
        }, (e) => {
            console.error('Authentication error:', e);
            reject(e);
        });
    });
};

const creafDescalsPalmPrep = () => {
    const oilPalmDescalsRaw = ee.ImageCollection('BIOPAMA/GlobalOilPalm/v1');
    const oilPalmDescalsMosaic = oilPalmDescalsRaw.select('classification').mosaic();
    return oilPalmDescalsMosaic.lte(2).rename("oilpalm");
};

const jaxaForestPrep = () => {
    const jaxaForestNonForestRaw = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/FNF4');
    const jaxaForestNonForest2020 = jaxaForestNonForestRaw.filterDate('2020-01-01', '2020-12-31').select('fnf').mosaic();
    return jaxaForestNonForest2020.lte(2).rename("jaxaTrees");
};

const esriLulcTreesPrep = () => {
    const esriLulc10 = ee.ImageCollection("projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS");
    const esriLulc102020 = esriLulc10.filterDate('2020-01-01', '2020-12-31')
        .map(image => image.remap([1, 2, 4, 5, 7, 8, 9, 10, 11], [1, 2, 3, 4, 5, 6, 7, 8, 9])).mosaic();
    return esriLulc102020.eq(2).rename("esriTrees");
};

const gladGfc10pcPrep = () => {
    const gfc = ee.Image("UMD/hansen/global_forest_change_2022_v1_10");
    const gfcTreecover2000 = gfc.select(['treecover2000']);
    const gfcLoss20012020 = gfc.select(['lossyear']).lte(20);
    const gfcTreecover2020 = gfcTreecover2000.where(gfcLoss20012020.eq(1), 0);
    return gfcTreecover2020.gt(10).rename("gfcTrees2020");
};

const gladLulcStablePrep = () => {
    const gladLandcover2020 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2020').updateMask(ee.Image("projects/glad/OceanMask").lte(1));
    const gladLandcover2020Main = gladLandcover2020.where(gladLandcover2020.gte(27).And(gladLandcover2020.lte(48)), 27).where(gladLandcover2020.gte(127).And(gladLandcover2020.lte(148)), 27);
    return gladLandcover2020Main.eq(27).rename("gladLandCoverTrees2020");
};

const gladPhtPrep = () => {
    const primaryHtForests2001Raw = ee.ImageCollection('UMD/GLAD/PRIMARY_HUMID_TROPICAL_FORESTS/v1');
    const primaryHtForests2001 = primaryHtForests2001Raw.select("Primary_HT_forests").mosaic().selfMask();
    const gfc = ee.Image('UMD/hansen/global_forest_change_2022_v1_10');
    const gfcLoss20012020 = gfc.select(['lossyear']).lte(20);
    return primaryHtForests2001.where(gfcLoss20012020.eq(1), 0).rename("phtf2020");
};

const jrcGfc2020Prep = () => {
    const jrcGfc2020Raw = ee.ImageCollection("JRC/GFC2020/V1");
    return jrcGfc2020Raw.mosaic().rename("jrcGfc2020");
};

const jrcTmfDisturbedPrep = () => {
    const jrcTmfTransitionsRaw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes');
    const jrcTmfTransitions = jrcTmfTransitionsRaw.mosaic();
    const inList = [21, 22, 23, 24, 25, 26, 61, 62, 31, 32, 33, 63, 64, 51, 52, 53, 54, 67, 92, 93, 94];
    const outList = new Array(inList.length).fill(1);
    const defaultValue = 0;
    const jrcTmfDisturbed = jrcTmfTransitions.remap(inList, outList, defaultValue);
    return jrcTmfDisturbed.rename("jrcTmfDisturbed");
};

const jrcTmfPlantationsPrep = () => {
    const jrcTmfTransitionsRaw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes');
    const jrcTmfTransitions = jrcTmfTransitionsRaw.mosaic();
    const inList = [81, 82, 83, 84, 85, 86];
    const outList = new Array(inList.length).fill(1);
    const defaultValue = 0;
    const jrcTmfPlantations = jrcTmfTransitions.remap(inList, outList, defaultValue);
    return jrcTmfPlantations.rename("jrcTmfPlantations");
};

const jrcTmfUndisturbedPrep = () => {
    const jrcTmfTransitionsRaw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes');
    const jrcTmfTransitions = jrcTmfTransitionsRaw.mosaic();
    const inList = [10, 11, 12];
    const outList = new Array(inList.length).fill(1);
    const defaultValue = 0;
    const jrcTmfUndisturbed = jrcTmfTransitions.remap(inList, outList, defaultValue);
    return jrcTmfUndisturbed.rename("jrcTmfUndisturbed");
};

const ethKalischekCocoaPrep = () => {
    return ee.Image('projects/ee-nk-cocoa/assets/cocoa_map_threshold_065').rename("cocoaKalischek");
};

const wurRaddAlertsPrep = () => {
    const howManyDaysBack = -(365 * 2);
    const currentDate = ee.Date(new Date().toISOString());
    const startDate = currentDate.advance(howManyDaysBack, 'day');
    const startDateYyddd = ee.Number.parse(startDate.format('yyDDD'));
    const radd = ee.ImageCollection('projects/radar-wur/raddalert/v1');
    const latestRaddAlert = radd.filterMetadata('layer', 'contains', 'alert').sort('system:time_end', false).mosaic();
    const latestRaddAlertConfirmedRecent = latestRaddAlert.select('Date').gte(startDateYyddd).selfMask();
    return latestRaddAlertConfirmedRecent.rename("raddAlerts");
};

const fdapPalmPrep = () => {
    const fdapPalm2020ModelRaw = ee.ImageCollection("projects/forestdatapartnership/assets/palm/palm_2020_model_20231026");
    const fdapPalm = fdapPalm2020ModelRaw.mosaic().gt(0.9).selfMask();
    return fdapPalm.rename("fdapPalm");
};

const wcmcWdpaProtectionPrep = () => {
    const wdpaPoly = ee.FeatureCollection("WCMC/WDPA/current/polygons");
    const templateImage = ee.Image("UMD/hansen/global_forest_change_2022_v1_10");
    const wdpaFilt = wdpaPoly.filter(ee.Filter.and(ee.Filter.neq('STATUS', 'Proposed'), ee.Filter.neq('STATUS', 'Not Reported'), ee.Filter.neq('DESIG_ENG', 'UNESCO-MAB Biosphere Reserve')));
    const wdpaOverlap = wdpaFilt.reduceToImage(['STATUS_YR'], 'min');
    const wdpaBinary = wdpaOverlap.lt(2070);
    const reprojectToTemplate = (rasterisedVector, template) => {
        const outputImage = rasterisedVector.reproject({
            crs: template.select(0).projection().crs(),
            scale: template.select(0).projection().nominalScale()
        }).toInt8();
        return outputImage;
    };
    const wcmcWdpaProtection = reprojectToTemplate(wdpaBinary, templateImage);
    return wcmcWdpaProtection.rename("wcmcWdpaProtection");
};

const esaWorldcoverTreesPrep = () => {
    const esaLc2020Raw = ee.Image("ESA/WorldCover/v100/2020");
    const esaTreeCover2020 = esaLc2020Raw.eq(95).or(esaLc2020Raw.eq(10));
    return esaTreeCover2020.rename("esaTrees");
};

const getGaulInfo = (geometry) => {
    const gaul2 = ee.FeatureCollection("FAO/GAUL/2015/level2");
    const polygonsIntersectPoint = gaul2.filterBounds(geometry);
    return ee.Algorithms.If(polygonsIntersectPoint.size().gt(0), polygonsIntersectPoint.first().toDictionary().select(["ADM0_NAME", "ADM1_NAME", "ADM2_NAME"]), null);
};

const getStats = (boundaries) => {
    let imgCombined = ee.Image(1).rename("area");
    imgCombined = imgCombined.addBands(creafDescalsPalmPrep())
        .addBands(jaxaForestPrep())
        .addBands(esriLulcTreesPrep())
        .addBands(gladGfc10pcPrep())
        .addBands(gladLulcStablePrep())
        .addBands(gladPhtPrep())
        .addBands(jrcGfc2020Prep())
        .addBands(fdapPalmPrep())
        .addBands(jrcTmfDisturbedPrep())
        .addBands(jrcTmfPlantationsPrep())
        .addBands(jrcTmfUndisturbedPrep())
        .addBands(ethKalischekCocoaPrep())
        .addBands(wurRaddAlertsPrep())
        .addBands(wcmcWdpaProtectionPrep())
        .addBands(esaWorldcoverTreesPrep())
        .multiply(ee.Image.pixelArea());

    const reduce = imgCombined.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: boundaries,
        scale: 10,
        maxPixels: 1e9
    });

    const areaM2 = reduce.get("area");
    const areaHa = ee.Number(areaM2).divide(ee.Number(1e4));

    const toPercent = (key, value) => {
        return ee.Number(value).divide(ee.Number(areaM2)).multiply(100);
    };

    let percentageData = reduce.map(toPercent);
    percentageData = percentageData.set("Area_ha", areaHa);

    return ee.Dictionary({
        "chartType": "WhispSummary",
        "data": percentageData,
        "location": getGaulInfo(boundaries) // Assuming getGaulInfo is already defined as per previous example
    });
};

const getStatsForMultipleGeoms = async (featureCollection) => {
    const statsList = featureCollection.map(async (feature) => {
        const stats = await getStats(feature.geometry());
        const location = await getGaulInfo(feature.geometry());

        return ee.Feature(null, {
            geoid: feature.get('geoid'),
            stats: stats,
            geometry: feature.geometry(),
            location: location
        });
    });

    // Use Promise.all to wait for all the promises within the array to be resolved
    return Promise.all(statsList);
};

 export const analyzeData = async (rawFeatureCollection) => {

    try {

        await initializeEE();

        const featureCollection = getStatsForMultipleGeoms(rawFeatureCollection);

        const statsListInfo = await featureCollection.getInfo();

        const data = statsListInfo.features.map(featureInfo => {
            const properties = featureInfo.properties;

            const statsData = properties.stats.data;

            const row = {
                'geoid': properties.geoid,
                'area': statsData['Area_ha'] || -9999,
                'gaul0': properties.location.ADM0_NAME || "-9999",
                'gaul1': properties.location.ADM1_NAME || "-9999",
                'gaul2': properties.location.ADM2_NAME || "-9999",
                'esaTree': statsData['esaTrees'] || -9999,
                'jaxaTree': statsData['jaxaTrees'] || -9999,
                'jrc2020': statsData['jrcGfc2020'] || -9999,
                'gfc2020': statsData['gfcTrees2020'] || -9999,
                'glad2020': statsData['gladLandCoverTrees2020'] || -9999,
                'phtf2020': statsData['phtf2020'] || -9999,
                'wcmcpa': statsData['wcmcWdpaProtection'] || -9999,
                'raddAlrt': statsData['raddAlerts'] || -9999,
                'oilpalm': statsData['oilpalm'] || -9999,
                'fdapPalm': statsData['fdapPalm'] || -9999,
                'cocoaK': statsData['cocoaKalischek'] || -9999,
                'jrcPlant': statsData['jrcTmfPlantations'] || -9999,
                'jrcUndis': statsData['jrcTmfUndisturbed'] || -9999,
                // 'geometry': Assuming you handle geometry conversion separately
            };

            return row;
        });

        data.forEach((item, index) => {
            item.PLOTID = index + 1;
        });

        return data;
    } catch (err) {
        console.error('Error initializing Earth Engine or processing data:', err);
        // Handle initialization or data processing error
    }
};

