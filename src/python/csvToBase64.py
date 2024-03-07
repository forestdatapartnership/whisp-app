import base64
from io import BytesIO
import os
import sys
import tempfile
import zipfile
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape
import json

def load_csv_from_file(file_path):
    try:
        with open(file_path, 'r') as file:
            # Read the CSV
            df = pd.read_csv(file)
            return df
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Correct usage is python script.py <path_to_csv_file>")
        sys.exit(1)
    else:
        file_path = sys.argv[1]
        df = load_csv_from_file(file_path)
        if df is not None:

            df['PLOTID'] = range(1, len(df) + 1)
            
            # Reorder DataFrame columns to have PLOTID at the beginning if desired
            cols = ['PLOTID'] + [col for col in df.columns if col != 'PLOTID']
            df = df[cols]
            
            # Check for 'geometry' column with GeoJSON strings
            if 'geometry' not in df.columns:
                print("Error: CSV file must contain 'geometry' column with GeoJSON strings.")
                sys.exit(1)
            
            # Convert GeoJSON strings in 'geometry' column to shapely geometries
            df['geometry'] = df['geometry'].apply(lambda x: shape(json.loads(x)))
            
            # Convert DataFrame to GeoDataFrame
            gdf = gpd.GeoDataFrame(df, geometry='geometry')

            # Use a temporary directory to save the shapefile components
            with tempfile.TemporaryDirectory() as temp_dir:
                # File path for the shapefile without extension
                shp_path = os.path.join(temp_dir, 'output_shapefile')
                
                # Save the GeoDataFrame as a Shapefile
                gdf.to_file(shp_path, driver='ESRI Shapefile', encoding='utf-8')
                
                # Create an in-memory bytes buffer for the zipped shapefile
                zip_buffer = BytesIO()
                
                # Zip the shapefile components
                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                    # Walk through the temp directory to find shapefile components
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            zf.write(os.path.join(root, file), arcname=file)
                
                # Reset zip buffer position to the beginning after writing
                zip_buffer.seek(0)
                
                # Encode the zipped shapefile to base64
                base64_encoded_str = base64.b64encode(zip_buffer.getvalue()).decode()

                print(base64_encoded_str)
        else:
            print("No geometries loaded. Exiting.")
