# Deployment Guide

This guide explains how to deploy the Rocketry Box application to different environments.

## Vercel Deployment

The recommended deployment platform for Rocketry Box is Vercel, which offers seamless integration with React applications.

### Prerequisites

1. Create a [Vercel account](https://vercel.com/signup)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

### Deployment Steps

1. Login to Vercel from the CLI:
   ```bash
   vercel login
   ```

2. Navigate to your project directory:
   ```bash
   cd rocketrybox
   ```

3. Deploy the application:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The repository includes a `vercel.json` file with the following configurations:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)\\.(.*)$",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

This configuration:
- Redirects all routes to `index.html` to support client-side routing
- Applies appropriate caching strategies for static assets

## Environment Variables

The following environment variables should be set in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `https://api.rocketrybox.com` |
| `VITE_USE_MOCK_API` | Enable/disable mock API | `false` |

## Custom Domain Setup

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Domains"
3. Add your custom domain (e.g., `rocketrybox.com`)
4. Follow the DNS configuration instructions provided by Vercel

## Continuous Deployment

Vercel automatically deploys your application when changes are pushed to the main branch. To customize this behavior:

1. Go to your project settings in Vercel
2. Navigate to the "Git" section
3. Configure your preferred Git branch and deployment settings

## Alternative Deployment Options

### Static Hosting (AWS S3, Netlify, etc.)

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory
3. Upload these files to your preferred static hosting service
4. Ensure proper configuration for Single Page Applications (SPA) by redirecting all routes to `index.html`

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t rocketrybox .
   ```

2. Run the container:
   ```bash
   docker run -p 8080:80 rocketrybox
   ```

## Troubleshooting

### Common Issues

1. **404 errors on refresh**: Ensure your server is configured to redirect all requests to `index.html`
2. **API connection issues**: Verify that `VITE_API_URL` is set correctly
3. **Static assets not loading**: Check that the correct Cache-Control headers are being applied

### Support

For deployment support, please open an issue on the GitHub repository or contact the development team at support@rocketrybox.com. 