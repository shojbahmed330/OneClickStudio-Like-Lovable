
import { GeminiService } from "./geminiService";
import { GenerationMode, GenerationResult, WorkspaceType, ChatMessage, DependencyNode } from "../types";
import { diff_match_patch } from "diff-match-patch";

export class AIController {
  private gemini: GeminiService;
  private dependencyGraph: DependencyNode[] = [];
  private dmp: any;

  constructor() {
    this.gemini = new GeminiService();
    this.dmp = new diff_match_patch();
  }

  /**
   * Main entry point for the AI Brain
   */
  async processRequest(
    prompt: string,
    currentFiles: Record<string, string>,
    history: ChatMessage[] = [],
    activeWorkspace?: WorkspaceType | boolean,
    modelName: string = 'gemini-3-flash-preview'
  ): Promise<GenerationResult> {
    
    // 1. Mode Detection
    const mode = this.detectMode(prompt, currentFiles);
    console.log(`[Controller] Mode Detected: ${mode.toUpperCase()}`);

    // 2. Dependency Mapping (Memory Graph)
    this.updateDependencyGraph(currentFiles);

    // 3. Orchestration Loop
    let attempts = 0;
    const maxAttempts = 2;
    let finalResult: GenerationResult | null = null;

    while (attempts < maxAttempts) {
      try {
        let generatedFiles: Record<string, string> = {};
        let currentContextFiles = { ...currentFiles };
        let thoughts: string[] = [];
        let finalPlan: string[] = [];
        let finalAnswer: string = "Task completed successfully.";

        // Phase 1: Planning
        if (mode === GenerationMode.SCAFFOLD) {
          const plan = await this.gemini.callPhase('planning', this.buildPhaseInput('planning', prompt, currentContextFiles, activeWorkspace), modelName);
          thoughts.push(`[PLAN]: ${plan.thought || 'Planned architecture.'}`);
          finalPlan = plan.plan || [];
        }

        // Phase 2: Coding (Developer)
        if (mode === GenerationMode.SCAFFOLD || mode === GenerationMode.EDIT) {
          const input = mode === GenerationMode.SCAFFOLD 
            ? `PLAN:\n${JSON.stringify(finalPlan)}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`
            : `USER REQUEST:\n${prompt}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`;
          const code = await this.gemini.callPhase('coding', input, modelName);
          thoughts.push(`[CODE]: ${code.thought || 'Implemented code.'}`);
          if (code.answer) finalAnswer = code.answer;
          generatedFiles = { ...generatedFiles, ...(code.files || {}) };
          currentContextFiles = { ...currentContextFiles, ...generatedFiles };
        }

        // Phase 3: Review
        if (mode === GenerationMode.SCAFFOLD || mode === GenerationMode.EDIT || mode === GenerationMode.FIX) {
          const input = mode === GenerationMode.FIX
            ? `USER REQUEST (FIX ERROR):\n${prompt}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`
            : `GENERATED FILES:\n${JSON.stringify(generatedFiles)}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`;
          const review = await this.gemini.callPhase('review', input, modelName);
          thoughts.push(`[REVIEW]: ${review.thought || 'Reviewed code.'}`);
          if (mode === GenerationMode.FIX && review.answer) finalAnswer = review.answer;
          generatedFiles = { ...generatedFiles, ...(review.files || {}) };
          currentContextFiles = { ...currentContextFiles, ...generatedFiles };
        }

        // Phase 4: Security
        {
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE SECURITY):\n${prompt}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`
            : `FILES TO SECURE:\n${JSON.stringify(generatedFiles)}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`;
          const security = await this.gemini.callPhase('security', input, modelName);
          thoughts.push(`[SECURITY]: ${security.thought || 'Security audit complete.'}`);
          if (mode === GenerationMode.OPTIMIZE && security.answer) finalAnswer = security.answer;
          generatedFiles = { ...generatedFiles, ...(security.files || {}) };
          currentContextFiles = { ...currentContextFiles, ...generatedFiles };
        }

        // Phase 5: Performance
        {
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE PERFORMANCE):\n${prompt}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`
            : `FILES TO AUDIT:\n${JSON.stringify(generatedFiles)}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`;
          const perf = await this.gemini.callPhase('performance', input, modelName);
          thoughts.push(`[PERF]: ${perf.thought || 'Performance audit complete.'}`);
          generatedFiles = { ...generatedFiles, ...(perf.files || {}) };
          currentContextFiles = { ...currentContextFiles, ...generatedFiles };
        }

        // Phase 6: UI/UX
        {
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE UI/UX):\n${prompt}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`
            : `FILES TO POLISH:\n${JSON.stringify(generatedFiles)}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, prompt)}`;
          const uiux = await this.gemini.callPhase('uiux', input, modelName);
          thoughts.push(`[UIUX]: ${uiux.thought || 'UI/UX polish complete.'}`);
          generatedFiles = { ...generatedFiles, ...(uiux.files || {}) };
        }

        // 4. Runtime Validation (Sanity Check)
        const validationErrors = this.validateOutput(generatedFiles);
        if (validationErrors.length === 0) {
          // 5. Diff Engine & Migration Logic
          const mergedFiles = this.applyChanges(currentFiles, generatedFiles);
          
          finalResult = {
            thought: thoughts.join('\n\n'),
            plan: finalPlan,
            answer: finalAnswer,
            files: mergedFiles,
            mode
          };
          break; 
        }

        console.warn(`[Controller] Validation failed (Attempt ${attempts + 1}):`, validationErrors);
        prompt += `\n\nIMPORTANT: Your previous output had validation errors. Please fix them:\n${validationErrors.join('\n')}`;
        attempts++;
      } catch (error) {
        console.error(`[Controller] Generation error:`, error);
        attempts++;
      }
    }

    if (!finalResult) throw new Error("Failed to generate code after multiple attempts.");
    return finalResult;
  }

  /**
   * Streaming entry point for the AI Brain
   */
  async *processRequestStream(
    prompt: string,
    currentFiles: Record<string, string>,
    history: ChatMessage[] = [],
    activeWorkspace?: WorkspaceType | boolean,
    modelName: string = 'gemini-3-flash-preview'
  ): AsyncIterable<string> {
    yield "Thinking (Planning)...";
    try {
      const result = await this.processRequest(prompt, currentFiles, history, activeWorkspace, modelName);
      yield JSON.stringify(result);
    } catch (error: any) {
      yield `Error: ${error.message}`;
    }
  }

  private detectMode(prompt: string, currentFiles: Record<string, string>): GenerationMode {
    const p = prompt.toLowerCase();
    const hasFiles = Object.keys(currentFiles).length > 0;

    if (!hasFiles) return GenerationMode.SCAFFOLD;
    if (p.includes('fix') || p.includes('error') || p.includes('bug') || p.includes('failed')) return GenerationMode.FIX;
    if (p.includes('optimize') || p.includes('performance') || p.includes('speed up')) return GenerationMode.OPTIMIZE;
    return GenerationMode.EDIT;
  }

  private applyChanges(base: Record<string, string>, changes: Record<string, string>): Record<string, string> {
    const result = { ...base };

    for (const [path, newContent] of Object.entries(changes)) {
      // Migration Logic: If database.sql is changed, create a migration instead
      if (path === 'database.sql' && base[path]) {
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const migrationPath = `migrations/${timestamp}_auto_migration.sql`;
        result[migrationPath] = newContent;
        continue;
      }

      // Diff Engine: Apply as patch if file exists
      if (base[path]) {
        try {
          // Check if the AI returned a unified diff patch format directly
          if (newContent.startsWith('@@ ') || newContent.startsWith('--- ')) {
            const patches = this.dmp.patch_fromText(newContent);
            const [patchedText, results] = this.dmp.patch_apply(patches, base[path]);
            
            // Verify if patch was successful and conflict-free
            const allSuccessful = results.every((success: boolean) => success === true);
            if (allSuccessful && !patchedText.includes("<<<<<<<")) {
              result[path] = patchedText;
              console.log(`[Diff Engine] Successfully applied AI patch to ${path}`);
            } else {
              console.warn(`[Diff Engine] AI Patch failed or conflicted for ${path}, falling back to full overwrite.`);
              result[path] = newContent;
            }
            continue;
          }

          // Smart Diff Detection for full file returns
          const sizeDiff = Math.abs(base[path].length - newContent.length);
          const isSmallChange = sizeDiff < (base[path].length * 0.4);

          if (isSmallChange) {
            // Generate patch from old vs new
            const patches = this.dmp.patch_make(base[path], newContent);
            const [patchedText, results] = this.dmp.patch_apply(patches, base[path]);
            
            const allSuccessful = results.every((success: boolean) => success === true);
            
            // Conflict safety
            if (allSuccessful && !patchedText.includes("<<<<<<<") && !patchedText.includes("=======")) {
              result[path] = patchedText;
              console.log(`[Diff Engine] Smart patch applied for ${path} (Size diff: ${sizeDiff})`);
            } else {
              console.warn(`[Diff Engine] Smart patch conflicted for ${path}, falling back to overwrite.`);
              result[path] = newContent;
            }
          } else {
            // Big change -> full overwrite
            console.log(`[Diff Engine] Big change detected for ${path} (Size diff: ${sizeDiff} > 40%), full overwrite.`);
            result[path] = newContent;
          }
        } catch (e) {
          console.error(`[Diff Engine] Error applying changes to ${path}:`, e);
          result[path] = newContent; // Fallback to overwrite
        }
      } else {
        // New file
        result[path] = newContent;
      }
    }

    return result;
  }

  private updateDependencyGraph(files: Record<string, string>) {
    this.dependencyGraph = [];
    for (const [path, content] of Object.entries(files)) {
      this.dependencyGraph.push({ 
        file: path, 
        imports: this.extractImports(content),
        tablesUsed: this.extractTables(content),
        apisUsed: this.extractAPIs(content),
        servicesUsed: this.extractServices(content)
      });
    }
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
    const matches = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  private extractTables(content: string): string[] {
    const tables = new Set<string>();
    // Match SQL: FROM table_name, UPDATE table_name, INSERT INTO table_name
    const sqlRegex = /(?:from|update|into)\s+([a-zA-Z0-9_]+)/gi;
    let match;
    while ((match = sqlRegex.exec(content)) !== null) {
      const table = match[1].toLowerCase();
      if (!['select', 'where', 'set', 'values'].includes(table)) {
        tables.add(table);
      }
    }
    // Match Supabase: .from('table_name') or .from("table_name")
    const supabaseRegex = /\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g;
    while ((match = supabaseRegex.exec(content)) !== null) {
      tables.add(match[1]);
    }
    return Array.from(tables);
  }

  private extractAPIs(content: string): string[] {
    const apis = new Set<string>();
    // Match fetch('/api/...') or axios.get('/api/...')
    const apiRegex = /(?:fetch|axios\.(?:get|post|put|delete|patch))\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = apiRegex.exec(content)) !== null) {
      apis.add(match[1]);
    }
    return Array.from(apis);
  }

  private extractServices(content: string): string[] {
    const services = new Set<string>();
    // Match useSomethingService(), getSomething(), or somethingService.method()
    const serviceRegex = /\b(use[A-Z]\w+Service|get[A-Z]\w+|[a-zA-Z0-9_]+Service)\b/g;
    let match;
    while ((match = serviceRegex.exec(content)) !== null) {
      services.add(match[1]);
    }
    return Array.from(services);
  }

  private validateOutput(files: Record<string, string>): string[] {
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

  private buildPhaseInput(phase: string, prompt: string, files: Record<string, string>, workspace?: any): string {
    return `PHASE: ${phase.toUpperCase()}\nUSER REQUEST: ${prompt}\n\nCONTEXT:\n${this.buildContext(files, prompt)}`;
  }

  private analyzeImpact(prompt: string): string[] {
    const impactedFiles = new Set<string>();
    const lowerPrompt = prompt.toLowerCase();

    // 1. Identify which tables or services are mentioned in the prompt
    const mentionedTables = new Set<string>();
    const mentionedServices = new Set<string>();

    for (const node of this.dependencyGraph) {
      for (const table of node.tablesUsed) {
        if (lowerPrompt.includes(table.toLowerCase())) mentionedTables.add(table);
      }
      for (const service of node.servicesUsed) {
        if (lowerPrompt.includes(service.toLowerCase())) mentionedServices.add(service);
      }
    }

    // 2. Find direct impacts (files using these tables/services)
    const directImpactFiles = new Set<string>();
    for (const node of this.dependencyGraph) {
      const usesMentionedTable = node.tablesUsed.some(t => mentionedTables.has(t));
      const usesMentionedService = node.servicesUsed.some(s => mentionedServices.has(s));
      
      if (usesMentionedTable || usesMentionedService) {
        directImpactFiles.add(node.file);
        impactedFiles.add(node.file);
      }
    }

    // 3. Find cascading impacts (files importing the directly impacted files)
    for (const node of this.dependencyGraph) {
      for (const imp of node.imports) {
        // If this node imports a file that was directly impacted
        const importedFileName = imp.split('/').pop()?.replace(/\.[^/.]+$/, "") || "";
        for (const directFile of directImpactFiles) {
          if (directFile.includes(importedFileName)) {
            impactedFiles.add(node.file);
          }
        }
      }
    }

    return Array.from(impactedFiles);
  }

  private buildContext(files: Record<string, string>, prompt?: string): string {
    let impactWarning = "";
    if (prompt) {
      const impactedFiles = this.analyzeImpact(prompt);
      if (impactedFiles.length > 0) {
        impactWarning = `\n\n⚠️ ACTIVE IMPACT ANALYSIS:\nBased on your request, the following files are structurally dependent and MUST be reviewed/updated to prevent breaking changes:\n${impactedFiles.map(f => `- ${f}`).join('\n')}`;
      }
    }
    
    const graphContext = JSON.stringify(this.dependencyGraph.map(n => ({ file: n.file, tables: n.tablesUsed, services: n.servicesUsed })), null, 2);
    return `PROJECT MAP:\n${Object.keys(files).join('\n')}${impactWarning}\n\nDEEP DEPENDENCY GRAPH (Summary):\n${graphContext}\n\nSOURCE:\n${JSON.stringify(files)}`;
  }
}
