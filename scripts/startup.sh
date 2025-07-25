#!/bin/bash
# startup.sh is used to copy the secrets mounted as volumes to the app root
# and start the application

copy_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    if cp -f "$file" /app/ 2>/dev/null; then
        echo "✓ $filename"
    elif cat "$file" > "/app/$filename" 2>/dev/null; then
        echo "✓ $filename (alt)"
    else
        echo "✗ $filename"
        return 1
    fi
}

if [ -d "/app/secrets" ]; then
    echo "Processing secrets..."
    
    for dir in /app/secrets/*/; do
        [ -d "$dir" ] || continue
        
        shopt -s nullglob dotglob
        files=("$dir"*)
        
        if [ ${#files[@]} -gt 0 ]; then
            for file in "${files[@]}"; do
                [ -f "$file" ] && copy_file "$file"
            done
        fi
    done
    
    echo "Secrets processed."
fi

#TODO: implement a global check for environment variables
if [ -f "/app/.env.local" ]; then    
    echo "Running database migrations..."
    if npm run db:migrate; then
        echo "Database migrations completed successfully."
    else
        echo "Database migrations failed. Exiting."
        exit 1
    fi
    
    echo "Starting app..."
    exec npm start
else
    echo "No configuration file found, exiting."
    exit 0
fi 