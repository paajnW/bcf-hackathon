import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Ollama } from 'ollama';
import {supabase, uploadMaterial, searchMaterials, getAllMaterials } from './db/db.js'
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
// 1. Health Check Endpoint
app.get('/health', async (req, res) => {
    const { data, error } = await supabase.from('chat_history').select('*');
    if (error) {
        console.error("Supabase Error:", error);
        return res.status(500).json({ status: "Connection Failed", error: error.message });
    }
    res.json({ status: "System Live", database: "Supabase Connected", courses: data });
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

app.post('/api/admin/upload', async (req, res) => {
    const { data, error } = await uploadMaterial(req.body);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Content Categorized Successfully", data });
});

// GET: Student searches materials [cite: 20, 58]
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    const { data, error } = await searchMaterials(query);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});
app.get('/api/materials', async (req, res) => {
    const { data, error } = await getAllMaterials();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});


app.listen(PORT, () => {
  console.log(`✅ AI Test Server running on http://localhost:${PORT}`);
});