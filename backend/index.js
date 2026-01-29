require('dotenv').config();
const express = require('express');
const { Ollama } = require('ollama');
const {dbClient} = require('supabase')
const app = express();
app.use(express.json());

const PORT = process.env.PORT|| 8000;

// Initialize Ollama
// If using local: http://127.0.0.1:11434
// If using cloud: https://api.ollama.com (verify the exact provider URL)
const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: 'Bearer ' + process.env.OLLAMA_API_KEY },
})
app.get('/check', async (req, res) => {
  try {
    res.status(200).json({ status: 'ok'});
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

app.post("/ai-check", async (req, res) => {
  const { text ,llm} = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    console.log("Sending request to AI...");
    const response = await ollama.chat({
      model: 'kimi-k2.5:cloud', // Use a model you have pulled/available
      messages: [
            { 
                role: 'user',
                content: text 
            }
        ],
      stream: false,
    });

    res.status(200).json({
      success: true,
      reply: response.message.content
    });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ 
      error: "AI Connection Failed", 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ AI Test Server running on http://localhost:${PORT}`);
});