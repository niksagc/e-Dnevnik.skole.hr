import { supabase } from './lib/supabase';

async function checkSchema() {
  const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
  console.log('Users schema:', users ? Object.keys(users[0]) : 'No data', usersError);

  const { data: students, error: studentsError } = await supabase.from('students').select('*').limit(1);
  console.log('Students schema:', students ? Object.keys(students[0]) : 'No data', studentsError);

  const { data: classes, error: classesError } = await supabase.from('classes').select('*').limit(1);
  console.log('Classes schema:', classes ? Object.keys(classes[0]) : 'No data', classesError);
}

checkSchema();
