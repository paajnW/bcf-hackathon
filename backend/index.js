import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Ollama } from 'ollama';
import {supabase, uploadMaterial, searchMaterials, getCourseContent } from './db/db.js'
const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.post('/api/search', async (req, res) => {
    const { userText } = req.body; // e.g., "Find me advanced tutorials on React hooks"

    if (!userText) return res.status(400).json({ error: "No search text provided" });

    try {
        // 1. AI Refinement Step
        const systemPrompt = `
            You are a search query optimizer. 
            Convert the user's natural language request into 1 or 2 essential search keywords.
            Output ONLY the keywords, no punctuation, no intro, no "Here is your search".
            Example Input: "I want to learn about how to use Postgres with Node"
            Example Output: Postgres Node
        `;

        const aiResponse = await ollama.chat({
            model: 'kimi-k2.5:cloud',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userText }
            ],
            stream: false
        });

        const refinedQuery = aiResponse.message.content.trim();
        console.log(`🔍 Original: "${userText}" -> AI Refined: "${refinedQuery}"`);

        // 2. Database Search Step
        const { data, error } = await searchMaterials(refinedQuery);

        if (error) throw error;

        res.status(200).json({
            refinedQuery, // Good for debugging on the frontend
            results: data
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Search failed", details: error.message });
    }
});
app.get('/api/materials', async (req, res) => {
    const { data, error } = await getCourseContent();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});


app.listen(PORT, () => {
  console.log(`✅ AI Test Server running on http://localhost:${PORT}`);
});