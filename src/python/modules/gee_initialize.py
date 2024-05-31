from datetime import datetime
import json
import sys
import ee
import numpy as np
import pandas as pd
import os
import json


import ee
import os
import geemap
import time
import functools
import os
import sys

from google.oauth2 import service_account

def initialize_ee():
    """Initializes Google Earth Engine with credentials located one level up from the script's directory."""
    try:
        # Check if EE is already initialized
        if not ee.data._initialized:
            # Construct the path to the credentials file
            current_directory = os.getcwd()
            credentials_path = os.path.join(current_directory, 'credentials.json')

            # Initialize EE with the credentials file
            credentials = service_account.Credentials.from_service_account_file(credentials_path,
                                                                                scopes=['https://www.googleapis.com/auth/earthengine'])
            ee.Initialize(credentials)
            print("Earth Engine initialized.")
    except Exception as e:
        print("An error occurred during Earth Engine initialization:", e)

