from datetime import datetime
import json
import sys
import ee
import numpy as np
import pandas as pd
import os
import json

from google.oauth2 import service_account

def initialize_ee():
    """Initializes Google Earth Engine with credentials located one level up from the script's directory."""
    try:
        # Check if EE is already initialized
        if not ee.data._initialized:
            # Construct the path to the credentials file
            current_directory = os.getcwd()
            credentials_path = os.path.join(current_directory, 'credentials.json')

            # Initialize EE with the credentials file
            credentials = service_account.Credentials.from_service_account_file(credentials_path,
                                                                                scopes=['https://www.googleapis.com/auth/earthengine'])
            ee.Initialize(credentials)
            print("Earth Engine initialized.")
    except Exception as e:
        print("An error occurred during Earth Engine initialization:", e)

initialize_ee()

def load_geometries_from_file(file_path):
    try:
        with open(file_path, 'r') as file:
            # Load JSON data from file
            data = json.load(file)
            print("File loaded, starting analysis.")
            return data
    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except json.JSONDecodeError:
        print(f"Error decoding JSON from file: {file_path}")
    except Exception as e:
        print(f"An error occurred: {e}")
    return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Correct usage is python script.py <path_to_json_file>")
        sys.exit(1) 
    else:
        file_path = sys.argv[1]
        data = load_geometries_from_file(file_path)
        if data is not None:

            if data['type'] == 'FeatureCollection':
                features = data['features']
                generate_geo_ids = data.get('generateGeoids', False)
            elif data['type'] == 'Feature':
                features = [data]
                generate_geo_ids = data.get('generateGeoids', False)
            else:
                print("JSON is not a GeoJSON Feature or FeatureCollection.")
                sys.exit(1)
            out_fc_list = []
            for feature in features:
                if 'geometry' in feature and 'type' in feature['geometry'] and feature['geometry']['type'] == 'Polygon':
                    properties = {}
                    if generate_geo_ids:
                        properties['geoid'] = feature['properties']['geoid']
                    ee_feature = ee.Feature(ee.Geometry.Polygon(feature['geometry']['coordinates']), properties)
                    out_fc_list.append(ee_feature)
                else:
                    print("Invalid geometry format in JSON.")
            feature_collection = ee.FeatureCollection(out_fc_list)
            print("FeatureCollection created.")
        else:
            print("No geometries loaded. Exiting.")


