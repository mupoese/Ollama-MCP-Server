require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";
const PORT = process.env.PORT || 3456;

const app = express();
app.use(bodyParser.json());

app.get('/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API}/api/tags`);
    res.json({ models: response.data.models });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/models/pull', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Modelnaam is verplicht" });
    const response = await axios.post(`${OLLAMA_API}/api/pull`, { name });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.get(`${OLLAMA_API}/api/show`, { params: { name } });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { model, messages } = req.body;
    if (!model || !messages) {
      return res.status(400).json({ error: "Zowel 'model' als 'messages' zijn verplicht" });
    }
    const response = await axios.post(`${OLLAMA_API}/api/chat`, { model, messages });
    res.json({ response: response.data.message?.content || response.data.response });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: "ok", mcp: true, ollama_api: OLLAMA_API });
});

app.listen(PORT, () => {
  console.log(`✅ Ollama MCP server draait op poort ${PORT} (proxy naar ${OLLAMA_API})`);
});
