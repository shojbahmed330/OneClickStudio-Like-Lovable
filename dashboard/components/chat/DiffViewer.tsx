
import React from 'react';
import { diff_match_patch } from 'diff-match-patch';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(oldText || '', newText || '');
  dmp.diff_cleanupSemantic(diffs);

  return (
    <div className="font-mono text-[11px] leading-relaxed overflow-x-auto custom-scrollbar max-h-[400px] whitespace-pre-wrap">
      {diffs.map(([type, text], i) => {
        if (type === 0) { // Unchanged
          return <span key={i} className="text-zinc-500">{text}</span>;
        }
        if (type === 1) { // Added
          return (
            <span key={i} className="bg-emerald-500/20 text-emerald-400 px-0.5 rounded">
              {text}
            </span>
          );
        }
        if (type === -1) { // Removed
          return (
            <span key={i} className="bg-red-500/20 text-red-400 px-0.5 rounded line-through decoration-red-500/50">
              {text}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

export default DiffViewer;
