import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    // Ensure proper base path handling for Vercel and other deployments
    base: '/',
    build: {
        // Generate a 404.html file that redirects to index.html for SPA routing
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui-vendor': ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge']
                }
            }
        }
    }
});
