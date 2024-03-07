from shapely.geometry import Polygon
import geopandas as gpd
import random

# Constants
ACRE_TO_SQ_METER = 4046.86
TOTAL_AREA = 20 * ACRE_TO_SQ_METER # 20 acres in square meters

# Ghana's approximate geographical bounds (latitude and longitude)
GHANA_BOUNDS = {
    "min_lat": 4.5,
    "max_lat": 11.0,
    "min_lon": -3.25,
    "max_lon": 1.2
}

# Function to generate a random point within Ghana's bounds
def random_point_in_ghana():
    lat = random.uniform(GHANA_BOUNDS["min_lat"], GHANA_BOUNDS["max_lat"])
    lon = random.uniform(GHANA_BOUNDS["min_lon"], GHANA_BOUNDS["max_lon"])
    return lon, lat

# Generate a random center point in Ghana
center_lon, center_lat = random_point_in_ghana()

# Calculate the approximate side length of the square (in degrees)
degree_to_meter = 111320 # average meters per degree
side_length_deg = (TOTAL_AREA / degree_to_meter ** 2) ** 0.5

# Generating the square polygon
square = Polygon([
    (center_lon - side_length_deg / 2, center_lat - side_length_deg / 2),
    (center_lon + side_length_deg / 2, center_lat - side_length_deg / 2),
    (center_lon + side_length_deg / 2, center_lat + side_length_deg / 2),
    (center_lon - side_length_deg / 2, center_lat + side_length_deg / 2),
    (center_lon - side_length_deg / 2, center_lat - side_length_deg / 2) # Closing the polygon
])

# Create a GeoDataFrame
gdf = gpd.GeoDataFrame([['20-acre plot']], geometry=[square], columns=['Description'])

# Get the WKT representation
wkt_representation = gdf.geometry.to_wkt().iloc[0]
print(wkt_representation)
