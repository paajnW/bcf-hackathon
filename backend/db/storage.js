import { supabase } from './db.js'

export async function uploadFileToStorage(buffer, fileName, type) {
  const path = `${type.toLowerCase()}/${Date.now()}-${fileName}`

  const { error } = await supabase.storage
    .from('course-materials')
    .upload(path, buffer, {
      contentType: 'application/pdf'
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('course-materials')
    .getPublicUrl(path)

  return data.publicUrl
}
