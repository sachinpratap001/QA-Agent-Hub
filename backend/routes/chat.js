/**
 * Local LLM QA Agent Orchestrator — Chat & Agent Routes
 */

const express = require('express');
const router = express.Router();
const { AGENT_TEMPLATES } = require('../agents/templates');
const { runAgent, autoRoute } = require('../services/orchestrator');
const { checkHealth } = require('../services/ollama');

/**
 * POST /api/chat
 * Accepts { message, agentName (optional), history (optional) }
 * Runs specified agent or auto-routes based on trigger keywords.
 */
router.post(['/chat', '/api/chat', '/'], async (req, res) => {
  try {
    const { message, agentName, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Field "message" is required and cannot be empty.'
      });
    }

    let result;
    let detectedFrom;

    if (agentName && typeof agentName === 'string' && agentName.trim() !== '') {
      const trimmedAgent = agentName.trim();
      if (!AGENT_TEMPLATES[trimmedAgent]) {
        return res.status(400).json({
          success: false,
          error: `Agent "${trimmedAgent}" not found. Available agents: ${Object.keys(AGENT_TEMPLATES).join(', ')}`
        });
      }
      result = await runAgent({
        agentName: trimmedAgent,
        userMessage: message.trim(),
        conversationHistory: Array.isArray(history) ? history : []
      });
      detectedFrom = 'manual';
    } else {
      result = await autoRoute(message.trim());
      detectedFrom = result.detectedAgent;
    }

    return res.json({
      success: true,
      agentName: result.agentName,
      agentRole: result.agentRole,
      response: result.response,
      reply: result.response,
      model: result.model,
      timestamp: result.timestamp,
      detectedFrom
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the agent request.'
    });
  }
});

/**
 * GET /api/agents
 * Returns list of all registered QA agents with metadata.
 */
router.get(['/agents', '/api/agents'], (req, res) => {
  const agentsList = Object.values(AGENT_TEMPLATES).map(agent => ({
    name: agent.name,
    role: agent.role,
    description: agent.description,
    triggerKeywords: agent.triggerKeywords
  }));

  return res.json(agentsList);
});

/**
 * GET /api/health
 * Returns server health and local Ollama status with loaded models.
 */
router.get(['/health', '/api/health'], async (req, res) => {
  try {
    const ollamaStatus = await checkHealth();
    return res.json({
      status: 'ok',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      ollama: {
        healthy: ollamaStatus.healthy,
        models: ollamaStatus.models || [],
        ...(ollamaStatus.error ? { error: ollamaStatus.error } : {})
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      ollama: {
        healthy: false,
        models: [],
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
