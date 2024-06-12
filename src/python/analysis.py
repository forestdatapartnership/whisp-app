import ee
import pandas as pd
import os
import json
import sys
from modules.gee_initialize import initialize_ee
from modules.tidy_tables import whisp_risk

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
                if 'geometry' in feature and 'type' in feature['geometry']:
                    geometry_type = feature['geometry']['type']
                    properties = {}

                    if 'geoid' in feature['properties']:
                        properties['geoid'] = feature['properties']['geoid']
                    else:
                        properties['geoid'] = 'na'

                    if geometry_type == 'Polygon':
                        ee_feature = ee.Feature(ee.Geometry.Polygon(feature['geometry']['coordinates']), properties)
                    elif geometry_type == 'Point':
                        ee_feature = ee.Feature(ee.Geometry.Point(feature['geometry']['coordinates']), properties)
                    else:
                        print("Invalid geometry type in JSON.")
                        continue

                    out_fc_list.append(ee_feature)
                else:
                    print("Invalid geometry format in JSON.")
            feature_collection = ee.FeatureCollection(out_fc_list)
            print("FeatureCollection created.")
        else:
            print("No geometries loaded. Exiting.")
            
def prepare_data_for_dataframe(feature_collection):
    # Convert the FeatureCollection to a list of features
    fc_list = feature_collection.getInfo()['features']
    
    # Initialize an empty list to store the rows
    data = []

    # Iterate through each feature in the list
    for feature in fc_list:
        properties = feature['properties']
        geometry = feature['geometry']
        properties['geometry'] = json.dumps(geometry)
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

