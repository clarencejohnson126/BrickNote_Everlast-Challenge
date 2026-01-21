'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <div className={`text-gray-400 italic ${className}`}>
        No content to display
      </div>
    );
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
