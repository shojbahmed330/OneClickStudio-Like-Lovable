
import { GeminiService } from "./geminiService";
import { GenerationMode, GenerationResult, WorkspaceType, ChatMessage, DependencyNode } from "../types";
import { diff_match_patch } from "diff-match-patch";
import * as ts from "typescript";

export class AIController {
  private gemini: GeminiService;
  private dependencyGraph: DependencyNode[] = [];
  private dmp: any;
  private memory = {
    lastPromptHash: "",
    fileHashes: new Map<string, string>(),
    dependencyGraphSnapshot: [] as DependencyNode[],
    lastMode: null as GenerationMode | null,
    phaseCache: new Map<string, any>(),
    lastResult: null as GenerationResult | null
  };

  constructor() {
    this.gemini = new GeminiService();
    this.dmp = new diff_match_patch();
    this.dmp.Match_Threshold = 0.5; // Default threshold to allow minor context mismatches
    this.dmp.Match_Distance = 1000;
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0, len = content.length; i < len; i++) {
      const chr = content.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private detectFileChanges(files: Record<string, string>): boolean {
    // If cache is empty, it's the first run, not a change
    if (this.memory.fileHashes.size === 0) return false;

    for (const [path, content] of Object.entries(files)) {
      const newHash = this.hashContent(content);
      const oldHash = this.memory.fileHashes.get(path);

      if (!oldHash || newHash !== oldHash) {
        return true;
      }
    }

    // also detect deleted files
    for (const oldPath of this.memory.fileHashes.keys()) {
      if (!files[oldPath]) return true;
    }

    return false;
  }

  private updateSnapshot(files: Record<string, string>) {
    this.memory.fileHashes.clear();
    for (const [path, content] of Object.entries(files)) {
      this.memory.fileHashes.set(path, this.hashContent(content));
    }
  }

  private async executePhaseWithCache(phase: 'planning' | 'coding' | 'review' | 'security' | 'performance' | 'uiux', input: string, modelName: string): Promise<any> {
    const inputHash = this.hashContent(input);
    const phaseKey = `${phase}-${inputHash}`;
    if (this.memory.phaseCache.has(phaseKey)) {
      console.log(`[Memory] Cache hit for phase: ${phase}`);
      return this.memory.phaseCache.get(phaseKey);
    }
    
    let result = await this.gemini.callPhase(phase, input, modelName);
    
    // Sometimes the LLM returns invalid JSON (e.g. unescaped quotes or missing brackets).
    // If result is a string, try to parse it. If it fails, we might need to repair it.
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch (parseError) {
        console.warn(`[Controller] Failed to parse JSON from phase ${phase}. Attempting repair...`);
        try {
          // Basic repair: strip markdown blocks if present
          let repaired = result.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
          result = JSON.parse(repaired);
        } catch (repairError) {
          console.error(`[Controller] JSON repair failed for phase ${phase}. Returning raw result.`);
          // We throw an error so the orchestration loop can catch it and retry
          throw new Error(`Invalid JSON returned by AI in phase ${phase}: ${parseError}`);
        }
      }
    }
    
    this.memory.phaseCache.set(phaseKey, result);
    return result;
  }

