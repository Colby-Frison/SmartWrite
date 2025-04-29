/**
 * Vite Configuration File
 * 
 * This configuration sets up the development server for the AiSimplify application.
 * It includes proxy settings to forward API requests to the backend server.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,   // Frontend development server runs on port 8080
    proxy: {
      // Proxy API requests to the backend server
      // This allows the frontend to call '/api/*' endpoints without CORS issues
      '/api': {
        target: 'http://localhost:3001', // Backend server address
        changeOrigin: true,              // Change the origin of the host header to the target URL
        secure: false                    // Allow insecure connections (http instead of https)
      }
    }
  }
});
