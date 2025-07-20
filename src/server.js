require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";
const PORT = process.env.PORT || 3456;
const SILENCE_STARTUP = process.env.SILENCE_STARTUP === 'true';

const app = express();
app.use(bodyParser.json());

// Log to stderr instead of stdout to avoid MCP protocol issues
const log = (...args) => {
  if (!SILENCE_STARTUP) {
    console.error(...args);
  }
};

app.get('/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API}/api/tags`);
    res.json({ models: response.data.models });
  } catch (error) {
    log('Error in /models:', error.message);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/models/pull', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Modelnaam is verplicht" });
    
    // Handle streaming response from Ollama
    const response = await axios.post(`${OLLAMA_API}/api/pull`, { name }, {
      responseType: 'stream'
    });
    
    let result = '';
    response.data.on('data', chunk => {
      result += chunk.toString();
    });
    
    response.data.on('end', () => {
      try {
        // Parse the last line as JSON (final status)
        const lines = result.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const finalResult = JSON.parse(lastLine);
        res.json(finalResult);
      } catch (parseError) {
        res.json({ status: 'completed', name });
      }
    });
    
  } catch (error) {
    log('Error in /models/pull:', error.message);
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.post(`${OLLAMA_API}/api/show`, { name });
    res.json(response.data);
  } catch (error) {
    log('Error in /models/:name:', error.message);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { model, messages, stream = false } = req.body;
    if (!model || !messages) {
      return res.status(400).json({ error: "Zowel 'model' als 'messages' zijn verplicht" });
    }

    if (stream) {
      // Handle streaming response
      const response = await axios.post(`${OLLAMA_API}/api/chat`, 
        { model, messages, stream: true }, 
        { responseType: 'stream' }
      );
      
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });
      
      response.data.pipe(res);
    } else {
      // Handle non-streaming response
      const response = await axios.post(`${OLLAMA_API}/api/chat`, { 
        model, 
        messages, 
        stream: false 
      });
      
      res.json({ 
        response: response.data.message?.content || response.data.response,
        model: response.data.model,
        created_at: response.data.created_at,
        done: response.data.done
      });
    }
  } catch (error) {
    log('Error in /chat:', error.message);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/generate', async (req, res) => {
  try {
    const { model, prompt, stream = false } = req.body;
    if (!model || !prompt) {
      return res.status(400).json({ error: "Zowel 'model' als 'prompt' zijn verplicht" });
    }

    const response = await axios.post(`${OLLAMA_API}/api/generate`, {
      model,
      prompt,
      stream: false
    });

    res.json({
      response: response.data.response,
      model: response.data.model,
      created_at: response.data.created_at,
      done: response.data.done
    });
  } catch (error) {
    log('Error in /generate:', error.message);
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: "ok", 
    mcp: true, 
    ollama_api: OLLAMA_API,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  log('Unhandled error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  // Use stderr for logging to avoid interfering with MCP protocol
  log(`✅ Ollama MCP server draait op poort ${PORT} (proxy naar ${OLLAMA_API})`);
  log(`🔗 Health check beschikbaar op http://localhost:${PORT}/health`);
});
