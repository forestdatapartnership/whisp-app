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

class AnalysisOptions:
    def __init__(self, d: dict | None):
        d = d or {}
        self.external_id_column = d.get('externalIdColumn')
        self.unit_type = d.get('unitType')
        nc = d.get('nationalCodes')
        self.national_codes = [str(c).lower() for c in nc] if isinstance(nc, list) and nc else None

def main(file_path, legacy_mode=False):
    opts = AnalysisOptions(None)
    try:
        with open(file_path, 'r') as f:
            payload = json.load(f)
            opts = AnalysisOptions(payload.get('analysisOptions') if isinstance(payload, dict) else None)
    except Exception:
        pass
    df_kwargs = {}
    if opts.national_codes: df_kwargs['national_codes'] = opts.national_codes
    #else: df_kwargs['national_codes'] = ['co','ci','br']
    if opts.external_id_column: df_kwargs['external_id_column'] = opts.external_id_column
    if opts.unit_type: df_kwargs['unit_type'] = opts.unit_type
    whisp_df = whisp.whisp_formatted_stats_geojson_to_df(file_path, **df_kwargs)

    csv_file_path = os.path.splitext(file_path)[0] + '-result.csv'
    json_file_path = os.path.splitext(file_path)[0] + '-result.json'

    whisp_df_risk = whisp.whisp_risk(
        whisp_df,
        explicit_unit_type=opts.unit_type if opts.unit_type else None,
        national_codes=opts.national_codes if opts.national_codes else None
    )

    for col in whisp_df_risk.columns:
        if pd.api.types.is_numeric_dtype(whisp_df_risk[col]):
            whisp_df_risk[col] = whisp_df_risk[col].replace([np.nan, np.inf, -np.inf], None)
        elif whisp_df_risk[col].dtype == 'object':
            whisp_df_risk[col] = whisp_df_risk[col].fillna('')

    whisp_df_risk.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

    if not legacy_mode:
        whisp.convert_df_to_geojson(whisp_df_risk, json_file_path)
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
        
        class CustomJSONEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
                    return None
                return super().default(obj)
                
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

        try:
            with open(json_file_path, 'w') as outfile:
                json.dump(clean_dict, outfile, indent=4, cls=CustomJSONEncoder)
            print(f"JSON data exported to {json_file_path}")
        except TypeError as e:
            print(f"Error in JSON conversion: {e}")
            json_data = whisp_df_risk.to_json(orient='records', date_format='iso', force_ascii=False)
            with open(json_file_path, 'w') as outfile:
                outfile.write(json_data)
            print(f"Fallback JSON data exported to {json_file_path}")

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
