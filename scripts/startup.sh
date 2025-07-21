#!/bin/bash
# startup.sh is used to copy the secrets mounted as volumes to the app root
# and start the application
if [ -d "/app/secrets" ]; then
    echo "Secrets directory found. Copying contents to app root..."
    for dir in /app/secrets/*/; do
        if [ -d "$dir" ]; then
            echo "Copying contents from $dir to /app/"
            cp -r "$dir"* /app/
        fi
    done
    echo "Secrets copied successfully."
else
    echo "No secrets directory found. Skipping secrets copy."
fi

echo "Starting application..."
exec npm start 