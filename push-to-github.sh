#!/bin/bash

# This script helps push your code to GitHub
# You'll need to enter your GitHub username and repo name

# Ask for GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Ask for repository name (default: lukes-fit-track)
read -p "Enter your repository name [lukes-fit-track]: " REPO_NAME
REPO_NAME=${REPO_NAME:-lukes-fit-track}

echo "Setting up remote repository..."
# Add the GitHub repository as a remote
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

# Set the main branch
git branch -M main

echo "Ready to push to GitHub!"
echo "When prompted for your password, enter your personal access token (not your GitHub password)"
echo "Pushing your code now..."

# Push to GitHub - this will prompt for your token
git push -u origin main

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed to GitHub!"
  echo "Your repository is now available at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
  echo "❌ Push failed. Please check your credentials and try again."
fi