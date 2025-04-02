#!/bin/bash

# Replace these values with your actual GitHub information
GITHUB_USERNAME="your-username"
REPO_NAME="lukes-fit-track"
PERSONAL_ACCESS_TOKEN="your-personal-access-token"

# Add the GitHub repository as a remote
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

# Set the main branch
git branch -M main

# Push to GitHub using your personal access token
git push -u origin main

echo "Successfully pushed to GitHub!"