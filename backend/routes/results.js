/**
 * Local LLM QA Agent Orchestrator — Test Results Routes
 * Manages test execution reports stored in dashboard/results/
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Resolve the dashboard/results directory relative to project structure
const RESULTS_DIR = path.resolve(__dirname, '../../dashboard/results');

/**
 * Ensures the results directory exists before file operations.
 */
function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

/**
 * GET /api/results
 * Returns array of test run summaries from dashboard/results/
 */
router.get(['/', '/results', '/api/results'], (req, res) => {
  try {
    ensureResultsDir();
    const files = fs.readdirSync(RESULTS_DIR).filter(file => file.endsWith('.json'));

    const summaries = files.map(file => {
      const filePath = path.join(RESULTS_DIR, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const stats = fs.statSync(filePath);
        const totals = content.totals || {
          total: content.totalTests || (content.results ? content.results.length : 0),
          passed: content.passed || 0,
          failed: content.failed || 0,
          skipped: content.skipped || 0,
          passRate: content.passRate ? parseFloat(content.passRate) : 0
        };

        return {
          runId: content.runId || file.replace('.json', ''),
          fileName: file,
          timestamp: content.timestamp || stats.mtime.toISOString(),
          verdict: content.verdict || 'COMPLETED',
          verdictReason: content.verdictReason || content.summary || '',
          totals,
          suites: content.suites || null,
          defects: content.defects || [],
          agentRuns: content.agentRuns || []
        };
      } catch (parseError) {
        return {
          runId: file.replace('.json', ''),
          fileName: file,
          error: 'Corrupted or unreadable JSON file'
        };
      }
    });

    // Sort newest first by timestamp
    summaries.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return res.json(summaries);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve test results: ${error.message}`
    });
  }
});

/**
 * GET /api/results/latest
 * Returns the most recent run's full data.
 * Must be registered before /:runId.
 */
router.get(['/latest', '/results/latest', '/api/results/latest'], (req, res) => {
  try {
    ensureResultsDir();
    const files = fs.readdirSync(RESULTS_DIR).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test runs found in dashboard/results directory.'
      });
    }

    // Load and sort all run contents by timestamp descending
    const runs = files.map(file => {
      const filePath = path.join(RESULTS_DIR, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const stat = fs.statSync(filePath);
        const timestamp = content.timestamp ? new Date(content.timestamp).getTime() : stat.mtimeMs;
        return {
          file,
          timestamp,
          content
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (runs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid test runs found.'
      });
    }

    runs.sort((a, b) => b.timestamp - a.timestamp);
    const latest = runs[0];

    return res.json({
      runId: latest.content.runId || latest.file.replace('.json', ''),
      fileName: latest.file,
      ...latest.content
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve latest test result: ${error.message}`
    });
  }
});

/**
 * POST /api/results
 * Accepts test results JSON body, writes to dashboard/results/run-{timestamp}.json
 */
router.post(['/', '/results', '/api/results'], (req, res) => {
  try {
    ensureResultsDir();

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body must contain test results JSON data.'
      });
    }

    const timestamp = Date.now();
    const fileName = `run-${timestamp}.json`;
    const filePath = path.join(RESULTS_DIR, fileName);

    const record = {
      runId: `run-${timestamp}`,
      timestamp: req.body.timestamp || new Date().toISOString(),
      ...req.body
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');

    return res.status(201).json({
      success: true,
      message: 'Test results recorded successfully.',
      runId: `run-${timestamp}`,
      fileName,
      data: record
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to save test results: ${error.message}`
    });
  }
});

/**
 * GET /api/results/:runId
 * Returns specific run data by filename / ID.
 */
router.get(['/:runId', '/results/:runId', '/api/results/:runId'], (req, res) => {
  try {
    ensureResultsDir();
    const rawId = req.params.runId;

    // Sanitize filename to prevent directory traversal
    const safeBaseName = path.basename(rawId).replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const fileName = safeBaseName.endsWith('.json') ? safeBaseName : `${safeBaseName}.json`;
    const filePath = path.join(RESULTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: `Test run "${rawId}" not found.`
      });
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return res.json({
      runId: fileName.replace('.json', ''),
      fileName,
      ...content
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Failed to read test run: ${error.message}`
    });
  }
});

module.exports = router;
