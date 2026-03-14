import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjoxekksmrnheeemjvds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3hla2tzbXJuaGVlZW1qdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODc3MzMsImV4cCI6MjA4OTA2MzczM30.nFFnwKR-wvwwVyrj3PwgdI_6LhSvBhX2GKclWIKaTao';

export const supabase = createClient(supabaseUrl, supabaseKey);
