import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import pdf from 'pdf-parse'
import { GoogleGenerativeAI } from '@google/generative-ai'

import {
  supabase,
  uploadFileToStorage,
  searchMaterial,
  getCourseContent,
  saveMaterialMetadata,
  saveChunk
} from './db/db.js'

const app = express()
const upload = multer()
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

/* ======================
   GEMINI INITIALIZATION
====================== */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

/* ======================
   HEALTH CHECK
====================== */
app.get('/health', async (req, res) => {
  const { error } = await supabase
    .from('chat_history')
    .select('id')
    .limit(1)

  if (error) {
    return res.status(500).json({ status: 'DB Error', error: error.message })
  }

  res.json({ status: 'System Live', database: 'Supabase Connected' })
})

/* ======================
   AI CHECK (CHAT)
====================== */
app.post('/ai-check', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  try {
    const result = await chatModel.generateContent(text)
    const reply = result.response.text()

    res.json({ success: true, reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini Error', details: err.message })
  }
})

/* ======================
   ADMIN PDF UPLOAD
====================== */
app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files allowed' })
    }

    // 1. Upload to Supabase Storage
    const fileUrl = await uploadFileToStorage(
      file.buffer,
      file.originalname,
      file.mimetype
    )

    // 2. Extract PDF text
    const pdfData = await pdf(file.buffer)
    const text = pdfData.text

    // 3. Save material metadata
    const { data: material, error } =
      await saveMaterialMetadata(req.body, text, fileUrl)

    if (error) throw error

    // 4. Chunk + Embed
    const chunks = text.match(/(.|\n){1,500}/g) || []

    for (const chunk of chunks) {
      const embeddingRes = await embedModel.embedContent(chunk)
      await saveChunk(material.id, chunk, embeddingRes.embedding.values)
    }

    res.json({
      message: 'File stored and knowledge base updated',
      id: material.id,
      url: fileUrl
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/* ======================
   SEARCH (AI + DB)
====================== */
app.post('/api/search', async (req, res) => {
  const { userText } = req.body
  if (!userText) return res.status(400).json({ error: 'No search text provided' })

  try {
    const systemPrompt = `
Convert the user's request into 1 or 2 core search keywords.
Return ONLY the keywords.
Example:
Input: "I want to learn Postgres with Node"
Output: Postgres Node
`

    const result = await chatModel.generateContent([
      systemPrompt,
      userText
    ])

    const refinedQuery = result.response.text().trim()

    const { data, error } = await searchMaterial(refinedQuery)
    if (error) throw error

    res.json({
      refinedQuery,
      results: data
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Search failed', details: err.message })
  }
})

/* ======================
   GET ALL MATERIALS
====================== */
app.get('/api/materials', async (req, res) => {
  const { data, error } = await getCourseContent()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

/* ======================
   SERVER START
====================== */
app.listen(PORT, () => {
  console.log(`✅ Gemini AI Server running on http://localhost:${PORT}`)
})
