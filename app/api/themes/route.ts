import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

const TOPIC_MODELING_URL = process.env.TOPIC_MODELING_URL || 'http://localhost:8000';

export type Theme = {
  name: string;
  description: string;
  related_topics: number[];
};

export async function GET() {
  try {
    // 1. Fetch topics from Supabase
    const supabase = getSupabase();
    const { data: topics, error } = await supabase
      .from('topic_requests')
      .select('topic')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({ themes: [], topicCount: 0 });
    }

    const topicTexts = topics.map((t: { topic: string }) => t.topic);

    // 2. Call DSPy service to extract themes
    const response = await fetch(`${TOPIC_MODELING_URL}/themes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics: topicTexts }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DSPy service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      themes: data.themes || [],
      topicCount: topicTexts.length,
    });
  } catch (error) {
    console.error('Failed to extract themes:', error);
    
    // Return graceful fallback - empty themes
    return NextResponse.json(
      { 
        themes: [], 
        topicCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
