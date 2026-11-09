/**
 * Local LLM QA Agent Orchestrator — Express Server
 * BLAST Framework: Blueprint -> Link -> Architect -> Stylize -> Trigger
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const chatRouter = require('./routes/chat');
const resultsRouter = require('./routes/results');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const MEDUSA_API_URL = process.env.MEDUSA_API_URL || 'http://localhost:9000';
const MEDUSA_STOREFRONT_URL = process.env.MEDUSA_STOREFRONT_URL || 'http://localhost:8000';

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets from ../frontend/
const publicDir = path.resolve(__dirname, '../frontend');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// Mount API Routers
// chatRouter handles /chat, /agents, /health, /api/chat, /api/agents, /api/health
app.use('/api', chatRouter);
app.use('/api/results', resultsRouter);

// Serve demo recording (GET /demo/demo.webm)
app.use('/demo', express.static(path.resolve(__dirname, '../dashboard/demo')));

// Serve defect reports (GET /defects/DEF-001.md) as plain text
app.use('/defects', express.static(path.resolve(__dirname, '../docs/defects'), {
  setHeaders: (res) => res.setHeader('Content-Type', 'text/plain; charset=utf-8')
}));

// Serve Dashboard (GET /dashboard -> ../dashboard/index.html)
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.resolve(__dirname, '../dashboard/index.html');
  if (fs.existsSync(dashboardPath)) {
    return res.sendFile(dashboardPath);
  }
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QA Dashboard — Standby</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
          .card { background: #1e293b; border-radius: 8px; padding: 24px; max-width: 640px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
          h1 { color: #38bdf8; margin-top: 0; }
          a { color: #38bdf8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .badge { display: inline-block; background: #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>QA Test Results Dashboard</h1>
          <p>Dashboard HTML is initializing. Results are accessible via the REST API.</p>
          <p><span class="badge">API Endpoint</span> <a href="/api/results">/api/results</a></p>
          <p><span class="badge">Latest Run</span> <a href="/api/results/latest">/api/results/latest</a></p>
          <p><span class="badge">Chat Orchestrator</span> <a href="/">Return to Chat UI</a></p>
        </div>
      </body>
    </html>
  `);
});

// Serve Chat UI (GET / -> public/index.html)
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QA Agent Orchestrator</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
          .card { background: #1e293b; border-radius: 8px; padding: 24px; max-width: 640px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
          h1 { color: #38bdf8; margin-top: 0; }
          a { color: #38bdf8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          ul { line-height: 1.8; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Local LLM QA Agent Orchestrator</h1>
          <p>BLAST Framework Local Testing Platform (Ollama + llama3.2)</p>
          <ul>
            <li><strong>Chat API:</strong> <code>POST /api/chat</code></li>
            <li><strong>Agent Roster:</strong> <a href="/api/agents">/api/agents</a></li>
            <li><strong>Health Check:</strong> <a href="/api/health">/api/health</a></li>
            <li><strong>Test Dashboard:</strong> <a href="/dashboard">/dashboard</a></li>
            <li><strong>Test Results API:</strong> <a href="/api/results">/api/results</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

/**
 * Logs ASCII Art Banner with full system and BLAST framework information.
 */
function logStartupBanner(port) {
  const banner = `
================================================================================
   ____   ___    ____   ____ _____ _   _ _____ 
  / __ \\ / _ \\  / __ \\ / ___| ____| \\ | |_   _|
 / / _\` | /_\\ \\| / _\` | |  _|  _| |  \\| | | |  
| | (_| |  _  | | (_| | |_| | |___| |\\  | | |  
 \\ \\__,_|_| |_|\\ \\__,_|\\____|_____|_| \\_| |_|  
  \\____/        \\____/   ORCHESTRATOR           
================================================================================
 [B] BLUEPRINT  :: Test Design & Strategy        (BlueprintAgent)
 [L] LINK       :: REST API Integration         (SentinelAgent)
 [A] ARCHITECT  :: System & E2E Test Suite      (NavigatorAgent)
 [S] STYLIZE    :: Defect Triage & Reporting    (TriageAgent)
 [T] TRIGGER    :: Release Verdict & Deployment (VerdictAgent)
================================================================================
  Core Server     : http://localhost:${port}
  Chat Interface  : http://localhost:${port}/
  Dashboard       : http://localhost:${port}/dashboard
  Health Status   : http://localhost:${port}/api/health
  Agent Directory : http://localhost:${port}/api/agents
  Test Results    : http://localhost:${port}/api/results
--------------------------------------------------------------------------------
  Ollama Runtime  : ${OLLAMA_URL} [Model: ${OLLAMA_MODEL}]
  Medusa API (SUT): ${MEDUSA_API_URL}
  Storefront (SUT): ${MEDUSA_STOREFRONT_URL}
================================================================================
  Server status: ONLINE and ready for QA orchestration requests.
================================================================================
`;
  console.log(banner);
}

// Start Server
const server = app.listen(PORT, () => {
  logStartupBanner(PORT);
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed cleanly. Exiting.');
    process.exit(0);
  });

  // Force exit after 5s if connections hang
  setTimeout(() => {
    console.error('[SHUTDOWN] Force closing after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = app;
