import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// This ensures the .env file is found even though you are in a subfolder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Part 1: CMS Functions ---
// Function to save materials (Theory or Lab) [cite: 10, 16]
export const uploadMaterial = async (materialData) => {
    const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select();
    return { data, error };
};

// Function for Intelligent Search (RAG-ready) [cite: 19, 20]
export const searchMaterials = async (query) => {
    const { data, error } = await supabase
        .from('materials')
        .select('title, type, content_text, topic, week_number')
        .ilike('content_text', `%${query}%`); // Semantic-style keyword search [cite: 21]
    return { data, error };
};

export const getAllMaterials = async () => {
    return await supabase.from('materials').select('*');
};