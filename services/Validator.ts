
import * as ts from "typescript";
import { DependencyNode } from "../types";

export class Validator {
  private resolveCache = new Map<string, string | null>();

  public validateOutput(files: Record<string, string>, dependencyGraph: DependencyNode[]): string[] {
    const errors: string[] = [];
    errors.push(...this.validateFileSizeAndConflicts(files));
    errors.push(...this.validateImports(files));
    errors.push(...this.validateTypeScriptSyntax(files));
    errors.push(...this.detectCircularDependencies(dependencyGraph));
    return errors;
  }

  public validateFileSizeAndConflicts(files: Record<string, string>): string[] {
    const errors: string[] = [];
    for (const [path, content] of Object.entries(files)) {
      const lines = content.split('\n').length;
      if (lines > 300) {
        errors.push(`File "${path}" is too large (${lines} lines). Please split it.`);
      }
      if (content.includes('<<<<<<<') || content.includes('=======')) {
        errors.push(`File "${path}" has merge conflict markers.`);
      }
    }
    return errors;
  }

  public validateImports(files: Record<string, string>): string[] {
    const errors: string[] = [];
    this.resolveCache.clear();

    for (const [path, content] of Object.entries(files)) {
      const imports = this.extractImports(content);
      for (const imp of imports) {
        if (imp.startsWith('.')) {
          const resolved = this.resolveImportPath(path, imp, files);
          if (!resolved) {
            errors.push(`Missing import target: "${imp}" in file "${path}". You MUST create this missing file in your response.`);
          }
        }
      }
    }
    return errors;
  }

  public validateTypeScriptSyntax(files: Record<string, string>): string[] {
    const errors: string[] = [];
    for (const [fileName, content] of Object.entries(files)) {
      if (!fileName.endsWith('.ts') && !fileName.endsWith('.tsx')) continue;
      try {
        const sourceFile = ts.createSourceFile(
          fileName,
          content,
          ts.ScriptTarget.ESNext,
          true,
          fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );
        const diagnostics = (sourceFile as any).parseDiagnostics || [];
        for (const d of diagnostics) {
          errors.push(`TS Syntax Error in ${fileName}: ${d.messageText}`);
        }
      } catch (e) {
        // Ignore parser crash
      }
    }
    return errors;
  }

  public detectCircularDependencies(dependencyGraph: DependencyNode[]): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeFile: string, path: string[]) => {
      visited.add(nodeFile);
      recursionStack.add(nodeFile);

      const node = dependencyGraph.find(n => n.file === nodeFile);
      if (node) {
        for (const imp of node.imports) {
          const targetNode = dependencyGraph.find(n => n.file === imp);
          
          if (targetNode) {
            if (!visited.has(targetNode.file)) {
              dfs(targetNode.file, [...path, targetNode.file]);
            } else if (recursionStack.has(targetNode.file)) {
              errors.push(`Circular dependency detected: ${path.join(' -> ')} -> ${targetNode.file}`);
            }
          }
        }
      }
      recursionStack.delete(nodeFile);
    };

    for (const node of dependencyGraph) {
      if (!visited.has(node.file)) {
        dfs(node.file, [node.file]);
      }
    }
    return errors;
  }

  public extractImports(content: string): string[] {
    const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
    const matches = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  public resolveImportPath(importerFile: string, importPath: string, allFiles: Record<string, string>): string | null {
    const cacheKey = `${importerFile}|${importPath}`;
    if (this.resolveCache.has(cacheKey)) return this.resolveCache.get(cacheKey)!;

    let resolved = importPath;

    if (importPath.startsWith('@/')) {
      resolved = importPath.replace('@/', 'src/');
      if (!Object.keys(allFiles).some(f => f.startsWith(resolved))) {
        resolved = importPath.replace('@/', 'app/');
      }
    } else if (importPath.startsWith('.')) {
      resolved = this.resolveRelativePath(importerFile, importPath);
    }

    resolved = this.normalizePath(resolved);

    const candidates = [
      resolved,
      `${resolved}.ts`,
      `${resolved}.tsx`,
      `${resolved}.js`,
      `${resolved}.jsx`,
      `${resolved}/index.ts`,
      `${resolved}/index.tsx`,
      `${resolved}/index.js`,
      `${resolved}/index.jsx`,
    ];

    let finalMatch: string | null = null;
    for (const c of candidates) {
      if (allFiles[c] !== undefined) {
        finalMatch = c;
        break;
      }
    }

    this.resolveCache.set(cacheKey, finalMatch);
    return finalMatch;
  }

  public resolveRelativePath(basePath: string, relativePath: string): string {
    const baseParts = basePath.split('/').slice(0, -1);
    const relativeParts = relativePath.split('/');
    for (const part of relativeParts) {
      if (part === '.') continue;
      if (part === '..') baseParts.pop();
      else baseParts.push(part);
    }
    return baseParts.join('/');
  }

  public normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/\/\//g, '/');
  }
}
