import os
import json
import sys
import ast
import whisp
import pandas as pd

# Get the current working directory and resolve the absolute path.
current_directory = os.path.abspath(os.getcwd())

# Initialize the 'whisp' module using credentials from a file in the current directory.
whisp.initialize_ee(os.path.join(current_directory, 'credentials.json'))

if __name__ == "__main__":
    # Ensure the script is called with the correct number of arguments.
    if len(sys.argv) < 2:
        print("Error: Correct usage is python script.py <path_to_json_file>")
        sys.exit(1)  # Exit if the required argument is missing.
    else:
        file_path = sys.argv[1]  # Retrieve the JSON file path passed as an argument.

# Convert GeoJSON data to a DataFrame using the 'whisp' library.
whisp_df = whisp.whisp_formatted_stats_geojson_to_df(file_path)

# Replace NaN values with empty strings for consistency.
whisp_df = whisp_df.fillna('')

# Rename 'geo' column to 'geojson' and ensure correct formatting
if 'geo' in whisp_df.columns:
    whisp_df = whisp_df.rename(columns={'geo': 'geojson'})

    # Graceful way to parse geojson correctly
    def parse_geojson(value):
        if isinstance(value, str):  # If it's a string, try to parse
            try:
                return ast.literal_eval(value)  # Safely parse Python-like JSON
            except (ValueError, SyntaxError):
                return None  # Return None if parsing fails
        return value  # If already a dict, return as-is

    whisp_df['geojson'] = whisp_df['geojson'].apply(parse_geojson)

# Define the path for the resulting CSV file based on the input file name.
csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'

# Calculate risk-related data using 'whisp' and save it to a CSV file.
whisp_df_risk = whisp.whisp_risk(whisp_df)
whisp_df_risk.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

# Convert the DataFrame to a dictionary, then to a formatted JSON string.
df_dict = whisp_df_risk.to_dict(orient='records')
json_data = json.dumps(df_dict, indent=4, ensure_ascii=False)

# Save the JSON string to a file with a corresponding name.
json_filename = os.path.splitext(file_path)[0] + '-result.json'
with open(json_filename, 'w') as outfile:
    outfile.write(json_data)

# Notify the user of the successful export.
print(f"Data exported to {json_filename}")

