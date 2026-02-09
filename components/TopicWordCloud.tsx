'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTopics, type TopicSubmission } from '@/lib/actions/topics';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--accent-pink)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-cyan)',
};

export function TopicWordCloud() {
  const [topics, setTopics] = useState<TopicSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getTopics();
      setTopics(data);
    } catch (err) {
      console.error('Failed to load topics:', err);
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
        className="h-full flex items-center justify-center p-4 rounded-lg"
        style={{ 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--ide-border)',
          maxHeight: '280px',
        }}
      >
        <div className="text-center">
          <div className="animate-pulse mb-1">
            <span style={{ color: 'var(--accent-cyan)' }}>●</span>
            <span style={{ color: 'var(--accent-pink)' }} className="mx-1">●</span>
            <span style={{ color: 'var(--accent-yellow)' }}>●</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center p-4 rounded-lg text-center"
        style={{ 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--ide-border)',
          maxHeight: '280px',
        }}
      >
        <p 
          className="text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          No topics yet
        </p>
        <p 
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Be the first to submit a topic!
        </p>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-lg flex flex-col"
      style={{ 
        background: 'rgba(0,0,0,0.2)', 
        border: '1px solid var(--ide-border)',
        height: '100%',
        maxHeight: '280px',
      }}
    >
      {/* Header */}
      <div className="mb-3 text-center flex-shrink-0">
        <h3 
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          What the community wants to learn
        </h3>
        <p 
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {topics.length} submission{topics.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Topics list - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TopicsListView topics={topics} />
      </div>
    </div>
  );
}

function TopicsListView({ topics }: { topics: TopicSubmission[] }) {
  return (
    <div className="space-y-2 pr-1">
      {topics.map((topic) => {
        const priorityColor = PRIORITY_COLORS[topic.priority] || PRIORITY_COLORS.medium;
        const date = new Date(topic.created_at);
        const timeAgo = getTimeAgo(date);
        
        return (
          <div
            key={topic.id}
            className="p-2 rounded-md"
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderLeft: `2px solid ${priorityColor}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {topic.topic}
              </p>
              <span 
                className="text-xs px-1.5 py-0.5 rounded shrink-0"
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
                className="text-xs mt-1 line-clamp-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {topic.description}
              </p>
            )}
            
            <div 
              className="flex items-center gap-1 mt-1 text-xs"
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
