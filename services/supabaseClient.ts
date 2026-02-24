
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ajgrlnqzwwdliaelvgoq.supabase.co'; 
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZ3JsbnF6d3dkbGlhZWx2Z29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQ5NjAsImV4cCI6MjA4NjA1MDk2MH0.Y39Ly94CXedvrheLKYZB8DYKwZjr6rJlaDOq_8crVkU';

export const MASTER_USER_ID = '329a8566-838f-4e61-a91c-2e6c6d492420';
export const PRIMARY_ADMIN = 'rajshahi.jibon@gmail.com';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
