import time
import os

start = time.time()

import json
import ast
import numpy
import pandas
import ee
import openforis_whisp
import importlib_metadata

cred_path = "/var/secrets/credentials.json"
if not os.path.exists(cred_path):
    cred_path = os.path.join(os.path.abspath(os.getcwd()), "credentials.json")

if os.path.exists(cred_path):
    with open(cred_path, "r") as f:
        f.read()

elapsed = time.time() - start
print(f"Python warmup completed in {elapsed:.2f}s")
