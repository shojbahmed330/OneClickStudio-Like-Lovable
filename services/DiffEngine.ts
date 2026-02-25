
import { diff_match_patch } from "diff-match-patch";

export class DiffEngine {
  private dmp: any;

  constructor() {
    this.dmp = new diff_match_patch();
    this.dmp.Match_Threshold = 0.5;
    this.dmp.Match_Distance = 1000;
  }

  public hashContent(content: string): string {
    let hash = 0;
    for (let i = 0, len = content.length; i < len; i++) {
      const chr = content.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  public detectFileChanges(files: Record<string, string>, fileHashes: Map<string, string>): boolean {
    if (fileHashes.size === 0) return false;

    for (const [path, content] of Object.entries(files)) {
      const newHash = this.hashContent(content);
      const oldHash = fileHashes.get(path);

      if (!oldHash || newHash !== oldHash) {
        return true;
      }
    }

    for (const oldPath of fileHashes.keys()) {
      if (!files[oldPath]) return true;
    }

    return false;
  }

  public updateSnapshot(files: Record<string, string>, fileHashes: Map<string, string>) {
    fileHashes.clear();
    for (const [path, content] of Object.entries(files)) {
      fileHashes.set(path, this.hashContent(content));
    }
  }

  public enforcePatchRules(generatedFiles: Record<string, string>, currentFiles: Record<string, string>, exemptedFiles: Set<string>): string[] {
    const violations: string[] = [];

    for (const [path, content] of Object.entries(generatedFiles)) {
      const exists = currentFiles[path];

      if (exists && path !== 'package.json' && path !== 'metadata.json' && path !== 'index.html' && !exemptedFiles.has(path)) {
        const trimmed = content.trim();
        const isPatch = trimmed.startsWith("--- ") && trimmed.includes("@@ ");

        if (!isPatch) {
          violations.push(path);
        }
      }
    }

    return violations;
  }

  public applyChanges(base: Record<string, string>, changes: Record<string, string>, exemptedFiles: Set<string> = new Set()): { merged: Record<string, string>, errors: string[] } {
    const result = { ...base };
    const errors: string[] = [];

    for (const [path, newContent] of Object.entries(changes)) {
      if (path === 'database.sql' && base[path]) {
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const migrationPath = `migrations/${timestamp}_auto_migration.sql`;
        result[migrationPath] = newContent;
        continue;
      }

      if (base[path]) {
        try {
          const trimmed = newContent.trim();
          const isUnifiedDiff = trimmed.startsWith('--- ') && trimmed.includes('@@ ');

          if (isUnifiedDiff) {
            try {
              const patchStartIndex = trimmed.indexOf('@@ ');
              if (patchStartIndex === -1) throw new Error("No @@ block found");
              
              let rawPatchContent = trimmed.substring(patchStartIndex).replace(/\r\n/g, '\n');
              rawPatchContent = rawPatchContent.trimEnd().replace(/```[a-z]*$/i, '').trimEnd();
              
              const formattedPatchLines = rawPatchContent.split('\n').map(line => {
                if (line.startsWith('@@ ')) return line;
                if (line.startsWith('\\')) return line;
                
                let sign = '';
                let text = '';
                
                if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
                  sign = line[0];
                  text = line.substring(1);
                } else if (line === '') {
                  sign = ' ';
                  text = '';
                } else {
                  sign = ' ';
                  text = line;
                }
                
                return sign + encodeURI(text);
              });
              
              const formattedPatch = formattedPatchLines.join('\n') + '\n';
              
              const patches = this.dmp.patch_fromText(formattedPatch);
              const [patchedText, results] = this.dmp.patch_apply(patches, base[path]);
              
              const allSuccessful = results.every(Boolean);
              if (allSuccessful && !patchedText.includes("<<<<<<<")) {
                result[path] = patchedText;
              } else {
                errors.push(`Failed to apply patch for ${path}. The patch was rejected or conflicted. Please ensure your patch context EXACTLY matches the original file, including indentation. Provide at least 3 lines of unchanged context before and after your changes.`);
                result[path] = base[path];
              }
            } catch (e: any) {
              errors.push(`Failed to apply patch for ${path} due to a parsing error. Please ensure your unified diff patch is perfectly formatted.`);
              result[path] = base[path];
            }
            continue;
          }

          const isAllowedFullFile = path === 'package.json' || path === 'metadata.json' || path === 'index.html' || exemptedFiles.has(path);
          if (isAllowedFullFile) {
            result[path] = newContent;
            continue;
          }

          const sizeDiff = Math.abs(base[path].length - newContent.length);
          const isSmallChange = sizeDiff < (base[path].length * 0.4);

          if (isSmallChange) {
            const patches = this.dmp.patch_make(base[path], newContent);
            const [patchedText, results] = this.dmp.patch_apply(patches, base[path]);
            
            const allSuccessful = results.every((success: boolean) => success === true);
            
            if (allSuccessful && !patchedText.includes("<<<<<<<") && !patchedText.includes("=======")) {
              result[path] = patchedText;
            } else {
              errors.push(`Failed to apply smart patch for ${path}. The patch was rejected or conflicted.`);
              result[path] = base[path];
            }
          } else {
            errors.push(`File ${path} was returned as a full file instead of a patch. This is not allowed for existing files.`);
            result[path] = base[path];
          }
        } catch (e: any) {
          errors.push(`Failed to apply patch for ${path} due to a parsing error. Please ensure your unified diff patch is perfectly formatted.`);
          result[path] = base[path];
        }
      } else {
        result[path] = newContent;
      }
    }

    return { merged: result, errors };
  }
}
