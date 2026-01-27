#!/usr/bin/env node
/**
 * Clear all topic submissions from Supabase.
 * Run with: npx tsx scripts/clear-topics.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.warn('🔍 Checking current topics...');
  
  // Get current count
  const { count, error: countError } = await supabase
    .from('topic_requests')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Failed to count topics:', countError.message);
    process.exit(1);
  }
  
  console.warn(`📊 Found ${count || 0} topic submissions`);
  
  if (!count || count === 0) {
    console.warn('✅ No topics to clear');
    return;
  }
  
  // Delete all
  console.warn('🗑️  Clearing all topics...');
  const { error: deleteError } = await supabase
    .from('topic_requests')
    .delete()
    .neq('id', 0);
  
  if (deleteError) {
    console.error('❌ Failed to delete topics:', deleteError.message);
    process.exit(1);
  }
  
  console.warn(`✅ Cleared ${count} topic submissions`);
}

main().catch(console.error);
