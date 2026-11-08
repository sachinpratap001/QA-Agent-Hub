/**
 * Local LLM QA Agent Orchestrator — Orchestration Service
 * Routes requests to specialized agents and dispatches prompts to Ollama
 */

require('dotenv').config();
const { AGENT_TEMPLATES, detectAgent } = require('../agents/templates');
const { generate } = require('./ollama');

/**
 * Runs a specific QA agent by name against the user prompt.
 *
 * @param {Object} params
 * @param {string} params.agentName - Name of the agent to execute
 * @param {string} params.userMessage - Prompt or instructions from the user
 * @param {Array} [params.conversationHistory=[]] - Optional conversation context
 * @returns {Promise<Object>} - Execution result including agent role, response, timestamp, and model
 */
async function runAgent({ agentName, userMessage, conversationHistory = [] }) {
  const agent = AGENT_TEMPLATES[agentName];

  if (!agent) {
    throw new Error(`Unknown agent: "${agentName}". Available agents: ${Object.keys(AGENT_TEMPLATES).join(', ')}`);
  }

  // Format prompt with conversation context if history exists
  let fullPrompt = userMessage;
  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .map(entry => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}`)
      .join('\n');
    fullPrompt = `Previous Conversation Context:\n${historyText}\n\nCurrent Request:\n${userMessage}`;
  }

  const modelOutput = await generate({
    systemPrompt: agent.systemPrompt,
    userMessage: fullPrompt
  });

  return {
    agentName: agent.name,
    agentRole: agent.role,
    response: modelOutput,
    timestamp: new Date().toISOString(),
    model: process.env.OLLAMA_MODEL || 'llama3.2'
  };
}

/**
 * Automatically detects the appropriate agent from message keywords and executes it.
 *
 * @param {string} userMessage - User prompt
 * @returns {Promise<Object>} - Execution result with added detectedAgent field
 */
async function autoRoute(userMessage) {
  const detectedAgent = detectAgent(userMessage);
  const result = await runAgent({ agentName: detectedAgent, userMessage });
  return {
    ...result,
    detectedAgent
  };
}

module.exports = {
  runAgent,
  autoRoute
};
