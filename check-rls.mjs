import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjUwOTYsImV4cCI6MjA5NzY0MTA5Nn0.ySKgvmByHtRiTucxz8tzeXrIQQ_KIIU4oc5aMF-gzF8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('=== Teste isolado das tabelas ===\n');

// Test 1: professionals com select mínimo
console.log('1. professionals (select id, name):');
const r1 = await supabase.from('professionals').select('id, name').limit(1);
console.log(r1.error ? `   ❌ ${r1.error.message}` : `   ✅ OK`);

// Test 2: professionals com select *
console.log('\n2. professionals (select *):');
const r2 = await supabase.from('professionals').select('*').limit(1);
console.log(r2.error ? `   ❌ ${r2.error.message}` : `   ✅ OK`);

// Test 3: profiles
console.log('\n3. profiles:');
const r3 = await supabase.from('profiles').select('*').limit(1);
console.log(r3.error ? `   ❌ ${r3.error.message}` : `   ✅ OK`);

// Test 4: system_users
console.log('\n4. system_users:');
const r4 = await supabase.from('system_users').select('*').limit(1);
console.log(r4.error ? `   ❌ ${r4.error.message}` : `   ✅ OK`);

// Test 5: clinical_rooms (usa location_id FK)
console.log('\n5. clinical_rooms (com join em locations):');
const r5 = await supabase.from('clinical_rooms').select('*, locations(*)').limit(1);
console.log(r5.error ? `   ❌ ${r5.error.message}` : `   ✅ OK`);

// Test 6: Verificar se existe alguma view ou função problemática
console.log('\n6. Testando query raw via RPC (se disponível):');
const r6 = await supabase.rpc('get_professionals_simple');
console.log(r6.error ? `   ⚠️ ${r6.error.message}` : `   ✅ OK`);
