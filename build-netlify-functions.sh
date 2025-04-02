#!/bin/bash

# Create the functions-build directory if it doesn't exist
mkdir -p netlify/functions-build

# Build the API function
npx tsc netlify/functions/api.ts --esModuleInterop --outDir netlify/functions-build

echo "Netlify functions built successfully!"