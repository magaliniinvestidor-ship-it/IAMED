import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjUwOTYsImV4cCI6MjA5NzY0MTA5Nn0.ySKgvmByHtRiTucxz8tzeXrIQQ_KIIU4oc5aMF-gzF8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  'patients', 'appointments', 'beds', 'audit_logs', 'financial_postings',
  'stock_items', 'aso_exams', 'dtes', 'professionals', 'pharmacy_items',
  'stock_movements', 'inventory_counts', 'adverse_events', 'quality_deviations',
  'batch_recalls', 'locations', 'clinical_rooms'
];

console.log('Verificando tabelas...\n');

for (const table of tables) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    console.log(`❌ ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}: OK (${data?.length || 0} registros)`);
  }
}
