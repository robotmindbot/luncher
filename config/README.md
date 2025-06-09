# Sentry Configuration

This directory contains the Sentry configuration for the Waza app.

## Setup Instructions

1. **Create a Sentry Account and Project**
   - Sign up at [sentry.io](https://sentry.io)
   - Create a new project for React Native
   - Note your organization slug, project name, and DSN

2. **Update Configuration**
   - Edit `config/sentry.ts` and update the following values:
     - `dsn`: Your Sentry DSN from project settings
     - `organization`: Your Sentry organization slug
     - `project`: Your project name (currently set to "waza")

3. **Update app.json**
   - The `app.json` file is already configured with the Sentry plugin
   - Update the organization slug in the plugin configuration if needed

4. **Environment Variables (Optional but Recommended)**
   Create a `.env` file in the project root with:
   ```
   EXPO_PUBLIC_SENTRY_DSN=your-actual-dsn-here
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=waza
   SENTRY_AUTH_TOKEN=your-auth-token-here
   ```

5. **For Production Builds**
   - Set `SENTRY_AUTH_TOKEN` environment variable for source map uploads
   - Adjust `tracesSampleRate` in the config for production (recommended: 0.1 or lower)
   - Set `debug: false` for production builds

## Testing

The app includes test buttons to verify Sentry integration:
- **Test Sentry Message**: Sends a test message to Sentry
- **Test Sentry Error**: Throws a test error to verify error reporting

## Features Included

- ✅ Automatic error reporting
- ✅ Navigation breadcrumbs
- ✅ Performance monitoring
- ✅ Source map support
- ✅ Native crash reporting (when not in Expo Go)
- ✅ User context and session tracking

## Source Maps

For EAS Build: Source maps are automatically uploaded when `SENTRY_AUTH_TOKEN` is set.

For manual uploads:
```bash
npx sentry-expo-upload-sourcemaps dist
```