
import 'dotenv/config';
import supabase from '../src/supabase.js';

const checkColumns = async () => {
  const { data, error } = await supabase
    .from('activities')
    .select('is_recurring, recurrence_days, start_time, end_time')
    .limit(1);

  if (error) {
    console.error('Error checking columns:', error.message);
    if (error.message.includes('does not exist')) {
        console.log('Columns do not exist. Migration needed.');
    }
  } else {
    console.log('Columns exist!');
  }
};

checkColumns();
