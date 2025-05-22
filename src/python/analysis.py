import os
import json
import sys
import ast
import openforis_whisp as whisp
import pandas as pd
import numpy as np

CREDENTIAL_PATH = "/var/secrets/credentials.json"
if not os.path.exists(CREDENTIAL_PATH):
    CREDENTIAL_PATH = os.path.join(os.path.abspath(os.getcwd()), "credentials.json")

whisp.initialize_ee(CREDENTIAL_PATH)

def main(file_path, legacy_mode=False):
    whisp_df = whisp.whisp_formatted_stats_geojson_to_df(file_path)

    if 'geo' in whisp_df.columns:
        whisp_df = whisp_df.rename(columns={'geo': 'geojson'})

    for col in whisp_df.columns:
        if col != 'geojson' and whisp_df[col].dtype == 'object':
            whisp_df[col] = whisp_df[col].fillna('')

    if 'geojson' in whisp_df.columns:
        def parse_geojson(val):
            if isinstance(val, str):
                try:
                    return ast.literal_eval(val)
                except (ValueError, SyntaxError):
                    return val
            return val
        whisp_df['geojson'] = whisp_df['geojson'].apply(parse_geojson)

    csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'

    whisp_df_risk = whisp.whisp_risk(whisp_df)
    whisp_df_risk.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

    for col in whisp_df_risk.columns:
        if pd.api.types.is_numeric_dtype(whisp_df_risk[col]):
            whisp_df_risk[col] = whisp_df_risk[col].replace([np.nan, np.inf, -np.inf], None)
        elif whisp_df_risk[col].dtype == 'object':
            whisp_df_risk[col] = whisp_df_risk[col].fillna('')

    json_filename = os.path.splitext(file_path)[0] + '-result.json'
    
    if not legacy_mode:
        try:
            # Convert DataFrame to GeoJSON without using geopandas
            geojson_output = {
                "type": "FeatureCollection",
                "features": []
            }
            
            for _, row in whisp_df_risk.iterrows():
                feature = {
                    "type": "Feature",
                    "properties": {},
                    "geometry": None
                }
                
                # Extract geometry from geojson field
                if 'geojson' in row and row['geojson']:
                    if isinstance(row['geojson'], str):
                        try:
                            geometry_data = ast.literal_eval(row['geojson'])
                            feature["geometry"] = geometry_data
                        except (ValueError, SyntaxError):
                            feature["geometry"] = None
                    else:
                        feature["geometry"] = row['geojson']
                elif 'geometry' in row and row['geometry']:
                    if isinstance(row['geometry'], str):
                        try:
                            geometry_data = ast.literal_eval(row['geometry'])
                            feature["geometry"] = geometry_data
                        except (ValueError, SyntaxError):
                            feature["geometry"] = None
                    else:
                        feature["geometry"] = row['geometry']
                
                # Add all other fields as properties
                for key, value in row.items():
                    if key not in ['geojson', 'geometry']:
                        # Handle NaN, infinity values
                        if isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
                            feature["properties"][key] = None
                        else:
                            feature["properties"][key] = value
                
                geojson_output["features"].append(feature)
            
            # Write the GeoJSON to file
            with open(json_filename, 'w') as outfile:
                json.dump(geojson_output, outfile, indent=4)
            
            print(f"GeoJSON data exported to {json_filename}")
        except Exception as e:
            print(f"Error in GeoJSON conversion: {e}")
            # Fall back to legacy mode
            legacy_mode = True
    if legacy_mode:
        # Legacy mode - original format output
        df_dict = whisp_df_risk.to_dict(orient='records')
        
        for record in df_dict:
            for geo_field in ['geojson', 'geometry']:
                if geo_field in record and isinstance(record[geo_field], str):
                    try:
                        record[geo_field] = ast.literal_eval(record[geo_field])
                    except (ValueError, SyntaxError):
                        pass
        
        def clean_nan_values(item):
            if isinstance(item, dict):
                return {k: clean_nan_values(v) for k, v in item.items()}
            elif isinstance(item, list):
                return [clean_nan_values(i) for i in item]
            elif isinstance(item, float) and (np.isnan(item) or np.isinf(item)):
                return None
            else:
                return item

        clean_dict = clean_nan_values(df_dict)
        
        class CustomJSONEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
                    return None
                return super().default(obj)
                
        try:
            with open(json_filename, 'w') as outfile:
                json.dump(clean_dict, outfile, indent=4, cls=CustomJSONEncoder)
            print(f"JSON data exported to {json_filename}")
        except TypeError as e:
            print(f"Error in JSON conversion: {e}")
            json_data = whisp_df_risk.to_json(orient='records', date_format='iso', force_ascii=False)
            with open(json_filename, 'w') as outfile:
                outfile.write(json_data)
            print(f"Fallback JSON data exported to {json_filename}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Correct usage is python script.py <path_to_json_file> [legacy]")
        sys.exit(1)
    else:
        file_path = sys.argv[1]
        # Check if legacy parameter is provided
        legacy_mode = len(sys.argv) > 2 and sys.argv[2] == "legacy"
        print(f"Legacy mode: {legacy_mode}")
        main(file_path, legacy_mode)
