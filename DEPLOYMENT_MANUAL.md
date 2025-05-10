# FocusFlow PWA Deployment Manual

This document provides detailed instructions for managing and deploying the FocusFlow Progressive Web App (PWA) to GitHub Pages.

## Prerequisites

- Git installed on your local machine
- GitHub account with repository access
- Basic command line familiarity

## Repository Structure

The FocusFlow PWA consists of the following key files:

- `index.html`: Main HTML file
- `app.js`: Core application logic
- `style.css`: CSS styling
- `manifest.json`: PWA configuration
- `service-worker.js`: Offline caching and PWA functionality
- `images/`: App icons in various sizes
- `sounds/`: Audio files for timer and ambient sounds

## Deploying to GitHub Pages

### Initial Setup

If this is your first time deploying:

1. Create a GitHub repository named `focusflow-app`
2. Run the deployment script:
   ```bash
   cd "/media/neeraj/20265E15265DEC72/study/CODE/projects/linux projects/pomodoro/WebApp"
   ./deploy_to_github.sh
   ```

### Updating Existing Deployment

When you've made changes and want to update:

1. Update the service worker version:
   ```bash
   # Update these lines in service-worker.js
   const staticCacheName = 'focusflow-static-v[CURRENT_DATE]';
   const dynamicCacheName = 'focusflow-dynamic-v[CURRENT_DATE]';
   ```

2. Add, commit, and push your changes:
   ```bash
   git add .
   git commit -m "Update FocusFlow PWA"
   git pull origin main  # Pull latest changes first
   git push origin main
   ```

3. Verify deployment at:
   - https://Neeraj-Parekh.github.io/focusflow-app/

## GitHub Authentication

If you encounter authentication issues, use a Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select "repo" scope
4. Use this token as your password when Git prompts for credentials

## Testing After Deployment

1. Visit https://Neeraj-Parekh.github.io/focusflow-app/
2. Check that:
   - Timer functions work correctly
   - Settings save between sessions
   - Audio files play properly
   - Installation prompts appear on mobile devices
   - Offline functionality works (by disconnecting internet)

## Troubleshooting

### Common Issues:

1. **Push rejected:**
   ```bash
   git pull origin main --rebase
   git push origin main
   ```

2. **Cache not updating:**
   - Update service worker version numbers
   - Clear browser cache and reload

3. **Files not found:**
   - Check relative paths (should start with `./`)
   - Verify case sensitivity in filenames

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Testing PWAs with Lighthouse](https://developers.google.com/web/tools/lighthouse)
