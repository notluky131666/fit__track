#!/bin/bash

# Set up Git remote for the specified repository
echo "Setting up remote repository..."
git remote add origin https://github.com/notluky131666/fit__track.git

# Set the main branch
git branch -M main

echo "Ready to push to GitHub!"
echo "When prompted for your password, enter your personal access token (not your GitHub password)"
echo "Pushing your code now..."

# Push to GitHub - this will prompt for your token
git push -u origin main

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed to GitHub!"
  echo "Your repository is now available at: https://github.com/notluky131666/fit__track"
else
  echo "❌ Push failed. Please check your credentials and try again."
fi