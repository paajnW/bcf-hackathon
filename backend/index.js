require('dotenv').config('.env');
const express = require('express');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {OpenAI} = require('openai')
const {Ollama} = require('ollama')
const app = express();
app.use(express.json());

const PORT = process.env.PORT||8000;

const ollamaCloud = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: 'Bearer ' + process.env.OLLAMA_API_KEY },
})

app.post("/ai-check", async (req, res) => {
  const { text, llm } = req.body;
  try {
    let extracted;
    const systemPrompt ="natural conversation";
    
      const response = await ollamaCloud.chat({
        model:"gpt-oss:20b-cloud",
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
      });
      extracted = JSON.parse(response.message.content);

  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});