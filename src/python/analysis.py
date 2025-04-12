import os
import json
import sys
import ast
import openforis_whisp as whisp
import pandas as pd
import numpy as np

# Get the current working directory and resolve the absolute path.
current_directory = os.path.abspath(os.getcwd())

# Initialize the 'whisp' module using credentials from a file in the current directory.
whisp.initialize_ee(os.path.join(current_directory, 'credentials.json'))

def main(file_path):
    # Convert GeoJSON data to a DataFrame using the 'whisp' library.
    whisp_df = whisp.whisp_formatted_stats_geojson_to_df(file_path)

    # Store a copy of the original data structure to preserve important fields
    original_columns = whisp_df.columns.tolist()
    
    # Replace NaN values with empty strings for string columns, but be more careful with numeric ones
    for col in whisp_df.columns:
        # Check column type
        if whisp_df[col].dtype == 'object':
            # For string/object columns, replace NaN with empty strings
            whisp_df[col] = whisp_df[col].fillna('')

    csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'
    
    # Calculate risk-related data using 'whisp' and save it to a CSV file.
    whisp_df_risk = whisp.whisp_risk(whisp_df)
    whisp_df_risk.to_csv(csv_file_path, index=False, encoding='utf-8-sig')
    raw_csv_path = os.path.splitext(file_path)[0] + '-raw.csv'
    whisp_df_risk.to_csv(raw_csv_path, index=False, encoding='utf-8-sig')
    print(f"Raw DataFrame exported to {raw_csv_path}") 
    # More selective NaN handling - only repla:ce NaN/inf with None in numeric columns
    for col in whisp_df_risk.columns:
        if pd.api.types.is_numeric_dtype(whisp_df_risk[col]):
            # Only replace NaN/inf with None in numeric columns
            whisp_df_risk[col] = whisp_df_risk[col].replace([np.nan, np.inf, -np.inf], None)
        elif whisp_df_risk[col].dtype == 'object':
            # For object columns, replace NaN with empty string
            whisp_df_risk[col] = whisp_df_risk[col].fillna('')
    
    # Convert DataFrame to dictionary records
    df_dict = whisp_df_risk.to_dict(orient='records')
    
    # More selective cleaning function that only replaces NaN/inf with None
    def clean_nan_values(item):
        if isinstance(item, dict):
            return {k: clean_nan_values(v) for k, v in item.items()}
        elif isinstance(item, list):
            return [clean_nan_values(i) for i in item]
        elif isinstance(item, float) and (np.isnan(item) or np.isinf(item)):
            return None
        else:
            return item
    
    # Clean the dictionary
    clean_dict = clean_nan_values(df_dict)
    
    # Custom JSON encoder that handles remaining NaN values but preserves everything else
    class CustomJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
                return None
            return super().default(obj)
    
    # Create GeoJSON output format
    geojson_output = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Convert each record to a GeoJSON feature
    for record in clean_dict:
        feature = {
            "type": "Feature",
            "properties": {},
            "geometry": None
        }
        
        # Extract geometry from geojson field if available
        if 'geojson' in record and record['geojson']:
            feature["geometry"] = record['geojson']
            # Remove geometry from properties
            record.pop('geojson', None)
        elif 'geometry' in record and record['geometry']:
            feature["geometry"] = record['geometry']
            # Remove geometry from properties
            record.pop('geometry', None)
        
        # Add all other fields to properties
        feature["properties"] = {k: v for k, v in record.items() if k not in ['geojson', 'geometry']}
        
        # Add to feature collection
        geojson_output["features"].append(feature)
    
    # Save as GeoJSON
    geojson_filename = os.path.splitext(file_path)[0] + '-result.geojson'
    try:
        with open(geojson_filename, 'w') as outfile:
            json.dump(geojson_output, outfile, indent=4, cls=CustomJSONEncoder)
        print(f"GeoJSON data exported to {geojson_filename}")
    except Exception as e:
        print(f"Error saving GeoJSON: {e}")
    
    # Also save as regular JSON for backward compatibility
    json_filename = os.path.splitext(file_path)[0] + '-result.json'
    try:
        with open(json_filename, 'w') as outfile:
            json.dump(clean_dict, outfile, indent=4, cls=CustomJSONEncoder)
        print(f"JSON data exported to {json_filename}")
    except TypeError as e:
        print(f"Error in JSON conversion: {e}")
        # Fallback method if still having issues
        json_data = whisp_df_risk.to_json(orient='records', date_format='iso', force_ascii=False)
        with open(json_filename, 'w') as outfile:
            outfile.write(json_data)
        print(f"Fallback JSON data exported to {json_filename}")

if __name__ == "__main__":
    # Ensure the script is called with the correct number of arguments.
    if len(sys.argv) < 2:
        print("Error: Correct usage is python script.py <path_to_json_file>")
        sys.exit(1)  # Exit if the required argument is missing.
    else:
        file_path = sys.argv[1]  # Retrieve the JSON file path passed as an argument.
        main(file_path)
