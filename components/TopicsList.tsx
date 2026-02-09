import { getTopics, type TopicSubmission } from '@/lib/actions/topics';

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: 'bg-gray-600 text-gray-200',
    medium: 'bg-yellow-600 text-yellow-100',
    high: 'bg-red-600 text-red-100',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[priority as keyof typeof colors] || colors.medium}`}>
      {priority}
    </span>
  );
}

function TopicCard({ topic }: { topic: TopicSubmission }) {
  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">{topic.topic}</h3>
          {topic.description && (
            <p className="mt-1 text-sm text-gray-400">{topic.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            <span>by {topic.name}</span>
            <span>•</span>
            <span>{new Date(topic.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <PriorityBadge priority={topic.priority} />
      </div>
    </div>
  );
}

export async function TopicsList() {
  const topics = await getTopics();

  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No topics submitted yet. Be the first to suggest one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </div>
  );
}
