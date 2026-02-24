
/**
 * Smart Diff Utility
 * Applies SEARCH/REPLACE blocks to string content.
 * This is highly token-efficient and accurate for LLMs.
 */

export interface DiffBlock {
  search: string;
  replace: string;
}

export const applyDiffs = (content: string, diffs: DiffBlock[]): string => {
  let updatedContent = content;

  for (const diff of diffs) {
    const { search, replace } = diff;
    
    // Normalize line endings and whitespace for more robust matching
    const normalizedSearch = search.trim();
    
    if (!normalizedSearch) continue;

    // We try to find the exact block. 
    // If it's not found exactly, we try a slightly more relaxed match (ignoring leading/trailing whitespace of lines)
    if (updatedContent.includes(search)) {
      updatedContent = updatedContent.replace(search, replace);
    } else {
      // Fallback: Try line-by-line matching for the block
      const searchLines = search.split('\n').map(l => l.trim());
      const contentLines = updatedContent.split('\n');
      
      let foundIndex = -1;
      for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
        let match = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (contentLines[i + j].trim() !== searchLines[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        const linesBefore = contentLines.slice(0, foundIndex);
        const linesAfter = contentLines.slice(foundIndex + searchLines.length);
        updatedContent = [...linesBefore, replace, ...linesAfter].join('\n');
      } else {
        console.warn("Smart Diff: Search block not found in file content.", { search });
      }
    }
  }

  return updatedContent;
};
