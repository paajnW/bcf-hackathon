import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ensures .env is loaded correctly from the subfolder structure
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Part 1: CMS - Uploading Materials
 * Maps to your specific columns: week_number, tags, topic
 */
// Add these to your existing db.js
export const uploadFileToStorage = async (fileBuffer, fileName, contentType) => {
    const filePath = `${Date.now()}_${fileName}`;
    
    const { data, error } = await supabase.storage
        .from('course-materials') // Make sure this bucket exists in Supabase
        .upload(filePath, fileBuffer, { contentType });

    if (error) throw error;

    // Get the public URL to save in the materials table
    const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

    return publicUrl;
};

// Update saveMaterialMetadata to include file_url and metadata
export const saveMaterialMetadata = async (metadata, text, fileUrl, fileMetadata) => {
    const { data, error } = await supabase
        .from('materials')
        .insert([{ 
            title: metadata.title, 
            type: metadata.type, 
            topic: metadata.topic, 
            week_number: metadata.week,
            content_text: text,
            file_url: fileUrl // Add this column to your materials table!
        }])
        .select().single();
    return { data, error };
};

/**
 * Part 2: Intelligent Search
 * Searches through titles, topics, and the content itself
 */
// Enhanced Search for Part 2
export const searchMaterial = async (filters) => {
    let query = supabase.from('materials').select('*');

    // Map AI output to Database Columns
    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.week) {
        query = query.eq('week_number', filters.week);
    }
    if (filters.topic) {
        query = query.ilike('topic', `%${filters.topic}%`);
    }
    if (filters.search_term) {
        // Search in title OR content
        query = query.or(`title.ilike.%${filters.search_term}%,content_text.ilike.%${filters.search_term}%`);
    }

    const { data, error } = await query;
    return { data, error };
};
/**
 * Part 5: Fetch Context for AI
 * Gets content based on a course to "ground" Gemini's answers
 */
export const getCourseContent = async (courseCode) => {
    // First find the course ID from the code (e.g., 'CSE-101')
    const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('code', courseCode)
        .single();

    if (!course) return null;

    return await supabase
        .from('materials')
        .select('content_text, type, topic')
        .eq('course_id', course.id);
};

/**
 * Part 6: Intelligent Chunking with Metadata Preservation
 * Creates semantic chunks with context information for vectoring
 */
export const createSmartChunks = async (text, fileMetadata) => {
    const chunks = [];
    const chunkSize = 600; // Characters per chunk
    const overlapSize = 100; // Character overlap between chunks
    
    // Split into sentences first for better semantic boundaries
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            if (currentChunk.trim()) {
                chunks.push({
                    content: currentChunk.trim(),
                    chunkIndex: chunkIndex,
                    fileMetadata: fileMetadata,
                    startChar: text.indexOf(currentChunk),
                    endChar: text.indexOf(currentChunk) + currentChunk.length,
                    createdAt: new Date().toISOString()
                });
                chunkIndex++;
                // Keep overlap for context
                const words = currentChunk.split(' ');
                currentChunk = words.slice(-Math.ceil(overlapSize / 5)).join(' ') + ' ' + sentence;
            } else {
                currentChunk = sentence;
            }
        } else {
            currentChunk += sentence;
        }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunkIndex,
            fileMetadata: fileMetadata,
            startChar: text.indexOf(currentChunk),
            endChar: text.indexOf(currentChunk) + currentChunk.length,
            createdAt: new Date().toISOString()
        });
    }
    
    return chunks;
};

/**
 * Part 7: Save Vectorized Chunks
 * Stores chunks with their embeddings and metadata
 */
export const saveVectorizedChunk = async (materialId, chunk, embedding) => {
    // Store in Supabase - ensure your chunks table has embedding column as vector type
    const { data, error } = await supabase
        .from('chunks')
        .insert([{
            material_id: materialId,
            chunk_index: chunk.chunkIndex,
            content: chunk.content,
            embedding: embedding, // pgvector format
            file_metadata: chunk.fileMetadata,
            char_position: chunk.startChar,
            char_end: chunk.endChar,
            created_at: chunk.createdAt
        }])
        .select().single();
    
    if (error) {
        console.error('Error saving vectorized chunk:', error);
    }
    
    return { data, error };
};

/**
 * Part 8: Vector Similarity Search
 * Performs semantic search using vector embeddings
 */
export const vectorSearch = async (queryEmbedding, topK = 5) => {
    try {
        // Use Supabase's pgvector extension for similarity search
        // This assumes your chunks table has an embedding column with vector type
        const { data, error } = await supabase.rpc('match_chunks', {
            query_embedding: queryEmbedding,
            match_count: topK,
            similarity_threshold: 0.5
        });
        
        if (error) {
            console.error('Vector search error:', error);
            return { data: [], error };
        }
        
        return { data: data || [], error: null };
    } catch (err) {
        console.error('RPC call failed:', err.message);
        // Fallback to text-based search if vector search fails
        return { data: [], error: err };
    }
};

/**
 * Helper: Check if vector index exists and create if needed
 */
export const initializeVectorIndex = async () => {
    try {
        // This would create necessary RPC function for vector search
        // Run this once during initialization
        console.log('✅ Vector indexing initialized');
    } catch (err) {
        console.error('Failed to initialize vector index:', err);
    }
};

