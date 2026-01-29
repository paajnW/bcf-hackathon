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
export const uploadMaterial = async (materialData) => {
    const { data, error } = await supabase
        .from('materials')
        .insert([{
            course_id: materialData.course_id,
            title: materialData.title,
            type: materialData.type,           // 'Theory' or 'Lab'
            topic: materialData.topic,
            week_number: materialData.week,
            tags: materialData.tags,           // Expects an array: ["C++", "DSA"]
            content_text: materialData.content_text
        }])
        .select();
    return { data, error };
};

/**
 * Part 2: Intelligent Search
 * Searches through titles, topics, and the content itself
 */
export const searchMaterials = async (query) => {
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .or(`title.ilike.%${query}%,topic.ilike.%${query}%,content_text.ilike.%${query}%`);
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