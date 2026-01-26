'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTopicWords } from '@/lib/actions/topics';

interface WordData {
  word: string;
  count: number;
}

const COLORS = [
  'var(--accent-cyan)',
  'var(--accent-pink)',
  'var(--accent-yellow)',
  'var(--accent-blue)',
  '#4ADE80', // green
  '#A78BFA', // purple
  '#F472B6', // pink
  '#FBBF24', // amber
];

export function TopicWordCloud() {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWords = useCallback(async () => {
    try {
      const data = await getTopicWords();
      setWords(data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Refresh every 10 seconds to catch new submissions
  useEffect(() => {
    const interval = setInterval(loadWords, 10000);
    return () => clearInterval(interval);
  }, [loadWords]);

  if (loading) {
    return (
      <div 
        className="h-full flex items-center justify-center p-6 rounded-lg"
        style={{ 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--ide-border)' 
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Loading topics...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center p-6 rounded-lg text-center"
        style={{ 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--ide-border)' 
        }}
      >
        <p 
          className="text-lg font-medium mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          No topics yet
        </p>
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Be the first to submit a topic!
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...words.map(w => w.count));

  return (
    <div 
      className="p-6 rounded-lg"
      style={{ 
        background: 'rgba(0,0,0,0.2)', 
        border: '1px solid var(--ide-border)' 
      }}
    >
      <h3 
        className="text-lg font-semibold mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        What the community wants to learn
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {words.map((item, index) => {
          // Scale font size based on count (14px to 32px)
          const scale = item.count / maxCount;
          const fontSize = 14 + (scale * 18);
          const color = COLORS[index % COLORS.length];
          const opacity = 0.6 + (scale * 0.4);
          
          return (
            <span
              key={item.word}
              className="inline-block px-2 py-1 rounded transition-transform hover:scale-110 cursor-default"
              style={{
                fontSize: `${fontSize}px`,
                color,
                opacity,
                fontFamily: 'var(--font-display)',
                fontWeight: scale > 0.5 ? 600 : 400,
              }}
              title={`${item.count} submission${item.count > 1 ? 's' : ''}`}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
