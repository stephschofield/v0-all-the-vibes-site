import { Suspense } from 'react';
import { TopicSubmissionForm } from '@/components/TopicSubmissionForm';
import { TopicsList } from '@/components/TopicsList';

export const metadata = {
  title: 'Weekly Call Topics',
  description: 'Submit and vote on topics for our weekly calls',
};

export default function TopicsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold">Weekly Call Topics</h1>
          <p className="mt-2 text-gray-400">
            What would you like us to cover? Submit your ideas below.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="text-xl font-semibold mb-6">Submit a Topic</h2>
            <TopicSubmissionForm />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-6">Submitted Topics</h2>
            <Suspense fallback={<div className="text-gray-400">Loading topics...</div>}>
              <TopicsList />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
