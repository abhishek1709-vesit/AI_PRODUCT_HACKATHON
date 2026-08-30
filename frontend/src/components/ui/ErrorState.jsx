import React from 'react';
import Button from './Button.jsx';

/**
 * ErrorState — error-type-aware display
 * @param {number|null} statusCode - HTTP status code
 * @param {string} message - override message
 * @param {function} onRetry - optional retry callback
 */
export default function ErrorState({ statusCode, message, onRetry }) {
  const getContent = () => {
    if (statusCode === 429) return {
      title: 'AI Rate Limit Reached',
      description: 'Please wait a moment before running the analysis again.',
      icon: '⏱',
    };
    if (statusCode === 500) return {
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred on the server. Please try again.',
      icon: '⚡',
    };
    if (!statusCode && message?.toLowerCase().includes('network')) return {
      title: 'Unable to Connect',
      description: 'Check that the API server is running and try again.',
      icon: '🔌',
    };
    return {
      title: 'Error',
      description: message || 'An unexpected error occurred.',
      icon: '⚠',
    };
  };

  const { title, description, icon } = getContent();

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
        {message || description}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
