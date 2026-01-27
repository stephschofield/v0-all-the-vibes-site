'use client';

import { useEffect, useState, useCallback } from 'react';

interface Theme {
  name: string;
  description: string;
  related_topics: number[];
}

interface ThemesResponse {
  themes: Theme[];
  topicCount: number;
  error?: string;
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
  const [themes, setThemes] = useState<Theme[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThemes = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/themes');
      const data: ThemesResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      }
      
      setThemes(data.themes || []);
      setTopicCount(data.topicCount || 0);
    } catch (err) {
      console.error('Failed to load themes:', err);
      setError('Failed to connect to theme service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  // Refresh every 30 seconds to catch new submissions (themes are more expensive)
  useEffect(() => {
    const interval = setInterval(loadThemes, 30000);
    return () => clearInterval(interval);
  }, [loadThemes]);

  if (loading) {
    return (
      <div 
        className="h-full flex items-center justify-center p-6 rounded-lg"
        style={{ 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--ide-border)' 
        }}
      >
        <div className="text-center">
          <div className="animate-pulse mb-2">
            <span style={{ color: 'var(--accent-cyan)' }}>●</span>
            <span style={{ color: 'var(--accent-pink)' }} className="mx-1">●</span>
            <span style={{ color: 'var(--accent-yellow)' }}>●</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Analyzing topics with AI...</p>
        </div>
      </div>
    );
  }

  if (themes.length === 0 && topicCount === 0) {
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

  // If we have topics but theme extraction failed, show a message
  if (themes.length === 0 && topicCount > 0) {
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
        <p style={{ color: 'var(--text-muted)' }}>
          {topicCount} topic{topicCount !== 1 ? 's' : ''} submitted
          {error && <span className="block text-sm mt-1" style={{ color: 'var(--accent-pink)' }}>
            (Theme analysis unavailable)
          </span>}
        </p>
      </div>
    );
  }

  return (
    <div 
      className="p-6 rounded-lg"
      style={{ 
        background: 'rgba(0,0,0,0.2)', 
        border: '1px solid var(--ide-border)' 
      }}
    >
      <h3 
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        What the community wants to learn
      </h3>
      <p 
        className="text-sm mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        AI-extracted themes from {topicCount} submission{topicCount !== 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-3">
        {themes.map((theme, index) => {
          const color = COLORS[index % COLORS.length];
          const relatedCount = theme.related_topics?.length || 1;
          // Scale based on how many topics are in this theme
          const scale = Math.min(relatedCount / Math.max(topicCount, 1), 1);
          const fontSize = 14 + (scale * 10);
          
          return (
            <div
              key={theme.name}
              className="group relative px-3 py-2 rounded-lg transition-all hover:scale-105 cursor-default"
              style={{
                background: `${color}20`,
                border: `1px solid ${color}40`,
              }}
            >
              <span
                style={{
                  fontSize: `${fontSize}px`,
                  color,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                }}
              >
                {theme.name}
              </span>
              
              {/* Tooltip with description */}
              <div 
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64"
                style={{
                  background: 'var(--ide-sidebar)',
                  border: '1px solid var(--ide-border)',
                }}
              >
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {theme.description}
                </p>
                {theme.related_topics && theme.related_topics.length > 0 && (
                  <p 
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {theme.related_topics.length} related topic{theme.related_topics.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
