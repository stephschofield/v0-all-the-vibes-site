'use server';

import { getSupabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

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

const TopicSchema = z.object({
  name: z.string().max(100, 'Name must be under 100 characters').transform(val => val.trim() || 'Anonymous'),
  email: z.string().max(254, 'Email must be under 254 characters').transform(val => val.trim() || null).refine(val => val === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: 'Invalid email format' }),
  topic: z.string().min(3, 'Topic must be at least 3 characters').max(500, 'Topic must be under 500 characters'),
  description: z.string().max(2000, 'Description must be under 2000 characters').transform(val => val.trim() || null),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function submitTopic(formData: FormData): Promise<SubmitResult> {
  // Convert null to empty string for Zod validation
  const raw = {
    name: formData.get('name') ?? '',
    email: formData.get('email') ?? '',
    topic: formData.get('topic') ?? '',
    description: formData.get('description') ?? '',
    priority: formData.get('priority') || 'medium',
  };

  const parsed = TopicSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('topic_requests')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        topic: parsed.data.topic,
        description: parsed.data.description,
        priority: parsed.data.priority,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Post to Discord webhook (fire and forget - don't block on failure)
    notifyDiscord(parsed.data).catch(err => 
      console.error('Discord notification failed:', err)
    );

    revalidatePath('/topics');
    return { success: true, topicId: data?.id };
  } catch (error) {
    console.error('Failed to submit topic:', error);
    return { error: 'Failed to submit topic. Please try again.' };
  }
}

async function notifyDiscord(topic: {
  name: string;
  topic: string;
  description: string | null;
  priority: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const priorityColors: Record<string, number> = {
    high: 0xFF6B6B,   // red
    medium: 0xFFD93D, // yellow
    low: 0x6BCB77,    // green
  };

  const priorityEmoji: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: '📣 New Topic Submitted',
        description: topic.topic,
        color: priorityColors[topic.priority] || priorityColors.medium,
        fields: [
          ...(topic.description ? [{ name: 'Description', value: topic.description.slice(0, 200) + (topic.description.length > 200 ? '...' : '') }] : []),
          { name: 'Priority', value: `${priorityEmoji[topic.priority] || '🟡'} ${topic.priority}`, inline: true },
          { name: 'Submitted by', value: topic.name, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'All The Vibes Community' },
      }],
    }),
  });
}

export async function getTopics(): Promise<TopicSubmission[]> {
  try {
    const supabase = getSupabase();
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
    const supabase = getSupabase();
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

export async function clearAllTopics(): Promise<{ success: boolean; deleted: number; error?: string }> {
  // Authentication check - require admin key
  const headersList = await headers();
  const adminKey = headersList.get('x-admin-key');

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return { success: false, deleted: 0, error: 'Unauthorized' };
  }

  try {
    const supabase = getSupabase();
    
    // Get count first
    const { count } = await supabase
      .from('topic_requests')
      .select('*', { count: 'exact', head: true });
    
    // Delete all
    const { error } = await supabase
      .from('topic_requests')
      .delete()
      .neq('id', 0); // Delete all rows (neq id 0 matches everything)

    if (error) throw error;

    revalidatePath('/topics');
    return { success: true, deleted: count || 0 };
  } catch (error) {
    console.error('Failed to clear topics:', error);
    return { success: false, deleted: 0, error: String(error) };
  }
}
