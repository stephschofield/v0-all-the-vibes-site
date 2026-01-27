'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTopics, type TopicSubmission } from '@/lib/actions/topics';

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

type ViewMode = 'themes' | 'raw';

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

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--accent-pink)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-cyan)',
};

export function TopicWordCloud() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [rawTopics, setRawTopics] = useState<TopicSubmission[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('themes');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch both themes and raw topics in parallel
      const [themesResponse, topics] = await Promise.all([
        fetch('/api/themes').then(r => r.json()) as Promise<ThemesResponse>,
        getTopics(),
      ]);
      
      if (themesResponse.error) {
        setError(themesResponse.error);
      }
      
      setThemes(themesResponse.themes || []);
      setTopicCount(themesResponse.topicCount || 0);
      setRawTopics(topics);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to connect to theme service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

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

  if (themes.length === 0 && topicCount === 0 && rawTopics.length === 0) {
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

  return (
    <div 
      className="p-6 rounded-lg"
      style={{ 
        background: 'rgba(0,0,0,0.2)', 
        border: '1px solid var(--ide-border)' 
      }}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            What the community wants to learn
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {topicCount} submission{topicCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Toggle buttons */}
        <div 
          className="flex rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--ide-border)' }}
        >
          <button
            onClick={() => setViewMode('themes')}
            className="px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: viewMode === 'themes' ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === 'themes' ? 'white' : 'var(--text-muted)',
            }}
          >
            🎯 Themes
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className="px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: viewMode === 'raw' ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === 'raw' ? 'white' : 'var(--text-muted)',
              borderLeft: '1px solid var(--ide-border)',
            }}
          >
            📝 Raw
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'themes' ? (
        <ThemesView themes={themes} topicCount={topicCount} error={error} />
      ) : (
        <RawTopicsView topics={rawTopics} />
      )}
    </div>
  );
}

function ThemesView({ themes, topicCount, error }: { themes: Theme[]; topicCount: number; error: string | null }) {
  if (themes.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)' }}>
        {topicCount > 0 ? (
          <>
            Analyzing themes...
            {error && <span className="block text-sm mt-1" style={{ color: 'var(--accent-pink)' }}>
              (Theme analysis unavailable: {error})
            </span>}
          </>
        ) : (
          'No themes extracted yet'
        )}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {themes.map((theme, index) => {
        const color = COLORS[index % COLORS.length];
        const relatedCount = theme.related_topics?.length || 1;
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
            
            {/* Tooltip */}
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64"
              style={{
                background: 'var(--ide-sidebar)',
                border: '1px solid var(--ide-border)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {theme.description}
              </p>
              {theme.related_topics && theme.related_topics.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {theme.related_topics.length} related topic{theme.related_topics.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RawTopicsView({ topics }: { topics: TopicSubmission[] }) {
  if (topics.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {topics.map((topic) => {
        const priorityColor = PRIORITY_COLORS[topic.priority] || PRIORITY_COLORS.medium;
        const date = new Date(topic.created_at);
        const timeAgo = getTimeAgo(date);
        
        return (
          <div
            key={topic.id}
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderLeft: `3px solid ${priorityColor}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p 
                className="font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {topic.topic}
              </p>
              <span 
                className="text-xs px-2 py-0.5 rounded shrink-0"
                style={{ 
                  background: `${priorityColor}30`,
                  color: priorityColor,
                }}
              >
                {topic.priority}
              </span>
            </div>
            
            {topic.description && (
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {topic.description}
              </p>
            )}
            
            <div 
              className="flex items-center gap-2 mt-2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>{topic.name || 'Anonymous'}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
