import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Ollama } from 'ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import {supabase, uploadFileToStorage, searchMaterial, getCourseContent, createSmartChunks, saveVectorizedChunk, vectorSearch, saveMaterialMetadata } from './db/db.js'

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const upload = multer();
const PORT = process.env.PORT || 8000;

// Initialize Ollama
const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: 'Bearer ' + process.env.OLLAMA_API_KEY },
});

// Initialize Google Generative AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Default embedding model
const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'ollama'; // 'ollama' or 'gemini'

/**
 * Generate embeddings using specified model (Ollama or Gemini)
 */
const generateEmbedding = async (text, model = DEFAULT_EMBEDDING_MODEL) => {
    try {
        if (model === 'gemini') {
            const geminiModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
            const result = await geminiModel.embedContent(text);
            return result.embedding.values;
        } else {
            // Default to Ollama
            const embeddingRes = await ollama.embeddings({
                model: 'mxbai-embed-large',
                prompt: text,
            });
            return embeddingRes.embedding;
        }
    } catch (error) {
        console.error(`Error generating embedding with ${model}:`, error.message);
        throw error;
    }
};

/**
 * Generate AI response using specified model
 */
const generateAIResponse = async (messages, model = 'ollama') => {
    try {
        if (model === 'gemini') {
            const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const response = await geminiModel.generateContent(
                messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            );
            return response.response.text();
        } else {
            // Default to Ollama
            const response = await ollama.chat({
                model: 'kimi-k2.5:cloud',
                messages: messages,
                stream: false,
            });
            return response.message.content;
        }
    } catch (error) {
        console.error(`Error generating AI response with ${model}:`, error.message);
        throw error;
    }
};

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
  const { text, model = 'ollama' } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    console.log(`Sending request to AI (${model})...`);
    const reply = await generateAIResponse(
        [{ role: 'user', content: text }],
        model
    );

    res.status(200).json({
      success: true,
      model: model,
      reply: reply
    });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ 
      error: "AI Connection Failed", 
      details: error.message
    });
  }
});

app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const embeddingModel = req.body.embeddingModel || DEFAULT_EMBEDDING_MODEL;
        
        if (!file) return res.status(400).json({ error: "No file uploaded" });

        // 1. Upload file to Supabase Storage
        const fileUrl = await uploadFileToStorage(file.buffer, file.originalname, file.mimetype);

        // 2. Extract text from file buffer - handle binary data safely
        let text = file.buffer.toString('utf-8', 0, file.buffer.length)
            .replace(/\0/g, '') // Remove null bytes
            .trim();
        
        // Validate that we have meaningful content
        if (!text || text.length < 10) {
            return res.status(400).json({ 
                error: "File does not contain readable text content",
                fileSize: file.size,
                contentLength: text.length
            });
        }
        
        const fileMetadata = {
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size || 0,
            uploadedAt: new Date().toISOString(),
            embeddingModel: embeddingModel,
            textLength: text.length
        };

        // 3. Save Metadata and the Storage URL to DB
        const { data: material, error } = await saveMaterialMetadata(req.body, text, fileUrl, fileMetadata);
        if (error) throw error;

        // 4. Intelligent Chunking & Vectoring with metadata preservation
        const chunks = await createSmartChunks(text, fileMetadata);
        console.log(`📄 Processing ${chunks.length} chunks from ${file.originalname} using ${embeddingModel}`);
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
                // Generate embedding vector for the chunk using specified model
                const embedding = await generateEmbedding(chunk.content, embeddingModel);

                // Save vectorized chunk with enhanced metadata
                await saveVectorizedChunk(material.id, chunk, embedding);
            } catch (chunkErr) {
                console.error(`Error processing chunk ${i}:`, chunkErr.message);
                // Continue processing other chunks
            }
        }

        res.status(200).json({ 
            message: "File stored and knowledge base vectorized!", 
            url: fileUrl,
            id: material.id,
            totalChunks: chunks.length,
            embeddingModel: embeddingModel,
            metadata: fileMetadata
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Student searches materials [cite: 20, 58]
app.post('/api/search', async (req, res) => {
    const { userText, topK = 5, embeddingModel = DEFAULT_EMBEDDING_MODEL } = req.body;

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

        const refinedQuery = await generateAIResponse(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userText }
            ],
            embeddingModel === 'gemini' ? 'gemini' : 'ollama'
        );

        console.log(`🔍 Original: "${userText}" -> AI Refined: "${refinedQuery.trim()}"`);

        // 2. Vector-based Search Step - Generate embedding for the query
        const queryEmbedding = await generateEmbedding(refinedQuery.trim(), embeddingModel);

        // 3. Semantic Search using vector similarity
        const { data, error } = await vectorSearch(queryEmbedding, topK);

        if (error) throw error;

        res.status(200).json({
            refinedQuery: refinedQuery.trim(),
            totalResults: data.length,
            results: data,
            searchMethod: 'vector-semantic',
            embeddingModel: embeddingModel
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
  console.log(`📊 Default Embedding Model: ${DEFAULT_EMBEDDING_MODEL}`);
});