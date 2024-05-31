from datetime import datetime
import json
import sys
import ee
import numpy as np
import pandas as pd
import os
import json


import ee
import os
import geemap
import time
import functools
import os
import sys
from modules.gee_initialize import initialize_ee
from modules.tiday_tables import whisp_risk

initialize_ee()

from modules.stats import get_stats
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
            generate_geo_ids = data.get('generateGeoids', False)
            if data['type'] == 'FeatureCollection':
                features = data['features']
                
            elif data['type'] == 'Feature':
                features = [data]   
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
                    properties = {}
                    print(feature)
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

# def get_stats_for_multiple_geoms(feature_collection):
#     stats_list = feature_collection.map(lambda feature: ee.Feature(None, {
#         "geoid": feature.get("geoid"),
#         "stats": get_stats(feature.geometry()),
#         "geometry": feature.geometry(),
#         # "location": get_gaul_info(feature.geometry())
#     }))
#     return stats_list

# def prepare_data_for_dataframe(feature_collection):
    
    

#     stats_list_info = feature_collection.getInfo()['features']
    
#     # data = []
#     # for feature_info in stats_list_info:
#     #     properties = feature_info['properties']
        
#     #     # geometry = properties['geometry']
#     #     # centroid = ee.Geometry.Polygon(geometry['coordinates']).centroid().coordinates().getInfo()

#     #     stats_data = properties.get('stats', {}).get('data', {})

#     #     row = {
#     #         'geoid': properties['geoid'],
#     #         'area': stats_data.get('Area_ha'),
#     #         # 'YCoord': y_coordinate,
#     #         # 'XCoord': x_coordinate,
#     #         'gaul0': properties.get('location', {}).get('ADM0_NAME', "-9999"),  # gaul_adm0
#     #         'gaul1': properties.get('location', {}).get('ADM1_NAME', "-9999"),  # gaul_adm1
#     #         'gaul2': properties.get('location', {}).get('ADM2_NAME', "-9999"),  # gaul_adm2
#     #         'esaTree': stats_data.get('esaTrees', -9999),  # esatrees
#     #         'jaxaTree': stats_data.get('jaxaTrees', -9999),  # jaxatrees
#     #         'jrc2020': stats_data.get('jrcGfc2020', -9999),  # jrcgfc2020
#     #         'gfc2020': stats_data.get('gfcTrees2020', -9999),  # gfctrees2020
#     #         'glad2020': stats_data.get('gladLandCoverTrees2020', -9999),  # gladlandcovertrees2020
#     #         'phtf2020': stats_data.get('phtf2020', -9999),
#     #         'wcmcpa': stats_data.get('wcmcWdpaProtection', -9999),  # wcmcwdpaprotection
#     #         'raddAlrt': stats_data.get('raddAlerts', -9999),  # raddalerts
#     #         'oilpalm': stats_data.get('oilpalm', -9999),
#     #         'fdapPalm': stats_data.get('fdapPalm', -9999),  # fdappalm
#     #         'cocoaK': stats_data.get('cocoaKalischek', -9999),  # cocoakalischek
#     #         'jrcPlant': stats_data.get('jrcTmfPlantations', -9999),  # jrctmfplantations
#     #         'jrcUndis': stats_data.get('jrcTmfUndisturbed', -9999),  # jrctmfundisturbed
#     #         'geometry': json.dumps(properties.get('geometry', {}))  # Assuming geometry is correctly structured
#     #     }

#     #     data.append(row)
    
#     # # Create DataFrame from the prepared data
#     # df = pd.DataFrame(data)
    
#     # # Function to convert a FeatureCollection to a list of dictionaries
#     # def fc_to_list(feature_collection):
#     #     def get_info(feature):
#     #         return feature.getInfo()

#     #     return feature_collection.map(get_info).getInfo()

#     # # Convert FeatureCollection to a list of dictionaries
#     # fc_list = fc_to_list(feature_collection)

#     # Convert list of dictionaries to a Pandas DataFrame
#     df = pd.DataFrame(fc_list)
    
#     df['PLOTID'] = range(1, len(df) + 1)
#     cols = ['PLOTID'] + [col for col in df.columns if col != 'PLOTID']
#     df = df[cols]
#     return df

def prepare_data_for_dataframe(feature_collection):
    # Convert the FeatureCollection to a list of features
    fc_list = feature_collection.getInfo()['features']
    
    # Initialize an empty list to store the rows
    data = []

    # Iterate through each feature in the list
    for feature in fc_list:
        properties = feature['properties']
        data.append(properties)
    
    # Create DataFrame from the prepared data
    df = pd.DataFrame(data)
    df['plotId'] = range(1, len(df) + 1)
    
    # Reorder columns to place 'plotId' first and 'geoid' right after it, if it exists
    cols = ['plotId'] + (['geoid'] if 'geoid' in df.columns else []) + [col for col in df.columns if col not in ['plotId', 'geoid']]
    df = df[cols]
    
    return df

feature_collection_with_stats = get_stats(feature_collection)

df = prepare_data_for_dataframe(feature_collection_with_stats)

df_w_risk = whisp_risk(
    df = df, 
    ind_1_pcent_threshold=10,
    ind_2_pcent_threshold=10,
    ind_3_pcent_threshold=0,
    ind_4_pcent_threshold=0
    )

csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'

df_w_risk.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

# Convert the DataFrame to a dictionary
df_dict = df_w_risk.to_dict(orient='records')

# Use json.dumps to convert the dictionary to a JSON string with ensure_ascii set to False
json_data = json.dumps(df_dict, indent=4, ensure_ascii=False)

json_filename = os.path.splitext(file_path)[0] + '-result.json'

# Write the JSON data to the new file
with open(json_filename, 'w') as outfile:
    outfile.write(json_data)

print(f"Data exported to {csv_file_path}")

