import ee
import pandas as pd
import os
import json
import sys
import whisp
from modules.gee_initialize import initialize_ee
from modules.tidy_tables import whisp_risk
from modules.stats import get_stats_formatted

initialize_ee()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Correct usage is python script.py <path_to_json_file>")
        sys.exit(1) 
    else:
        file_path = sys.argv[1]
            
whisp_df = whisp.whisp_formatted_stats_geojson_to_df(file_path)
whisp_df = whisp_df.fillna('')

csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'
whisp_df.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

df_dict = whisp_df.to_dict(orient='records')
json_data = json.dumps(df_dict, indent=4, ensure_ascii=False)

json_filename = os.path.splitext(file_path)[0] + '-result.json'
with open(json_filename, 'w') as outfile:
    outfile.write(json_data)

print(f"Data exported to {json_filename}")
