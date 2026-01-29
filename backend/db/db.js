import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import ollama from 'ollama';

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

// Update saveMaterialMetadata to include file_url
export const saveMaterialMetadata = async (metadata, text, fileUrl) => {
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
import ollama from 'ollama';

