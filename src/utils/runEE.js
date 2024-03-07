var ee = require('@google/earthengine');

export const analyzeGeometries = (geometries) => {
    console.log("payload: ", geometries);

    function creafDescalsPalmPrep() {
        // Import the dataset; a collection of composite granules from 2019.
        var oilPalmDescalsRaw = ee.ImageCollection('BIOPAMA/GlobalOilPalm/v1');
        // Select the classification band and mosaic all of the granules into a single image.
        var oilPalmDescalsMosaic = oilPalmDescalsRaw.select('classification').mosaic();
        return oilPalmDescalsMosaic.lte(2).rename("oilpalm"); // choosing to ignore mask
    }
    function jaxaForestPrep() {
        var jaxaForestNonForestRaw = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/FNF4');
        var jaxaForestNonForest2020 = jaxaForestNonForestRaw
            .filterDate('2020-01-01', '2020-12-31')
            .select('fnf')
            .mosaic();
        // Select all trees (i.e., both dense and non-dense forest classes)
        return jaxaForestNonForest2020.lte(2).rename("jaxaTrees"); // choosing to ignore mask;
    }
    function esriLulcTreesPrep() {
        var esriLulc10 = ee.ImageCollection("projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS");
        var esriLulc10_2020 = esriLulc10
            .filterDate('2020-01-01', '2020-12-31')
            .map(function (image) {
                return image.remap(
                    [1, 2, 4, 5, 7, 8, 9, 10, 11],
                    [1, 2, 3, 4, 5, 6, 7, 8, 9]
                );
            })
            .mosaic();
        return esriLulc10_2020.eq(2).rename("esriTrees"); // get trees, NB check flooded veg class
    }
    function gladGfc10pcPrep() {
        var gfc = ee.Image("UMD/hansen/global_forest_change_2022_v1_10");
        var gfcTreecover2000 = gfc.select(['treecover2000']); // get tree cover in 2000
        var gfcLoss2001_2020 = gfc.select(['lossyear']).lte(20); // get loss pixels since 2000 and up to and including 2020
        var gfcTreecover2020 = gfcTreecover2000.where(gfcLoss2001_2020.eq(1), 0); // remove loss from original tree cover
        return gfcTreecover2020.gt(10).rename("gfcTrees2020"); // FAO 10% definition...
    }
    function gladLulcStablePrep() {
        var gladLandcover2020 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2020')
            .updateMask(ee.Image("projects/glad/OceanMask").lte(1));
        // Trees
        var gladLandcover2020Main = gladLandcover2020
            .where(gladLandcover2020.gte(27).and(gladLandcover2020.lte(48)), 27) // Stable trees over 5m
            .where(gladLandcover2020.gte(127).and(gladLandcover2020.lte(148)), 27); // Stable trees over 5m
        return gladLandcover2020Main.eq(27).rename("gladLandCoverTrees2020"); // Binary map for stable trees over 5m
    }
    function gladPhtPrep() {
        var primaryHtForests2001Raw = ee.ImageCollection('UMD/GLAD/PRIMARY_HUMID_TROPICAL_FORESTS/v1');
        // get band and mosaic
        var primaryHtForests2001 = primaryHtForests2001Raw.select("Primary_HT_forests").mosaic().selfMask();
        // Assuming gfc is loaded or available in the Earth Engine
        var gfc = ee.Image('UMD/hansen/global_forest_change_2022_v1_10');
        var gfcLoss2001_2020 = gfc.select(['lossyear']).lte(20);
        // remove GFC loss pixels from 2001-2020
        return primaryHtForests2001.where(gfcLoss2001_2020.eq(1), 0).rename("phtf2020");
    }
    function jrcGfc2020Prep() {
        var jrcGfc2020Raw = ee.ImageCollection("JRC/GFC2020/V1");
        return jrcGfc2020Raw.mosaic().rename("jrcGfc2020");
    }
    // Define the function to prepare JRC TMF disturbed dataset
    function jrcTmfDisturbedPrep() {
        // Select disturbed tropical moist forest (where disturbed = degraded, regrowth, ongoing_deforestation or other)
        var jrc_tmf_transitions_raw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes') // raw data
        var jrc_tmf_transitions = jrc_tmf_transitions_raw.mosaic()
        var in_list = [21, 22, 23, 24, 25, 26, 61, 62, 31, 32, 33, 63, 64, 51, 52, 53, 54, 67, 92, 93, 94]
        var out_list = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        var default_value = 0
        var jrcTmfDisturbed = jrc_tmf_transitions.remap(in_list, out_list, default_value)
        return jrcTmfDisturbed.rename("jrcTmfDisturbed");
    }
    // Define the function to prepare JRC TMF plantations dataset
    function jrcTmfPlantationsPrep() {
        // Select plantation
        var jrc_tmf_transitions_raw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes') // raw data
        var jrc_tmf_transitions = jrc_tmf_transitions_raw.mosaic()
        var in_list = [81, 82, 83, 84, 85, 86]
        var out_list = [1, 1, 1, 1, 1, 1]
        var default_value = 0
        var jrcTmfPlantations = jrc_tmf_transitions.remap(in_list, out_list, default_value)
        return jrcTmfPlantations.rename("jrcTmfPlantations"); //select undisturbed tropical moist forest
    }
    // Define the function to prepare JRC TMF Undisturbed forest dataset
    function jrcTmfUndisturbedPrep() {
        // Select undisturbed tropical moist forest
        var jrc_tmf_transitions_raw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes') // raw data
        var jrc_tmf_transitions = jrc_tmf_transitions_raw.mosaic()
        var in_list = [10, 11, 12]
        var out_list = [1, 1, 1]
        var default_value = 0
        var jrcTmfUndisturbed = jrc_tmf_transitions.remap(in_list, out_list, default_value)
        return jrcTmfUndisturbed.rename("jrcTmfUndisturbed"); //select undisturbed tropical moist forest
    }
    
    function ethKalischekCocoaPrep() {
        // Keep as a function in case some thresholds are used/recommended instead of 0.65 found online
        // var cocoaMapKalischek = ee.ImageCollection('projects/ee-nk-cocoa/assets/cocoa_map');
        return ee.Image('projects/ee-nk-cocoa/assets/cocoa_map_threshold_065').rename("cocoaKalischek");
    }
    function wurRaddAlertsPrep() {
        // Import required modules
        var howManyDaysBack = -(365 * 2);
        // Getting today's date
        var now = ee.Date(new Date());
        // Calculate the start date
        var startDate = now.advance(howManyDaysBack, 'day');
        // Needs to be in yyDDD format and needs to be a number, so need to parse too
        var startDateYyDDD = ee.Number.parse(startDate.format('yyDDD'));
        // Define the Image Collection
        var radd = ee.ImageCollection('projects/radar-wur/raddalert/v1');
        // Forest baseline (from Primary HT forests data)
        //var forestBaseline = ee.Image(radd.filterMetadata('layer', 'contains', 'forest_baseline').mosaic());
        // Latest RADD alert
        var latestRaddAlert = ee.Image(radd.filterMetadata('layer', 'contains', 'alert')
            .sort('system:time_end', false)
            .mosaic());
        // Update mask for RADD alert to be within primary forest (TO CHECK maybe unnecessary step)
        //var latestRaddAlertMasked = latestRaddAlert.select('Alert'); // .updateMask(forestBaseline);
        // Mask confirmed alerts //TO CHECK do we want to be more conservative?
        //var latestRaddAlertMaskedConfirmed = latestRaddAlertMasked.unmask().eq(3);
        // Update mask for confirmed alerts by date
        var latestRaddAlertConfirmedRecent = latestRaddAlert.select('Date').gte(startDateYyDDD).selfMask();
        return latestRaddAlertConfirmedRecent.rename("raddAlerts");
    }
    function fdapPalmPrep() {
        var fdapPalm2020ModelRaw = ee.ImageCollection("projects/forestdatapartnership/assets/palm/palm_2020_model_20231026");
        var fdapPalm = fdapPalm2020ModelRaw.mosaic().gt(0.9).selfMask()
        return fdapPalm.rename("fdapPalm")
    }
    function wcmcWdpaProtectionPrep() {
        var wdpaPoly = ee.FeatureCollection("WCMC/WDPA/current/polygons");
        var templateImage = ee.Image("UMD/hansen/global_forest_change_2022_v1_10");
        // Apply filters and merge polygon with buffered points  
        var wdpaFilt = wdpaPoly.filter(ee.Filter.and(ee.Filter.neq('STATUS', 'Proposed'), ee.Filter.neq('STATUS', 'Not Reported'), ee.Filter.neq('DESIG_ENG', 'UNESCO-MAB Biosphere Reserve')))
        // Turn into image (no CRS etc set currently)
        var wdpaOverlap = wdpaFilt.reduceToImage(['STATUS_YR'], 'min');  // Make into raster - remove mask if want 0s
        // Make binary
        var wdpaBinary = wdpaOverlap.lt(2070) //.unmask()
        var reprojectToTemplate = function (rasterisedVector, template) {
            // Takes an image that has been rasterised but without a scale (resolution) and reprojects to template image CRS and resolution
            var outputImage = rasterisedVector.reproject({
                "crs": template.select(0).projection().crs(),
                "scale": template.select(0).projection().nominalScale()
            }).int8()
            return outputImage;
        }
        // Reproject based on template (typically GFC data - approx 30m res)
        var wcmcWdpaProtection = reprojectToTemplate(wdpaBinary, templateImage);
        return wcmcWdpaProtection.rename("wcmcWdpaProtection");
    }
    function esaWorldcoverTreesPrep() {
        var esaLc2020Raw = ee.Image("ESA/WorldCover/v100/2020");
        var esaTreeCover2020 = esaLc2020Raw.eq(95).or(esaLc2020Raw.eq(10)) // Mangroves (95) aor Trees (10)
        return esaTreeCover2020.rename("esaTrees"); // get trees, NB check flooded veg class
    }
    function getGaulInfo(geometry) {
        var gaul2 = ee.FeatureCollection("FAO/GAUL/2015/level2");
        var polygonsIntersectPoint = gaul2.filterBounds(geometry);
        return ee.Algorithms.If(polygonsIntersectPoint.size().gt(0), polygonsIntersectPoint.first().toDictionary().select(["ADM0_NAME", "ADM1_NAME", "ADM2_NAME"]), null);
    }
    var getStats = function (boundaries) {
        var imgCombined = ee.Image(1).rename("area");
        imgCombined = imgCombined.addBands(creafDescalsPalmPrep());
        imgCombined = imgCombined.addBands(jaxaForestPrep());
        imgCombined = imgCombined.addBands(esriLulcTreesPrep());
        imgCombined = imgCombined.addBands(gladGfc10pcPrep());
        imgCombined = imgCombined.addBands(gladLulcStablePrep());
        imgCombined = imgCombined.addBands(gladPhtPrep());
        imgCombined = imgCombined.addBands(jrcGfc2020Prep());
        imgCombined = imgCombined.addBands(fdapPalmPrep());
        imgCombined = imgCombined.addBands(jrcTmfDisturbedPrep());
        imgCombined = imgCombined.addBands(jrcTmfPlantationsPrep());
        imgCombined = imgCombined.addBands(jrcTmfUndisturbedPrep());
        imgCombined = imgCombined.addBands(ethKalischekCocoaPrep());
        imgCombined = imgCombined.addBands(wurRaddAlertsPrep());
        imgCombined = imgCombined.addBands(wcmcWdpaProtectionPrep());
        imgCombined = imgCombined.addBands(esaWorldcoverTreesPrep());
        // Multiply by pixel area so that we can do a simple sum for area calulation!
        imgCombined = imgCombined.multiply(ee.Image.pixelArea());
        var reduce = imgCombined.reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: boundaries,
            scale: 10,
            maxPixels: 1e9
        });
        return ee.Dictionary({
            chartType: "WhispSummary",
            data: reduce,
            location: getGaulInfo(boundaries)
        });
    }

    var getStatsForMultipleGeoms = function (featureCollection) {
        var statsList = featureCollection.map(function(feature) {
            var boundaries = feature.geometry();
            var imgCombined = ee.Image(1).rename("area");
            // Correctly add bands for all preparations, matching getStats function
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
    
            var reduce = imgCombined.reduceRegion({
                reducer: ee.Reducer.sum(),
                geometry: boundaries,
                scale: 10,
                maxPixels: 1e9
            });
    
            return ee.Feature(null, {
                stats: reduce,
                location: getGaulInfo(boundaries)
            });
        });
        return statsList;
    };
   
}