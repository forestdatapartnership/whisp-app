import os
import json
import sys
import whisp

current_directory = os.path.abspath(os.getcwd())
whisp.initialize_ee(os.path.join(current_directory, 'credentials.json'))
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
whisp_df_risk = whisp.whisp_risk(whisp_df)
df_dict = whisp_df_risk.to_dict(orient='records')
json_data = json.dumps(df_dict, indent=4, ensure_ascii=False)

json_filename = os.path.splitext(file_path)[0] + '-result.json'
with open(json_filename, 'w') as outfile:
    outfile.write(json_data)

print(f"Data exported to {json_filename}")
