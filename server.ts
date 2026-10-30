/**
 * SchoolVerse Full-Stack Entry Point
 * Express server mounting API router and Vite dev middleware on Port 3000
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './src/server/routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import http from 'node:http';
import { WebSocketServer } from 'ws';
import { setupCampusWebSocket } from './src/server/realtime.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Router mounted at /api
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'SchoolVerse', timestamp: new Date().toISOString() });
  });

  const httpServer = http.createServer(app);

  // Mount WebSocket Server on /ws/campus
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/campus' });
  setupCampusWebSocket(wss);

  if (!isProd) {
    // Mount Vite middleware in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SchoolVerse] Dev server mounted with Vite middleware.');
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[SchoolVerse] Production server serving static files from dist.');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[SchoolVerse] Server running on http://0.0.0.0:${PORT} with WebSocket on /ws/campus`);
  });
}

startServer().catch((err) => {
  console.error('[SchoolVerse] Fatal startup error:', err);
  process.exit(1);
});
