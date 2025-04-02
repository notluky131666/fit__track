#!/bin/bash

# Set repository URL
REPO_URL="https://github.com/notluky131666/fit__track.git"

# Configure Git if not already configured
if [ -z "$(git config --get user.name)" ]; then
  git config --global user.name "GitHub User"
fi

if [ -z "$(git config --get user.email)" ]; then
  git config --global user.email "user@example.com"
fi

# Remove any existing origin remote
git remote remove origin 2>/dev/null

# Add the GitHub repository as a remote using the token
echo "Setting up remote repository..."
git remote add origin "https://$GITHUB_TOKEN@github.com/notluky131666/fit__track.git"

# Set the main branch
git branch -M main

# Push to GitHub using the token
echo "Pushing code to GitHub..."
git push -u origin main

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed to GitHub!"
  echo "Your repository is now available at: https://github.com/notluky131666/fit__track"
  
  # Remove the remote with token for security
  git remote remove origin
  git remote add origin "https://github.com/notluky131666/fit__track.git"
  echo "Remote updated to remove token for security purposes."
else
  echo "❌ Push failed. Please check your credentials and try again."
fi