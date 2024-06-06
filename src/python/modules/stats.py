import ee
from modules.datasets import combine_datasets
from parameters.config_runtime import (
    percent_or_ha, plot_id_column, geometry_type_column, 
    geometry_area_column, geometry_area_column_formatting, 
    centroid_x_coord_column, centroid_y_coord_column, 
    country_column, stats_unit_type_column, 
    stats_area_columns_formatting, stats_percent_columns_formatting
)
from modules.gee_initialize import initialize_ee 
initialize_ee()

def get_geoboundaries_info(geometry):
    gbounds_ADM0 = ee.FeatureCollection("WM/geoLab/geoBoundaries/600/ADM0")
    polygonsIntersectPoint = gbounds_ADM0.filterBounds(geometry)
    return ee.Algorithms.If(
        polygonsIntersectPoint.size().gt(0), 
        polygonsIntersectPoint.first().toDictionary().select(["shapeGroup"]), 
        None
    )

def get_stats(feature_or_feature_col: ee.ComputedObject) -> ee.FeatureCollection:
    if isinstance(feature_or_feature_col, ee.Feature):
        return ee.FeatureCollection([get_stats_feature(feature_or_feature_col)])
    elif isinstance(feature_or_feature_col, ee.FeatureCollection):
        return get_stats_fc(feature_or_feature_col)
    else:
        raise TypeError("Input must be an ee.Feature or ee.FeatureCollection")

def get_stats_fc(feature_col):
    return ee.FeatureCollection(feature_col.map(get_stats_feature))

def divide_and_format(val, unit):
    formatted_value = ee.Number.parse(
        ee.Number(ee.Number(val).divide(ee.Number(unit))).format(stats_area_columns_formatting)
    )
    return ee.Number(formatted_value)

def percent_and_format(val, area_ha):
    formatted_value = ee.Number.parse(
        ee.Number(ee.Number(val).divide(area_ha).multiply(ee.Number(100))).format(stats_percent_columns_formatting)
    )
    return ee.Number(formatted_value)

def get_stats_feature(feature):
        
    img_combined = combine_datasets()

    reduce = img_combined.reduceRegion(
        reducer=ee.Reducer.sum(), 
        geometry=feature.geometry(), 
        scale=10, 
        maxPixels=1e10,
        tileScale=8
    )

    centroid = feature.geometry().centroid(1)
    location = ee.Dictionary(get_geoboundaries_info(centroid))
    country = ee.Dictionary({country_column: location.get('shapeGroup')})

    geom_type = ee.Dictionary({geometry_type_column: feature.geometry().type()})
    coords_list = centroid.coordinates()
    coords_dict = ee.Dictionary({centroid_x_coord_column: coords_list.get(0), centroid_y_coord_column: coords_list.get(1)})
    stats_unit_type = ee.Dictionary({stats_unit_type_column: percent_or_ha})
    feature_info = country.combine(geom_type).combine(coords_dict).combine(stats_unit_type)
    
    reduce_ha = reduce.map(lambda key, val: divide_and_format(ee.Number(val), ee.Number(10000)))  
    area_ha = ee.Number(ee.Dictionary(reduce_ha).get(geometry_area_column))
    
    reduce_percent = reduce_ha.map(lambda key, val: percent_and_format(ee.Number(val), area_ha))
    reducer_stats_ha = reduce_ha.set(geometry_area_column, area_ha.format(geometry_area_column_formatting))
    reducer_stats_percent = reduce_percent.set(geometry_area_column, area_ha.format(geometry_area_column_formatting))

    properties_ha = feature_info.combine(ee.Dictionary(reducer_stats_ha))
    properties_percent = feature_info.combine(ee.Dictionary(reducer_stats_percent))
    
    new_properties = ee.Algorithms.If(
        percent_or_ha == "ha",
        properties_ha,
        properties_percent
    )
    
    # Combine the existing geoid property with the new properties
    combined_properties = ee.Dictionary({
        'geoid': feature.get('geoid')
    }).combine(new_properties)

    return feature.set(combined_properties)

def add_id_to_feature_collection(dataset, id_name="PlotID"):
    indexes = dataset.aggregate_array('system:index')
    ids = ee.List.sequence(1, indexes.size())
    id_by_index = ee.Dictionary.fromLists(indexes, ids)
    
    def add_id(feature):
        system_index = feature.get('system:index')
        feature_id = id_by_index.get(system_index)
        return feature.set(id_name, feature_id)
    
    dataset_with_id = dataset.map(add_id)
    return dataset_with_id

def reorder_properties(feature, order):
    properties = {key: feature.get(key) for key in order}
    return ee.Feature(feature.geometry(), properties)

def flag_positive_values(feature, flag_positive):
    for prop_name in flag_positive:
        flag_value = ee.Algorithms.If(ee.Number(feature.get(prop_name)).gt(0), 'True', '-')
        feature = feature.set(prop_name, flag_value)
    return feature

def round_properties_to_whole_numbers(feature, round_properties):
    for prop_name in round_properties:
        prop_value = feature.get(prop_name)
        prop_value_rounded = ee.Number(prop_value).round()
        feature = feature.set(prop_name, prop_value_rounded)
    return feature

def copy_properties_and_exclude(feature, exclude_properties):
    return ee.Feature(feature.geometry()).copyProperties(source=feature, exclude=exclude_properties)

def select_and_rename_properties(feature_collection, feature):
    first_feature = ee.Feature(feature_collection.first())
    property_names = first_feature.propertyNames().getInfo()
    new_property_names = [prop.replace('_', ' ') for prop in property_names]
    return feature.select(property_names, new_property_names)
