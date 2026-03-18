// backend/routes/generateCircuit.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Load your Groq API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // Updated to correct Groq endpoint


// Helper to check if QASM code is likely incomplete (ends mid-statement or with 'measure')
function isLikelyIncomplete(qasm) {
  // Heuristic: ends with 'measure' or an incomplete line, or missing semicolons
  const trimmed = qasm.trim();
  if (trimmed.endsWith('measure') || /measure\s+q\[\d+\]$/.test(trimmed)) return true;
  if (!trimmed.endsWith(';') && !trimmed.endsWith('}')) return true;
  return false;
}

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let messages = [
    { role: 'system', content: 'You are a quantum circuit generator. Given a natural language prompt, output only the entire, complete QASM code for the requested quantum circuit, without markdown formatting, code blocks, or explanations. If you are asked to continue, output only the next lines of QASM code.' },
    { role: 'user', content: prompt }
  ];
  let fullQasm = '';
  let maxLoops = 5;
  let loop = 0;
  let done = false;

  while (!done && loop < maxLoops) {
    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'openai/gpt-oss-20b',
          messages,
          max_tokens: 2048
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let qasm = response.data.choices[0].message.content;
      qasm = qasm.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
      fullQasm += (fullQasm && !fullQasm.endsWith('\n') ? '\n' : '') + qasm;

      // Stream the chunk to the client
      res.write(`data: ${JSON.stringify({ qasm: fullQasm, chunk: qasm, done: false })}\n\n`);

      if (!isLikelyIncomplete(qasm)) {
        done = true;
        break;
      }
      // Ask to continue
      messages.push({ role: 'assistant', content: qasm });
      messages.push({ role: 'user', content: 'Continue the QASM code from where you left off.' });
      loop++;
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message);
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate circuit.' })}\n\n`);
      res.end();
      return;
    }
  }
  // Final message
  res.write(`data: ${JSON.stringify({ qasm: fullQasm, done: true })}\n\n`);
  res.end();
});

module.exports = router;
