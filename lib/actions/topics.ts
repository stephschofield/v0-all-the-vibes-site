'use server';

import { supabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type TopicSubmission = {
  id: number;
  name: string | null;
  email: string | null;
  topic: string;
  description: string | null;
  priority: string;
  created_at: string;
};

export type SubmitResult = {
  success?: boolean;
  error?: string;
  topicId?: number;
};

export async function submitTopic(formData: FormData): Promise<SubmitResult> {
  const name = formData.get('name') as string | null;
  const email = formData.get('email') as string | null;
  const topic = formData.get('topic') as string;
  const description = formData.get('description') as string | null;
  const priority = formData.get('priority') as string || 'medium';

  if (!topic) {
    return { error: 'Topic is required' };
  }

  try {
    const { data, error } = await supabase
      .from('topic_requests')
      .insert({
        name: name || 'Anonymous',
        email: email || null,
        topic,
        description: description || null,
        priority,
      })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/topics');
    return { success: true, topicId: data?.id };
  } catch (error) {
    console.error('Failed to submit topic:', error);
    return { error: 'Failed to submit topic. Please try again.' };
  }
}

export async function getTopics(): Promise<TopicSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('topic_requests')
      .select('id, name, email, topic, description, priority, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return [];
  }
}

export async function getTopicWords(): Promise<{ word: string; count: number }[]> {
  try {
    const { data, error } = await supabase
      .from('topic_requests')
      .select('topic');

    if (error) throw error;
    if (!data) return [];

    // Extract and count words from topics
    const wordCounts = new Map<string, number>();
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'that', 'this', 'as', 'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'what', 'how', 'when', 'where', 'why', 'which', 'who']);

    data.forEach((t: { topic: string }) => {
      const words = t.topic.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
    });

    return Array.from(wordCounts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 words
  } catch (error) {
    console.error('Failed to get topic words:', error);
    return [];
  }
}
