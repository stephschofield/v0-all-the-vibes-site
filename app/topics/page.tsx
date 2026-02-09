import { Suspense } from 'react';
import { TopicSubmissionForm } from '@/components/TopicSubmissionForm';
import { TopicWordCloud } from '@/components/TopicWordCloud';

export const metadata = {
  title: 'Weekly Call Topics',
  description: 'Submit and vote on topics for our weekly calls',
};

export default function TopicsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Weekly Call Topics</h1>
          <p className="text-sm text-gray-400">
            What would you like us to cover? Submit your ideas below.
          </p>
        </header>

        <div className="flex-1 grid gap-6 lg:grid-cols-2 items-start">
          {/* Left: Submit form */}
          <section className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Submit a Topic</h2>
            <TopicSubmissionForm compact />
          </section>

          {/* Right: Word cloud with themes/raw toggle */}
          <section>
            <Suspense fallback={<div className="text-gray-400 p-4">Loading topics...</div>}>
              <TopicWordCloud />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
