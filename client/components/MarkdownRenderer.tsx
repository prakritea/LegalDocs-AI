import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Simple markdown-to-JSX parser for structured legal summaries
    const parseMarkdown = (text: string): JSX.Element[] => {
      // First normalize the text: replace LLM's long dash sequences with a standard markdown hrule
      const normalizedText = text.replace(/[-]{3,}/g, '---');
      const lines = normalizedText.split('\n');
      
      const elements: JSX.Element[] = [];
      let currentList: string[] = [];
      let key = 0;
  
      const flushList = () => {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${key++}`} className="list-disc ml-6 space-y-2 mb-4">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {renderInlineStyles(item, `li-${key}-${idx}`)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
      };
      
      const renderInlineStyles = (part: string, baseKey: string) => {
          if (!part.includes('**')) return part;
          
          const pieces = part.split('**');
          return pieces.map((piece, idx) => 
            idx % 2 === 1 ? <strong key={`${baseKey}-${idx}`} className="font-semibold text-gray-900 dark:text-gray-100">{piece}</strong> : piece
          );
      };
  
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (!trimmed) {
          flushList();
          continue;
        }
  
        // Horizontal Rules / Separators
        if (trimmed === '---') {
          flushList();
          elements.push(
            <hr key={`hr-${key++}`} className="my-8 border-t border-gray-200 dark:border-gray-700" />
          );
          continue;
        }
  
        // Headers
        if (trimmed.startsWith('# ')) {
          flushList();
          const headerText = trimmed.substring(2);
          elements.push(
            <h1 key={`h1-${key++}`} className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8 flex items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              {headerText}
            </h1>
          );
        } else if (trimmed.startsWith('## ')) {
          flushList();
          const headerText = trimmed.substring(3);
          elements.push(
            <h2 key={`h2-${key++}`} className="text-xl font-bold text-brand-700 dark:text-brand-400 mb-4 mt-8 tracking-tight">
              {headerText}
            </h2>
          );
        } else if (trimmed.startsWith('### ')) {
          flushList();
          const headerText = trimmed.substring(4);
          elements.push(
            <h3 key={`h3-${key++}`} className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">
              {headerText}
            </h3>
          );
        }
        // ALL CAPS SECTION HEADERS (Common in prompt templates)
        else if (/^[A-Z\s&]+$/.test(trimmed) && trimmed.length > 3 && !trimmed.startsWith('-')) {
          flushList();
          elements.push(
            <h2 key={`h2-caps-${key++}`} className="text-sm font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-4 mt-10 border-b border-gray-200 dark:border-gray-700 pb-2">
              {trimmed}
            </h2>
          );
        }
        // List items
        else if (trimmed.startsWith('- ')) {
          const listItem = trimmed.substring(2);
          currentList.push(listItem);
        }
        // Key-Value pairs (e.g., "Risk Level: High")
        else if (/^[^:]+:\s/.test(trimmed) && !trimmed.startsWith('http')) {
           flushList();
           const splitIndex = trimmed.indexOf(':');
           const k = trimmed.substring(0, splitIndex);
           const v = trimmed.substring(splitIndex + 1).trim();
           
           elements.push(
            <div key={`kv-${key++}`} className="mb-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100 min-w-max">{k}:</span>
              <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{renderInlineStyles(v, `kv-v-${key}`)}</span>
            </div>
          );
        }
        // Regular paragraph (potentially with bold inline)
        else {
          flushList();
          elements.push(
            <p key={`p-${key++}`} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {renderInlineStyles(trimmed, `p-in-${key}`)}
            </p>
          );
        }
      }
  
      flushList();
      return elements;
    };

  return (
    <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};