  private enforcePatchRules(generatedFiles: Record<string, string>, currentFiles: Record<string, string>, exemptedFiles: Set<string>): string[] {
    const violations: string[] = [];

    for (const [path, content] of Object.entries(generatedFiles)) {
      const exists = currentFiles[path];

      // Configs and index.html should always be full overwrites, never patches
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

  private decidePhases(mode: GenerationMode, changedFiles: string[]): string[] {
    let phases: string[] = [];

    if (mode === GenerationMode.SCAFFOLD) {
      phases = ["planning", "coding", "review"];
    } else if (mode === GenerationMode.EDIT) {
      phases = ["coding", "review"];
    } else if (mode === GenerationMode.FIX) {
      phases = ["review", "coding"];
    } else if (mode === GenerationMode.OPTIMIZE) {
      phases = ["performance", "uiux"];
    }

    const dbChanged = changedFiles.some(f => f.includes("database") || f.includes("schema") || f.includes("migration"));
    const uiChanged = changedFiles.some(f => f.includes("components") || f.includes("pages") || f.includes("views") || f.endsWith(".css"));

    if (dbChanged && !phases.includes("security")) phases.push("security");
    if (uiChanged && !phases.includes("uiux")) phases.push("uiux");

    return [...new Set(phases)];
  }

  /**
   * Main entry point for the AI Brain
   */
  async *processRequest(
    prompt: string,
    currentFiles: Record<string, string>,
    history: ChatMessage[] = [],
    activeWorkspace?: WorkspaceType | boolean,
    modelName: string = 'gemini-3-flash-preview'
  ): AsyncIterable<any> {
    
    const fileChanged = this.detectFileChanges(currentFiles);
    if (fileChanged) {
      console.log("[Memory] Manual file changes detected → invalidating cache");
      this.memory.phaseCache.clear();
      this.memory.lastPromptHash = "";
      this.memory.lastResult = null;
    }

    // 1. Mode Detection
    const mode = this.detectMode(prompt, currentFiles);
    console.log(`[Controller] Mode Detected: ${mode.toUpperCase()}`);
    yield { type: 'status', phase: 'PLANNING', message: `Mode Detected: ${mode.toUpperCase()}` };

    const originalPromptHash = this.hashContent(prompt);

    // Smart Skip Logic (Early Exit)
    if (
      originalPromptHash === this.memory.lastPromptHash &&
      mode === this.memory.lastMode &&
      this.memory.lastResult
    ) {
      console.log("[Memory] No changes detected. Returning cached result.");
      yield { type: 'status', phase: 'PREVIEW_READY', message: "No changes detected. Using cache." };
      yield { type: 'result', ...this.memory.lastResult };
      return;
    }

    // 2. Dependency Mapping (Memory Graph)
    yield { type: 'status', phase: 'PLANNING', message: "Mapping dependencies..." };
    this.updateDependencyGraph(currentFiles);

    // 3. Orchestration Loop
    let attempts = 0;
    const maxAttempts = 5;
    let finalResult: GenerationResult | null = null;
    let failedPatchFiles = new Set<string>();

    // 3.1 Pre-emptive Detection: If files are already broken, force full rewrite
    yield { type: 'status', phase: 'PLANNING', message: "Checking for broken files..." };
    const initialErrors = this.validateTypeScriptSyntax(currentFiles);
    for (const err of initialErrors) {
      const match = err.match(/TS Syntax Error in ([^:]+):/);
      if (match && match[1]) {
        const brokenFile = match[1].trim();
        console.log(`[Controller] Pre-emptively forcing rewrite for broken file: ${brokenFile}`);
        failedPatchFiles.add(brokenFile);
      }
    }

    while (attempts < maxAttempts) {
      try {
        let generatedFiles: Record<string, string> = {};
        let currentContextFiles = { ...currentFiles };
        let accumulatedApplyErrors: string[] = [];
        let thoughts: string[] = [];
        let finalPlan: string[] = [];
        let finalAnswer: string = "Task completed successfully.";

        let currentPrompt = prompt;
        if (failedPatchFiles.size > 0) {
          currentPrompt += `\n\n🚨 CRITICAL RECOVERY MODE:\nYou previously failed to generate valid patches for these files:\n${Array.from(failedPatchFiles).map(f => `- ${f}`).join('\n')}\n\nFor these specific files ONLY, DO NOT USE PATCHES. You MUST return the FULL, complete file content.`;
        }

        const applyPhaseFiles = (phaseFiles: Record<string, string>) => {
          generatedFiles = { ...generatedFiles, ...phaseFiles };
          const { merged, errors } = this.applyChanges(currentContextFiles, phaseFiles, failedPatchFiles);
          currentContextFiles = merged;
          accumulatedApplyErrors.push(...errors);
          
          for (const err of errors) {
            // Match both "Failed to apply patch for..." and "File ... was returned as a full file..."
            const patchMatch = err.match(/Failed to apply patch for ([^\s:]+)/);
            const fullFileMatch = err.match(/File ([^\s:]+) was returned as a full file/);
            const target = (patchMatch && patchMatch[1]) || (fullFileMatch && fullFileMatch[1]);
            if (target) {
              const cleanedTarget = target.replace(/[,.]$/, '').trim();
              console.log(`[Controller] Adding ${cleanedTarget} to failedPatchFiles for recovery.`);
              failedPatchFiles.add(cleanedTarget);
            }
          }
          
          this.updateDependencyGraph(currentContextFiles);
        };

        const isPatchMode = mode === GenerationMode.EDIT || mode === GenerationMode.FIX || mode === GenerationMode.OPTIMIZE;
        let patchInstruction = "";
        if (isPatchMode) {
          patchInstruction = "\nPATCH MODE (STRICT):\nIf a file already exists in the PROJECT MAP, you MUST return ONLY a unified diff patch.\nIf you return the full file content for an existing file, your response will be REJECTED.\n";
          if (failedPatchFiles.size > 0) {
            patchInstruction += `\nEXCEPTION: For the following files, you MUST provide the FULL content (do not use patches):\n${Array.from(failedPatchFiles).join('\n')}\n`;
          }
        }

        const impactedFiles = this.analyzeImpact(currentPrompt);
        const impactInstruction = impactedFiles.length > 0
          ? `\n\n🚨 STRUCTURAL IMPACT DETECTED:\nThe following files are structurally dependent and MUST be reviewed/updated to prevent breaking changes:\n${impactedFiles.map(f => `- ${f}`).join('\n')}\n\nYou MUST include updates for these files in your plan steps.`
          : "";
        const enforceInstruction = impactedFiles.length > 0
          ? `\n\n🚨 MANDATORY UPDATE REQUIREMENT:\nYou MUST update these files as part of this change:\n${impactedFiles.map(f => `- ${f}`).join('\n')}\n\nReturn patches or full files for each.`
          : "";

        // Determine which phases to run based on mode and impacted files
        const phases = this.decidePhases(mode, impactedFiles);
        console.log(`[Orchestrator] Running phases: ${phases.join(', ')}`);

        // Phase 1: Planning
        if (phases.includes("planning")) {
          yield { type: 'status', phase: 'PLANNING', message: "Planning architecture..." };
          const planningPrompt = currentPrompt + impactInstruction;
          const input = this.buildPhaseInput('planning', planningPrompt, currentContextFiles, activeWorkspace);
          const plan = await this.executePhaseWithCache('planning', input, modelName);
          thoughts.push(`[PLAN]: ${plan.thought || 'Planned architecture.'}`);
          finalPlan = plan.plan || [];
        }

        // Phase 2: Coding (Developer)
        if (phases.includes("coding")) {
          yield { type: 'status', phase: 'CODING', message: "Generating code..." };
          const codingPrompt = currentPrompt + enforceInstruction;
          const input = mode === GenerationMode.SCAFFOLD 
            ? `PLAN:\n${JSON.stringify(finalPlan)}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`
            : `USER REQUEST:\n${codingPrompt}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`;
          const code = await this.executePhaseWithCache('coding', input, modelName);
          thoughts.push(`[CODE]: ${code.thought || 'Implemented code.'}`);
          if (code.answer) finalAnswer = code.answer;
          applyPhaseFiles(code.files || {});
        }

        // Phase 3: Review
        if (phases.includes("review")) {
          yield { type: 'status', phase: 'REVIEW', message: "Reviewing implementation..." };
          const reviewPrompt = currentPrompt + enforceInstruction;
          const input = mode === GenerationMode.FIX
            ? `USER REQUEST (FIX ERROR):\n${reviewPrompt}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`
            : `GENERATED FILES:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`;
          const review = await this.executePhaseWithCache('review', input, modelName);
          thoughts.push(`[REVIEW]: ${review.thought || 'Reviewed code.'}`);
          if (mode === GenerationMode.FIX && review.answer) finalAnswer = review.answer;
          applyPhaseFiles(review.files || {});
        }

        // Phase 4: Security
        if (phases.includes("security")) {
          yield { type: 'status', phase: 'SECURITY', message: "Security audit..." };
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE SECURITY):\n${currentPrompt}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`
            : `FILES TO SECURE:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`;
          const security = await this.executePhaseWithCache('security', input, modelName);
          thoughts.push(`[SECURITY]: ${security.thought || 'Security audit complete.'}`);
          if (mode === GenerationMode.OPTIMIZE && security.answer) finalAnswer = security.answer;
          applyPhaseFiles(security.files || {});
        }

        // Phase 5: Performance
        if (phases.includes("performance")) {
          yield { type: 'status', phase: 'PERFORMANCE', message: "Performance audit..." };
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE PERFORMANCE):\n${currentPrompt}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`
            : `FILES TO AUDIT:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`;
          const perf = await this.executePhaseWithCache('performance', input, modelName);
          thoughts.push(`[PERF]: ${perf.thought || 'Performance audit complete.'}`);
          applyPhaseFiles(perf.files || {});
        }

        // Phase 6: UI/UX
        if (phases.includes("uiux")) {
          yield { type: 'status', phase: 'UIUX', message: "UI/UX polish..." };
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE UI/UX):\n${currentPrompt}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`
            : `FILES TO POLISH:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.buildContext(currentContextFiles, currentPrompt)}`;
          const uiux = await this.executePhaseWithCache('uiux', input, modelName);
          thoughts.push(`[UIUX]: ${uiux.thought || 'UI/UX polish complete.'}`);
          applyPhaseFiles(uiux.files || {});
        }

        // 3.5 Patch Enforcement Check
        const patchViolations = this.enforcePatchRules(generatedFiles, currentFiles, failedPatchFiles);
        if (patchViolations.length > 0) {
          yield { type: 'status', phase: 'FIXING', message: "Fixing patch violations..." };
          console.warn(`[Controller] Patch violation detected for:`, patchViolations);
          for (const v of patchViolations) {
            failedPatchFiles.add(v);
          }
          const violationMsg = `Patch violation detected for:\n${patchViolations.join('\n')}\n\nThese files already exist. You MUST return unified diff patches for them. Do NOT return the full file.`;
          prompt += `\n\nIMPORTANT: ${violationMsg}`;
          attempts++;
          continue; // Skip the rest of the loop and retry immediately
        }

        // 4. Diff Engine & Migration Logic
        const mergedFiles = currentContextFiles;
        const applyErrors = accumulatedApplyErrors;

        // Update dependency graph with merged files BEFORE validation
        this.updateDependencyGraph(mergedFiles);

        // 5. Runtime Validation (Sanity Check)
        yield { type: 'status', phase: 'REVIEW', message: "Validating code..." };
        // Validate the final merged content of the files that were touched
        const changedFilesToValidate: Record<string, string> = {};
        for (const [path, content] of Object.entries(mergedFiles)) {
          if (content !== currentFiles[path]) {
            changedFilesToValidate[path] = content;
          }
        }
        const validationErrors = this.validateOutput(changedFilesToValidate);
        validationErrors.push(...applyErrors);
        
        // Strict Impact Enforcement Check
        if (impactedFiles.length > 0) {
          const missingImpactFiles = impactedFiles.filter(
            f => !Object.keys(generatedFiles).some(p => p.includes(f))
          );
          if (missingImpactFiles.length > 0) {
            validationErrors.push(`CRITICAL: You failed to update required dependent files:\n${missingImpactFiles.join('\n')}\nYou MUST update them to maintain structural consistency.`);
          }
        }

        if (validationErrors.length > 0) {
          yield { type: 'status', phase: 'FIXING', message: `Fixing ${validationErrors.length} errors...` };
          yield { type: 'validation_errors', errors: validationErrors };
          console.warn(`[Controller] Validation failed (Attempt ${attempts + 1}):`, validationErrors);
          prompt += `\n\n🚨 VALIDATION FAILED (Attempt ${attempts + 1}):\n${validationErrors.join('\n')}\n\nPlease fix these errors in your next response.`;
          attempts++;
          continue;
        }

        // 6. Success: Finalize Result
        yield { type: 'status', phase: 'PREVIEW_READY', message: "Finalizing build..." };
        finalResult = {
          files: generatedFiles,
          answer: finalAnswer,
          thought: thoughts.join('\n\n'),
          plan: finalPlan,
          mode
        };

        this.memory.lastPromptHash = originalPromptHash;
        this.memory.lastMode = mode;
        this.memory.lastResult = finalResult;
        this.updateSnapshot(mergedFiles);

        yield { type: 'result', ...finalResult };
        return;

      } catch (error: any) {
        console.error(`[Controller] Generation error:`, error.message);
        attempts++;
        if (attempts >= maxAttempts) throw error;
        yield { type: 'status', phase: 'FIXING', message: `Retrying after error: ${error.message}` };
      }
    }

    throw new Error("Failed to generate code after multiple attempts.");
  }

  async *processRequestStream(
    prompt: string,
    currentFiles: Record<string, string>,
    history: ChatMessage[] = [],
    activeWorkspace?: WorkspaceType | boolean,
    modelName: string = 'gemini-3-flash-preview'
  ): AsyncIterable<string> {
    try {
      const generator = this.processRequest(prompt, currentFiles, history, activeWorkspace, modelName);
      for await (const update of generator) {
        yield JSON.stringify(update) + "\n";
      }
    } catch (error: any) {
      throw error;
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

  private applyChanges(base: Record<string, string>, changes: Record<string, string>, exemptedFiles: Set<string> = new Set()): { merged: Record<string, string>, errors: string[] } {
    const result = { ...base };
    const errors: string[] = [];

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
          const trimmed = newContent.trim();
          const isUnifiedDiff = trimmed.startsWith('--- ') && trimmed.includes('@@ ');

          // Check if the AI returned a unified diff patch format directly
          if (isUnifiedDiff) {
            try {
              // Normalize the LLM-generated patch for diff-match-patch
              const patchStartIndex = trimmed.indexOf('@@ ');
              if (patchStartIndex === -1) throw new Error("No @@ block found");
              
              let rawPatchContent = trimmed.substring(patchStartIndex).replace(/\r\n/g, '\n');
              // Strip trailing markdown backticks if present
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
                
                // diff-match-patch expects the text part to be URI encoded
                // We must encode it to prevent URIError on characters like '%'
                return sign + encodeURI(text);
              });
              
              const formattedPatch = formattedPatchLines.join('\n') + '\n';
              
              const patches = this.dmp.patch_fromText(formattedPatch);
              const [patchedText, results] = this.dmp.patch_apply(patches, base[path]);
              
              // Verify if patch was successful and conflict-free
              const allSuccessful = results.every(Boolean);
              if (allSuccessful && !patchedText.includes("<<<<<<<")) {
                result[path] = patchedText;
                console.log(`[Diff Engine] Successfully applied AI patch to ${path}`);
              } else {
                console.warn(`[Diff Engine] AI Patch failed or conflicted for ${path}, keeping old content.`);
                errors.push(`Failed to apply patch for ${path}. The patch was rejected or conflicted. Please ensure your patch context EXACTLY matches the original file, including indentation. Provide at least 3 lines of unchanged context before and after your changes.`);
                // Do not overwrite with raw patch text as it will break the file
                result[path] = base[path];
              }
            } catch (e: any) {
              console.error(`[Diff Engine] Error applying patch to ${path}:`, e);
              errors.push(`Failed to apply patch for ${path} due to a parsing error. Please ensure your unified diff patch is perfectly formatted.`);
              result[path] = base[path]; // Fallback to keep old content
            }
            continue;
          }

          const isAllowedFullFile = path === 'package.json' || path === 'metadata.json' || path === 'index.html' || exemptedFiles.has(path);
          if (isAllowedFullFile) {
            result[path] = newContent;
            continue;
          }

          // Smart Diff Detection for full file returns (Fallback only if somehow bypassed)
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
              console.warn(`[Diff Engine] Smart patch conflicted for ${path}, rejecting change.`);
              errors.push(`Failed to apply smart patch for ${path}. The patch was rejected or conflicted.`);
              result[path] = base[path];
            }
          } else {
            // Big change -> reject if it's supposed to be a patch
            console.warn(`[Diff Engine] Big change detected for ${path} (Size diff: ${sizeDiff} > 40%), rejecting as non-patch.`);
            errors.push(`File ${path} was returned as a full file instead of a patch. This is not allowed for existing files.`);
            result[path] = base[path];
          }
        } catch (e: any) {
          console.error(`[Diff Engine] Error applying changes to ${path}:`, e);
          errors.push(`Failed to apply patch for ${path} due to a parsing error. Please ensure your unified diff patch is perfectly formatted.`);
          result[path] = base[path]; // Fallback to keep old content
        }
      } else {
        // New file
        result[path] = newContent;
      }
    }

    return { merged: result, errors };
  }

  private resolveCache = new Map<string, string | null>();

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/\/\//g, '/');
  }

  private resolveImportPath(importerFile: string, importPath: string, allFiles: Record<string, string>): string | null {
    const cacheKey = `${importerFile}|${importPath}`;
    if (this.resolveCache.has(cacheKey)) return this.resolveCache.get(cacheKey)!;

    let resolved = importPath;

    // 1. Alias support
    if (importPath.startsWith('@/')) {
      resolved = importPath.replace('@/', 'src/');
      if (!Object.keys(allFiles).some(f => f.startsWith(resolved))) {
        resolved = importPath.replace('@/', 'app/');
      }
    } else if (importPath.startsWith('.')) {
      // 2. Relative import
      resolved = this.resolveRelativePath(importerFile, importPath);
    }

    resolved = this.normalizePath(resolved);

    // 3. Try extensions
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

  private updateDependencyGraph(files: Record<string, string>) {
    this.dependencyGraph = [];
    this.resolveCache.clear();

    for (const [filePath, content] of Object.entries(files)) {
      const rawImports = this.extractImports(content);
      const resolvedImports: string[] = [];

      for (const imp of rawImports) {
        const resolved = this.resolveImportPath(filePath, imp, files);
        if (resolved) resolvedImports.push(resolved);
      }

      this.dependencyGraph.push({ 
        file: this.normalizePath(filePath), 
        imports: resolvedImports,
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
    // Match Supabase: .from('table_name') or .from<Type>("table_name")
    const supabaseRegex = /\.from(?:<[^>]+>)?\(['"]([a-zA-Z0-9_]+)['"]\)/g;
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

  private validateFileSizeAndConflicts(files: Record<string, string>): string[] {
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

  private resolveRelativePath(basePath: string, relativePath: string): string {
    const baseParts = basePath.split('/').slice(0, -1);
    const relativeParts = relativePath.split('/');
    for (const part of relativeParts) {
      if (part === '.') continue;
      if (part === '..') baseParts.pop();
      else baseParts.push(part);
    }
    return baseParts.join('/');
  }

  private validateImports(files: Record<string, string>): string[] {
    const errors: string[] = [];

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

  private validateTypeScriptSyntax(files: Record<string, string>): string[] {
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

  private validateMigrationConsistency(files: Record<string, string>): string[] {
    const errors: string[] = [];
    const migrationFiles = Object.keys(files).filter(f => f.endsWith('.sql'));
    
    for (const migration of migrationFiles) {
      const content = files[migration];
      const alteredTables = new Set<string>();
      const regex = /(?:create table|alter table|update|insert into)(?:\s+if\s+not\s+exists)?\s+([a-zA-Z0-9_]+)/gi;
      let match;
      while ((match = regex.exec(content)) !== null) {
        alteredTables.add(match[1].toLowerCase());
      }

      for (const table of alteredTables) {
        const isUsed = this.dependencyGraph.some(node => node.tablesUsed.includes(table));
        if (!isUsed) {
          errors.push(`Migration modifies table "${table}" but no service/component uses it.`);
        }
      }
    }
    return errors;
  }

  private detectCircularDependencies(): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeFile: string, path: string[]) => {
      visited.add(nodeFile);
      recursionStack.add(nodeFile);

      const node = this.dependencyGraph.find(n => n.file === nodeFile);
      if (node) {
        for (const imp of node.imports) {
          const targetNode = this.dependencyGraph.find(n => n.file === imp);
          
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

    for (const node of this.dependencyGraph) {
      if (!visited.has(node.file)) {
        dfs(node.file, [node.file]);
      }
    }
    return errors;
  }

  private validateOutput(files: Record<string, string>): string[] {
    const errors: string[] = [];
    errors.push(...this.validateFileSizeAndConflicts(files));
    errors.push(...this.validateImports(files));
    errors.push(...this.validateTypeScriptSyntax(files));
    // Migration consistency check removed as it blocks incremental table creation
    errors.push(...this.detectCircularDependencies());
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
        if (directImpactFiles.has(imp)) {
          impactedFiles.add(node.file);
        }
      }
    }

    return Array.from(impactedFiles);
  }

  private detectMentionedFiles(prompt: string, files: Record<string, string>): string[] {
    const lowerPrompt = prompt.toLowerCase();
    return Object.keys(files).filter(f => {
      const fileName = f.split('/').pop()?.toLowerCase() || "";
      return lowerPrompt.includes(f.toLowerCase()) || (fileName && lowerPrompt.includes(fileName));
    });
  }

  private findFileByName(importName: string, files: Record<string, string>): string | undefined {
    const name = importName.split('/').pop()?.replace(/\.[^/.]+$/, "") || "";
    return Object.keys(files).find(f => f.includes(name));
  }

  private buildContext(files: Record<string, string>, prompt?: string): string {
    let impactWarning = "";
    const contextSet = new Set<string>();

    if (prompt) {
      const impacted = this.analyzeImpact(prompt);
      const mentioned = this.detectMentionedFiles(prompt, files);
      
      impacted.forEach(f => contextSet.add(f));
      mentioned.forEach(f => contextSet.add(f));

      if (impacted.length > 0) {
        impactWarning = `\n\n⚠️ ACTIVE IMPACT ANALYSIS:\nBased on your request, the following files are structurally dependent and MUST be reviewed/updated to prevent breaking changes:\n${impacted.map(f => `- ${f}`).join('\n')}`;
      }
    }

    // Add dependency neighbors
    for (const node of this.dependencyGraph) {
      if (contextSet.has(node.file)) {
        node.imports.forEach(imp => {
          if (files[imp]) contextSet.add(imp);
        });
      }
    }

    // If no specific context could be determined, include all files (up to a limit)
    const filesToInclude = contextSet.size > 0 ? Array.from(contextSet) : Object.keys(files);

    const MAX_FILES = 20;
    const selectedFiles = filesToInclude.slice(0, MAX_FILES);

    let contextText = "";
    for (const path of selectedFiles) {
      const content = files[path];
      if (!content) continue;

      if (content.length > 5000) {
        contextText += `\nFILE: ${path}\nSUMMARY:\n${content.slice(0, 1200)}\n... [TRUNCATED]\n`;
      } else {
        contextText += `\nFILE: ${path}\n${content}\n`;
      }
    }
    
    const graphContext = JSON.stringify(this.dependencyGraph.map(n => ({ file: n.file, tables: n.tablesUsed, services: n.servicesUsed })), null, 2);
    return `PROJECT MAP:\n${Object.keys(files).join('\n')}${impactWarning}\n\nDEEP DEPENDENCY GRAPH (Summary):\n${graphContext}\n\nRELEVANT FILES ONLY:\n${contextText}`;
  }
}
