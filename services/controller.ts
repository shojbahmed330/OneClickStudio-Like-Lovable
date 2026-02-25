
import { GenerationMode, GenerationResult, WorkspaceType, ChatMessage, DependencyNode } from "../types";
import { ModeDetector } from "./ModeDetector";
import { DiffEngine } from "./DiffEngine";
import { Validator } from "./Validator";
import { Orchestrator } from "./Orchestrator";

export class AIController {
  private modeDetector: typeof ModeDetector;
  private diffEngine: DiffEngine;
  private validator: Validator;
  private orchestrator: Orchestrator;
  
  private dependencyGraph: DependencyNode[] = [];
  private memory = {
    lastPromptHash: "",
    fileHashes: new Map<string, string>(),
    dependencyGraphSnapshot: [] as DependencyNode[],
    lastMode: null as GenerationMode | null,
    phaseCache: new Map<string, any>(),
    lastResult: null as GenerationResult | null
  };

  constructor() {
    this.modeDetector = ModeDetector;
    this.diffEngine = new DiffEngine();
    this.validator = new Validator();
    this.orchestrator = new Orchestrator(this.diffEngine);
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
    
    const fileChanged = this.diffEngine.detectFileChanges(currentFiles, this.memory.fileHashes);
    if (fileChanged) {
      console.log("[Memory] Manual file changes detected → invalidating cache");
      this.memory.phaseCache.clear();
      this.memory.lastPromptHash = "";
      this.memory.lastResult = null;
    }

    // 1. Mode Detection
    const mode = this.modeDetector.detectMode(prompt, currentFiles);
    console.log(`[Controller] Mode Detected: ${mode.toUpperCase()}`);
    yield { type: 'status', phase: 'PLANNING', message: `Mode Detected: ${mode.toUpperCase()}` };

    const originalPromptHash = this.diffEngine.hashContent(prompt);

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
    const initialErrors = this.validator.validateTypeScriptSyntax(currentFiles);
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
          const { merged, errors } = this.diffEngine.applyChanges(currentContextFiles, phaseFiles, failedPatchFiles);
          currentContextFiles = merged;
          accumulatedApplyErrors.push(...errors);
          
          for (const err of errors) {
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

        const impactedFiles = this.orchestrator.analyzeImpact(currentPrompt, this.dependencyGraph);
        const impactInstruction = impactedFiles.length > 0
          ? `\n\n🚨 STRUCTURAL IMPACT DETECTED:\nThe following files are structurally dependent and MUST be reviewed/updated to prevent breaking changes:\n${impactedFiles.map(f => `- ${f}`).join('\n')}\n\nYou MUST include updates for these files in your plan steps.`
          : "";
        const enforceInstruction = impactedFiles.length > 0
          ? `\n\n🚨 MANDATORY UPDATE REQUIREMENT:\nYou MUST update these files as part of this change:\n${impactedFiles.map(f => `- ${f}`).join('\n')}\n\nReturn patches or full files for each.`
          : "";

        const phases = this.orchestrator.decidePhases(mode, impactedFiles);
        console.log(`[Orchestrator] Running phases: ${phases.join(', ')}`);

        // Phase 1: Planning
        if (phases.includes("planning")) {
          yield { type: 'status', phase: 'PLANNING', message: "Planning architecture..." };
          const planningPrompt = currentPrompt + impactInstruction;
          const input = this.orchestrator.buildPhaseInput('planning', planningPrompt, currentContextFiles, this.dependencyGraph, activeWorkspace);
          const plan = await this.orchestrator.executePhaseWithCache('planning', input, modelName, this.memory.phaseCache);
          thoughts.push(`[PLAN]: ${plan.thought || 'Planned architecture.'}`);
          finalPlan = plan.plan || [];
        }

        // Phase 2: Coding (Developer)
        if (phases.includes("coding")) {
          yield { type: 'status', phase: 'CODING', message: "Generating code..." };
          const codingPrompt = currentPrompt + enforceInstruction;
          const input = mode === GenerationMode.SCAFFOLD 
            ? `PLAN:\n${JSON.stringify(finalPlan)}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`
            : `USER REQUEST:\n${codingPrompt}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`;
          const code = await this.orchestrator.executePhaseWithCache('coding', input, modelName, this.memory.phaseCache);
          thoughts.push(`[CODE]: ${code.thought || 'Implemented code.'}`);
          if (code.answer) finalAnswer = code.answer;
          applyPhaseFiles(code.files || {});
        }

        // Phase 3: Review
        if (phases.includes("review")) {
          yield { type: 'status', phase: 'REVIEW', message: "Reviewing implementation..." };
          const reviewPrompt = currentPrompt + enforceInstruction;
          const input = mode === GenerationMode.FIX
            ? `USER REQUEST (FIX ERROR):\n${reviewPrompt}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`
            : `GENERATED FILES:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`;
          const review = await this.orchestrator.executePhaseWithCache('review', input, modelName, this.memory.phaseCache);
          thoughts.push(`[REVIEW]: ${review.thought || 'Reviewed code.'}`);
          if (mode === GenerationMode.FIX && review.answer) finalAnswer = review.answer;
          applyPhaseFiles(review.files || {});
        }

        // Phase 4: Security
        if (phases.includes("security")) {
          yield { type: 'status', phase: 'SECURITY', message: "Security audit..." };
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE SECURITY):\n${currentPrompt}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`
            : `FILES TO SECURE:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`;
          const security = await this.orchestrator.executePhaseWithCache('security', input, modelName, this.memory.phaseCache);
          thoughts.push(`[SECURITY]: ${security.thought || 'Security audit complete.'}`);
          if (mode === GenerationMode.OPTIMIZE && security.answer) finalAnswer = security.answer;
          applyPhaseFiles(security.files || {});
        }

        // Phase 5: Performance
        if (phases.includes("performance")) {
          yield { type: 'status', phase: 'PERFORMANCE', message: "Performance audit..." };
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE PERFORMANCE):\n${currentPrompt}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`
            : `FILES TO AUDIT:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`;
          const perf = await this.orchestrator.executePhaseWithCache('performance', input, modelName, this.memory.phaseCache);
          thoughts.push(`[PERF]: ${perf.thought || 'Performance audit complete.'}`);
          applyPhaseFiles(perf.files || {});
        }

        // Phase 6: UI/UX
        if (phases.includes("uiux")) {
          yield { type: 'status', phase: 'UIUX', message: "UI/UX polish..." };
          const input = mode === GenerationMode.OPTIMIZE
            ? `USER REQUEST (OPTIMIZE UI/UX):\n${currentPrompt}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`
            : `FILES TO POLISH:\n${JSON.stringify(generatedFiles)}${patchInstruction}\n\nCONTEXT:\n${this.orchestrator.buildContext(currentContextFiles, this.dependencyGraph, currentPrompt)}`;
          const uiux = await this.orchestrator.executePhaseWithCache('uiux', input, modelName, this.memory.phaseCache);
          thoughts.push(`[UIUX]: ${uiux.thought || 'UI/UX polish complete.'}`);
          applyPhaseFiles(uiux.files || {});
        }

        // 3.5 Patch Enforcement Check
        const patchViolations = this.diffEngine.enforcePatchRules(generatedFiles, currentFiles, failedPatchFiles);
        if (patchViolations.length > 0) {
          yield { type: 'status', phase: 'FIXING', message: "Fixing patch violations..." };
          console.warn(`[Controller] Patch violation detected for:`, patchViolations);
          for (const v of patchViolations) {
            failedPatchFiles.add(v);
          }
          const violationMsg = `Patch violation detected for:\n${patchViolations.join('\n')}\n\nThese files already exist. You MUST return unified diff patches for them. Do NOT return the full file.`;
          prompt += `\n\nIMPORTANT: ${violationMsg}`;
          attempts++;
          continue;
        }

        // 4. Diff Engine & Migration Logic
        const mergedFiles = currentContextFiles;
        const applyErrors = accumulatedApplyErrors;

        this.updateDependencyGraph(mergedFiles);

        // 5. Runtime Validation (Sanity Check)
        yield { type: 'status', phase: 'REVIEW', message: "Validating code..." };
        const changedFilesToValidate: Record<string, string> = {};
        for (const [path, content] of Object.entries(mergedFiles)) {
          if (content !== currentFiles[path]) {
            changedFilesToValidate[path] = content;
          }
        }
        const validationErrors = this.validator.validateOutput(changedFilesToValidate, this.dependencyGraph);
        validationErrors.push(...applyErrors);
        
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
        yield { type: 'status', phase: 'BUILDING', message: "Building application..." };
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
        this.diffEngine.updateSnapshot(mergedFiles, this.memory.fileHashes);

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

  private updateDependencyGraph(files: Record<string, string>) {
    this.dependencyGraph = [];
    for (const [filePath, content] of Object.entries(files)) {
      const rawImports = this.validator.extractImports(content);
      const resolvedImports: string[] = [];

      for (const imp of rawImports) {
        const resolved = this.validator.resolveImportPath(filePath, imp, files);
        if (resolved) resolvedImports.push(resolved);
      }

      this.dependencyGraph.push({ 
        file: this.validator.normalizePath(filePath), 
        imports: resolvedImports,
        tablesUsed: this.extractTables(content),
        apisUsed: this.extractAPIs(content),
        servicesUsed: this.extractServices(content)
      });
    }
  }

  private extractTables(content: string): string[] {
    const tables = new Set<string>();
    const sqlRegex = /(?:from|update|into)\s+([a-zA-Z0-9_]+)/gi;
    let match;
    while ((match = sqlRegex.exec(content)) !== null) {
      const table = match[1].toLowerCase();
      if (!['select', 'where', 'set', 'values'].includes(table)) {
        tables.add(table);
      }
    }
    const supabaseRegex = /\.from(?:<[^>]+>)?\(['"]([a-zA-Z0-9_]+)['"]\)/g;
    while ((match = supabaseRegex.exec(content)) !== null) {
      tables.add(match[1]);
    }
    return Array.from(tables);
  }

  private extractAPIs(content: string): string[] {
    const apis = new Set<string>();
    const apiRegex = /(?:fetch|axios\.(?:get|post|put|delete|patch))\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = apiRegex.exec(content)) !== null) {
      apis.add(match[1]);
    }
    return Array.from(apis);
  }

  private extractServices(content: string): string[] {
    const services = new Set<string>();
    const serviceRegex = /\b(use[A-Z]\w+Service|get[A-Z]\w+|[a-zA-Z0-9_]+Service)\b/g;
    let match;
    while ((match = serviceRegex.exec(content)) !== null) {
      services.add(match[1]);
    }
    return Array.from(services);
  }
}
