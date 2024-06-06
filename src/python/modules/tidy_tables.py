import pandas as pd
from parameters.config_runtime import (
    percent_or_ha, 
    cols_ind_1_treecover,
    cols_ind_2_commodities,
    cols_ind_3_dist_before_2020,
    cols_ind_4_dist_after_2020,
    geometry_area_column
)

def clamp(value, min_val, max_val):
    """Clamp a value or a Pandas Series within a specified range."""
    if isinstance(value, pd.Series):
        return value.clip(lower=min_val, upper=max_val)
    else:
        return max(min_val, min(value, max_val))

def check_range(value):
    """Check if a value is within the range of 0 to 100."""
    if not (0 <= value <= 100):
        raise ValueError("Value must be between 0 and 100.")

def whisp_risk(
    df,
    ind_1_pcent_threshold,
    ind_2_pcent_threshold,
    ind_3_pcent_threshold,
    ind_4_pcent_threshold,
    ind_1_input_columns=cols_ind_1_treecover,
    ind_2_input_columns=cols_ind_2_commodities,
    ind_3_input_columns=cols_ind_3_dist_before_2020,
    ind_4_input_columns=cols_ind_4_dist_after_2020,
    ind_1_name="Indicator_1_treecover",
    ind_2_name="Indicator_2_commodities",
    ind_3_name="Indicator_3_disturbance_before_2020",
    ind_4_name="Indicator_4_disturbance_after_2020",
    low_name="no",
    high_name="yes"
):
    """Adds the EUDR (European Union Deforestation Risk) column to the DataFrame based on indicator values."""
    check_range(ind_1_pcent_threshold)
    check_range(ind_2_pcent_threshold)
    check_range(ind_3_pcent_threshold)
    check_range(ind_4_pcent_threshold)

    df_w_indicators = add_indicators(
        df,
        ind_1_pcent_threshold,
        ind_2_pcent_threshold,
        ind_3_pcent_threshold,
        ind_4_pcent_threshold,
        ind_1_input_columns,
        ind_2_input_columns,
        ind_3_input_columns,
        ind_4_input_columns,
        ind_1_name,
        ind_2_name,
        ind_3_name,
        ind_4_name,
        low_name,
        high_name
    )

    df_w_indicators_and_risk = add_eudr_risk_col(
        df=df_w_indicators,
        ind_1_name=ind_1_name,
        ind_2_name=ind_2_name,
        ind_3_name=ind_3_name,
        ind_4_name=ind_4_name
    )

    return df_w_indicators_and_risk

def add_eudr_risk_col(
    df,
    ind_1_name="Indicator_1_treecover",
    ind_2_name="Indicator_2_commodities",
    ind_3_name="Indicator_3_disturbance_before_2020",
    ind_4_name="Indicator_4_disturbance_after_2020"
):
    """Adds the EUDR (European Union Deforestation Risk) column to the DataFrame based on indicator values."""
    for index, row in df.iterrows():
        if row[ind_1_name] == "no" or row[ind_2_name] == "yes" or row[ind_3_name] == "yes":
            df.at[index, 'EUDR_risk'] = "low"
        elif row[ind_4_name] == "no":
            df.at[index, 'EUDR_risk'] = "more_info_needed"
        else:
            df.at[index, 'EUDR_risk'] = "high"

    return df

def add_indicators(
    df,
    ind_1_pcent_threshold,
    ind_2_pcent_threshold,
    ind_3_pcent_threshold,
    ind_4_pcent_threshold,
    ind_1_input_columns=cols_ind_1_treecover,
    ind_2_input_columns=cols_ind_2_commodities,
    ind_3_input_columns=cols_ind_3_dist_before_2020,
    ind_4_input_columns=cols_ind_4_dist_after_2020,
    ind_1_name="Indicator_1_treecover",
    ind_2_name="Indicator_2_commodities",
    ind_3_name="Indicator_3_disturbance_before_2020",
    ind_4_name="Indicator_4_disturbance_after_2020",
    low_name="no",
    high_name="yes"
):
    """Add presence indicators to the DataFrame based on thresholds."""
    df_w_indicators = add_indicator_column(
        df, ind_1_input_columns, ind_1_pcent_threshold, ind_1_name, low_name, high_name)
    df_w_indicators = add_indicator_column(
        df_w_indicators, ind_2_input_columns, ind_2_pcent_threshold, ind_2_name, low_name, high_name)
    df_w_indicators = add_indicator_column(
        df_w_indicators, ind_3_input_columns, ind_3_pcent_threshold, ind_3_name, low_name, high_name)
    df_w_indicators = add_indicator_column(
        df_w_indicators, ind_4_input_columns, ind_4_pcent_threshold, ind_4_name, low_name, high_name)

    return df_w_indicators

def add_indicator_column(
    df, input_columns, threshold, new_column_name, low_name='yes', high_name='no', sum_comparison=False
):
    """Add a new column to the DataFrame based on the specified columns, threshold, and comparison sign."""
    df[new_column_name] = low_name

    if sum_comparison:
        sum_values = df[input_columns].sum(axis=1)
        df.loc[sum_values > threshold, new_column_name] = high_name
    else:
        for col in input_columns:
            if percent_or_ha == "ha":
                val_to_check = clamp(((df[col] / df[geometry_area_column]) * 100), 0, 100)
            else:
                val_to_check = df[col]
            df.loc[val_to_check > threshold, new_column_name] = high_name

    return df
