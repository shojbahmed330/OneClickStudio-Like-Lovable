
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorSummaryPanelProps {
  errors: string[];
}

const ErrorSummaryPanel: React.FC<ErrorSummaryPanelProps> = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="my-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-3 md:p-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-2 mb-2 md:mb-3 text-red-400">
        <AlertCircle size={14} />
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">AI identified issues</span>
      </div>
      <div className="space-y-1.5 md:space-y-2">
        {errors.map((err, i) => {
          let displayErr = err;
          if (err.includes('TS Syntax Error')) {
            const match = err.match(/TS Syntax Error in ([^:]+): (.*)/);
            if (match) displayErr = `Syntax error in ${match[1]}: ${match[2]}`;
          } else if (err.includes('Missing import target')) {
            const match = err.match(/Missing import target: "([^"]+)" in file "([^"]+)"/);
            if (match) displayErr = `Missing import "${match[1]}" in ${match[2]}`;
          }

          return (
            <div key={i} className="flex items-start gap-2 text-[10px] md:text-[11px] text-red-400/80 font-medium leading-tight">
              <span className="mt-1 w-1 h-1 rounded-full bg-red-500/40 shrink-0" />
              <span>{displayErr}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-red-500/10 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
        <span className="text-[8px] md:text-[9px] font-bold text-pink-500/80 uppercase tracking-tighter italic">AI is automatically repairing these issues...</span>
      </div>
    </div>
  );
};

export default ErrorSummaryPanel;
