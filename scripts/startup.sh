#!/bin/bash
# startup.sh is used to copy the secrets mounted as volumes to the app root
# and start the application

if [ -d "/app/secrets" ]; then
    echo "Secrets directory found. Copying files to app root..."
    for dir in /app/secrets/*/; do
        if [ -d "$dir" ] && [ "$(ls -A "$dir")" ]; then
            echo "Processing files from $dir"
            for file in "$dir"*; do
                if [ -f "$file" ]; then
                    filename=$(basename "$file")
                    echo "Copying file: $filename"
                    if cp -f "$file" /app/ 2>/dev/null; then
                        echo "Successfully copied $filename"
                    else
                        echo "Warning: Could not copy $filename"
                    fi
                fi
            done
        elif [ -d "$dir" ]; then
            echo "Directory $dir is empty, skipping..."
        fi
    done
    echo "Files copy process completed."
else
    echo "No secrets directory found. Skipping secrets copy."
fi

echo "Starting application..."
exec npm start 