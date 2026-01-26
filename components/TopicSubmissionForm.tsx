'use client';

import { useActionState } from 'react';
import { submitTopic, type SubmitResult } from '@/lib/actions/topics';

const initialState: SubmitResult & { error: string } = { 
  error: '', 
  success: false,
};

function submitAction(
  prevState: typeof initialState, 
  formData: FormData
): Promise<typeof initialState> {
  return submitTopic(formData).then((result) => ({
    error: result.error || '',
    success: result.success || false,
    topicId: result.topicId,
  }));
}

interface TopicSubmissionFormProps {
  anonymous?: boolean;
  embedded?: boolean;
}

export function TopicSubmissionForm({ anonymous = false, embedded = false }: TopicSubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(submitAction, initialState);

  const inputClasses = embedded 
    ? "w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[var(--ide-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent text-base"
    : "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const labelClasses = embedded
    ? "block text-sm font-medium mb-2"
    : "block text-base font-medium text-gray-200 mb-2";

  const buttonClasses = embedded
    ? "w-full px-4 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 disabled:bg-[var(--accent-blue)]/50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-base"
    : "w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium text-lg rounded-lg transition-colors";

  return (
    <form action={formAction} className={embedded ? "space-y-5" : "space-y-6 max-w-lg"}>
      {!anonymous && (
        <div>
          <label htmlFor="name" className={labelClasses} style={embedded ? { color: 'var(--text-secondary)' } : undefined}>
            Your Name (optional)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={inputClasses}
            placeholder="Anonymous"
          />
        </div>
      )}

      <div>
        <label htmlFor="topic" className={labelClasses} style={embedded ? { color: 'var(--text-secondary)' } : undefined}>
          Topic *
        </label>
        <input
          type="text"
          id="topic"
          name="topic"
          required
          className={inputClasses}
          placeholder="e.g., Advanced TypeScript patterns"
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses} style={embedded ? { color: 'var(--text-secondary)' } : undefined}>
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className={`${inputClasses} resize-none`}
          placeholder="Tell us more about what you'd like to learn..."
        />
      </div>

      <div>
        <label htmlFor="priority" className={labelClasses} style={embedded ? { color: 'var(--text-secondary)' } : undefined}>
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue="medium"
          className={inputClasses}
        >
          <option value="low">Low - Nice to have</option>
          <option value="medium">Medium - Would be helpful</option>
          <option value="high">High - Really need this</option>
        </select>
      </div>

      {state.error && (
        <div className={`p-4 rounded-lg text-base ${embedded ? 'bg-red-900/30 border border-red-500/50 text-red-300' : 'bg-red-900/50 border border-red-500 text-red-200'}`}>
          {state.error}
        </div>
      )}

      {state.success && (
        <div className={`p-4 rounded-lg text-base ${embedded ? 'bg-green-900/30 border border-green-500/50 text-green-300' : 'bg-green-900/50 border border-green-500 text-green-200'}`}>
          Topic submitted! Thank you for your suggestion.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={buttonClasses}
      >
        {isPending ? 'Submitting...' : 'Submit Topic'}
      </button>
    </form>
  );
}