def analyze_geometries(feature_collection):

    def creaf_descals_palm_prep():
        oil_palm_descals_raw = ee.ImageCollection('BIOPAMA/GlobalOilPalm/v1')
        oil_palm_descals_mosaic = oil_palm_descals_raw.select('classification').mosaic()
        return oil_palm_descals_mosaic.lte(2).rename("oilpalm")

    def jaxa_forest_prep():
        jaxa_forest_non_forest_raw = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/FNF4')
        jaxa_forest_non_forest_2020 = jaxa_forest_non_forest_raw.filterDate('2020-01-01', '2020-12-31').select('fnf').mosaic()
        return jaxa_forest_non_forest_2020.lte(2).rename("jaxaTrees")

    def esri_lulc_trees_prep():
        esri_lulc10 = ee.ImageCollection("projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS")
        esri_lulc10_2020 = esri_lulc10.filterDate('2020-01-01', '2020-12-31').map(lambda image: image.remap([1, 2, 4, 5, 7, 8, 9, 10, 11], [1, 2, 3, 4, 5, 6, 7, 8, 9])).mosaic()
        return esri_lulc10_2020.eq(2).rename("esriTrees")

    def glad_gfc_10pc_prep():
        gfc = ee.Image("UMD/hansen/global_forest_change_2022_v1_10")
        gfc_treecover2000 = gfc.select(['treecover2000'])
        gfc_loss2001_2020 = gfc.select(['lossyear']).lte(20)
        gfc_treecover2020 = gfc_treecover2000.where(gfc_loss2001_2020.eq(1), 0)
        return gfc_treecover2020.gt(10).rename("gfcTrees2020")

    def glad_lulc_stable_prep():
        glad_landcover2020 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2020').updateMask(ee.Image("projects/glad/OceanMask").lte(1))
        glad_landcover2020_main = glad_landcover2020.where(glad_landcover2020.gte(27).And(glad_landcover2020.lte(48)), 27).where(glad_landcover2020.gte(127).And(glad_landcover2020.lte(148)), 27)
        return glad_landcover2020_main.eq(27).rename("gladLandCoverTrees2020")

    def glad_pht_prep():
        primary_ht_forests2001_raw = ee.ImageCollection('UMD/GLAD/PRIMARY_HUMID_TROPICAL_FORESTS/v1')
        primary_ht_forests2001 = primary_ht_forests2001_raw.select("Primary_HT_forests").mosaic().selfMask()
        gfc = ee.Image('UMD/hansen/global_forest_change_2022_v1_10')
        gfc_loss2001_2020 = gfc.select(['lossyear']).lte(20)
        return primary_ht_forests2001.where(gfc_loss2001_2020.eq(1), 0).rename("phtf2020")

    def jrc_gfc_2020_prep():
        jrc_gfc2020_raw = ee.ImageCollection("JRC/GFC2020/V1")
        return jrc_gfc2020_raw.mosaic().rename("jrcGfc2020")

    def jrc_tmf_disturbed_prep():
        jrc_tmf_transitions_raw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes')
        jrc_tmf_transitions = jrc_tmf_transitions_raw.mosaic()
        in_list = [21, 22, 23, 24, 25, 26, 61, 62, 31, 32, 33, 63, 64, 51, 52, 53, 54, 67, 92, 93, 94]
        out_list = [1] * len(in_list)
        default_value = 0
        jrc_tmf_disturbed = jrc_tmf_transitions.remap(in_list, out_list, default_value)
        return jrc_tmf_disturbed.rename("jrcTmfDisturbed")

    def jrc_tmf_plantations_prep():
        jrc_tmf_transitions_raw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes')
        jrc_tmf_transitions = jrc_tmf_transitions_raw.mosaic()
        in_list = [81, 82, 83, 84, 85, 86]
        out_list = [1] * len(in_list)
        default_value = 0
        jrc_tmf_plantations = jrc_tmf_transitions.remap(in_list, out_list, default_value)
        return jrc_tmf_plantations.rename("jrcTmfPlantations")

    def jrc_tmf_undisturbed_prep():
        jrc_tmf_transitions_raw = ee.ImageCollection('projects/JRC/TMF/v1_2020/TransitionMap_Subtypes')
        jrc_tmf_transitions = jrc_tmf_transitions_raw.mosaic()
        in_list = [10, 11, 12]
        out_list = [1] * len(in_list)
        default_value = 0
        jrc_tmf_undisturbed = jrc_tmf_transitions.remap(in_list, out_list, default_value)
        return jrc_tmf_undisturbed.rename("jrcTmfUndisturbed")

    def eth_kalischek_cocoa_prep():
        return ee.Image('projects/ee-nk-cocoa/assets/cocoa_map_threshold_065').rename("cocoaKalischek")

    def wur_radd_alerts_prep():
        how_many_days_back = -(365 * 2)
        current_date = ee.Date(datetime.utcnow().isoformat())
        start_date = current_date.advance(how_many_days_back, 'day')
        start_date_yyddd = ee.Number.parse(start_date.format('yyDDD'))
        radd = ee.ImageCollection('projects/radar-wur/raddalert/v1')
        latest_radd_alert = radd.filterMetadata('layer', 'contains', 'alert').sort('system:time_end', False).mosaic()
        latest_radd_alert_confirmed_recent = latest_radd_alert.select('Date').gte(start_date_yyddd).selfMask()
        return latest_radd_alert_confirmed_recent.rename("raddAlerts")

    def fdap_palm_prep():
        fdap_palm_2020_model_raw = ee.ImageCollection("projects/forestdatapartnership/assets/palm/palm_2020_model_20231026")
        fdap_palm = fdap_palm_2020_model_raw.mosaic().gt(0.9).selfMask()
        return fdap_palm.rename("fdapPalm")

    def wcmc_wdpa_protection_prep():
        wdpa_poly = ee.FeatureCollection("WCMC/WDPA/current/polygons")
        template_image = ee.Image("UMD/hansen/global_forest_change_2022_v1_10")
        wdpa_filt = wdpa_poly.filter(ee.Filter.And(ee.Filter.neq('STATUS', 'Proposed'), ee.Filter.neq('STATUS', 'Not Reported'), ee.Filter.neq('DESIG_ENG', 'UNESCO-MAB Biosphere Reserve')))
        wdpa_overlap = wdpa_filt.reduceToImage(['STATUS_YR'], 'min')
        wdpa_binary = wdpa_overlap.lt(2070)
        def reproject_to_template(rasterised_vector, template):
            output_image = rasterised_vector.reproject(crs=template.select(0).projection().crs(), scale=template.select(0).projection().nominalScale()).int8()
            return output_image
        wcmc_wdpa_protection = reproject_to_template(wdpa_binary, template_image)
        return wcmc_wdpa_protection.rename("wcmcWdpaProtection")

    def esa_worldcover_trees_prep():
        esa_lc2020_raw = ee.Image("ESA/WorldCover/v100/2020")
        esa_tree_cover2020 = esa_lc2020_raw.eq(95).Or(esa_lc2020_raw.eq(10))
        return esa_tree_cover2020.rename("esaTrees")

    def get_gaul_info(geometry):
        gaul2 = ee.FeatureCollection("FAO/GAUL/2015/level2")
        polygons_intersect_point = gaul2.filterBounds(geometry)
        return ee.Algorithms.If(polygons_intersect_point.size().gt(0), polygons_intersect_point.first().toDictionary().select(["ADM0_NAME", "ADM1_NAME", "ADM2_NAME"]), None)
    
    def get_stats(boundaries):
            img_combined = ee.Image(1).rename("area")
            img_combined = (img_combined.addBands(creaf_descals_palm_prep())
                                      .addBands(jaxa_forest_prep())
                                      .addBands(esri_lulc_trees_prep())
                                      .addBands(glad_gfc_10pc_prep())
                                      .addBands(glad_lulc_stable_prep())
                                      .addBands(glad_pht_prep())
                                      .addBands(jrc_gfc_2020_prep())
                                      .addBands(fdap_palm_prep())
                                      .addBands(jrc_tmf_disturbed_prep())
                                      .addBands(jrc_tmf_plantations_prep())
                                      .addBands(jrc_tmf_undisturbed_prep())
                                      .addBands(eth_kalischek_cocoa_prep())
                                      .addBands(wur_radd_alerts_prep())
                                      .addBands(wcmc_wdpa_protection_prep())
                                      .addBands(esa_worldcover_trees_prep())
                                      .multiply(ee.Image.pixelArea()))

            # Sum the areas of each class and the total area within the boundaries
            reduce = img_combined.reduceRegion(reducer=ee.Reducer.sum(), geometry=boundaries, scale=10, maxPixels=1e9)

            area_m2 = reduce.get("area")

            area_ha = ee.Number(area_m2).divide(ee.Number(1e4))

            # Calculate percentages server-side using ee.Dictionary.map()
            def to_percent(key, value):
                return ee.Number(value).divide(ee.Number(area_m2)).multiply(100)
            
            percentage_data = reduce.map(to_percent)

            percentage_data = percentage_data.set("Area_ha", area_ha)

            return ee.Dictionary({
                "chartType": "WhispSummary",
                "data": percentage_data,
                "location": get_gaul_info(boundaries)
            })

    def get_stats_for_multiple_geoms(feature_collection):
        stats_list = feature_collection.map(lambda feature: ee.Feature(None, {
            "geoid": feature.get("geoid"),
            "stats": get_stats(feature.geometry()),
            "geometry": feature.geometry(),
            "location": get_gaul_info(feature.geometry())
        }))
        return stats_list
    
    def prepare_data_for_dataframe(feature_collection):
        # Fetch the feature collection information
        stats_list_info = feature_collection.getInfo()['features']
        
        data = []
        for feature_info in stats_list_info:
            properties = feature_info['properties']
            
            geometry = properties['geometry']
            centroid = ee.Geometry.Polygon(geometry['coordinates']).centroid().coordinates().getInfo()

            stats_data = properties.get('stats', {}).get('data', {})

            row = {
                'geoid': properties['geoid'],
                'area': stats_data.get('Area_ha'),
                # 'YCoord': y_coordinate,
                # 'XCoord': x_coordinate,
                'gaul0': properties.get('location', {}).get('ADM0_NAME', "-9999"),  # gaul_adm0
                'gaul1': properties.get('location', {}).get('ADM1_NAME', "-9999"),  # gaul_adm1
                'gaul2': properties.get('location', {}).get('ADM2_NAME', "-9999"),  # gaul_adm2
                'esaTree': stats_data.get('esaTrees', -9999),  # esatrees
                'jaxaTree': stats_data.get('jaxaTrees', -9999),  # jaxatrees
                'jrc2020': stats_data.get('jrcGfc2020', -9999),  # jrcgfc2020
                'gfc2020': stats_data.get('gfcTrees2020', -9999),  # gfctrees2020
                'glad2020': stats_data.get('gladLandCoverTrees2020', -9999),  # gladlandcovertrees2020
                'phtf2020': stats_data.get('phtf2020', -9999),
                'wcmcpa': stats_data.get('wcmcWdpaProtection', -9999),  # wcmcwdpaprotection
                'raddAlrt': stats_data.get('raddAlerts', -9999),  # raddalerts
                'oilpalm': stats_data.get('oilpalm', -9999),
                'fdapPalm': stats_data.get('fdapPalm', -9999),  # fdappalm
                'cocoaK': stats_data.get('cocoaKalischek', -9999),  # cocoakalischek
                'jrcPlant': stats_data.get('jrcTmfPlantations', -9999),  # jrctmfplantations
                'jrcUndis': stats_data.get('jrcTmfUndisturbed', -9999),  # jrctmfundisturbed
                'geometry': json.dumps(properties.get('geometry', {}))  # Assuming geometry is correctly structured
            }

            data.append(row)
        
        # Create DataFrame from the prepared data
        df = pd.DataFrame(data)
        df['PLOTID'] = range(1, len(df) + 1)
        cols = ['PLOTID'] + [col for col in df.columns if col != 'PLOTID']
        df = df[cols]
        return df
    
    new_feature_collection = get_stats_for_multiple_geoms(feature_collection)
    df =  prepare_data_for_dataframe(new_feature_collection)

    csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'
    
    df.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

    # Convert the DataFrame to a dictionary
    df_dict = df.to_dict(orient='records')


    # Use json.dumps to convert the dictionary to a JSON string with ensure_ascii set to False
    json_data = json.dumps(df_dict, indent=4, ensure_ascii=False)

    json_filename = os.path.splitext(file_path)[0] + '-result.json'
    
    # Write the JSON data to the new file
    with open(json_filename, 'w') as outfile:
        outfile.write(json_data)

    print(f"Data exported to {csv_file_path}")

analyze_geometries(feature_collection)