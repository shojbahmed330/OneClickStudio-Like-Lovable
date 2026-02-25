
import { GeminiService } from "./geminiService";
import { GenerationMode, GenerationResult, WorkspaceType, DependencyNode } from "../types";
import { DiffEngine } from "./DiffEngine";

export class Orchestrator {
  private gemini: GeminiService;
  private diffEngine: DiffEngine;

  constructor(diffEngine: DiffEngine) {
    this.gemini = new GeminiService();
    this.diffEngine = diffEngine;
  }

  public async executePhaseWithCache(
    phase: 'planning' | 'coding' | 'review' | 'security' | 'performance' | 'uiux',
    input: string,
    modelName: string,
    phaseCache: Map<string, any>
  ): Promise<any> {
    const inputHash = this.diffEngine.hashContent(input);
    const phaseKey = `${phase}-${inputHash}`;
    if (phaseCache.has(phaseKey)) {
      console.log(`[Memory] Cache hit for phase: ${phase}`);
      return phaseCache.get(phaseKey);
    }
    
    let result = await this.gemini.callPhase(phase, input, modelName);
    
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch (parseError) {
        console.warn(`[Controller] Failed to parse JSON from phase ${phase}. Attempting repair...`);
        try {
          let repaired = result.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
          result = JSON.parse(repaired);
        } catch (repairError) {
          console.error(`[Controller] JSON repair failed for phase ${phase}. Returning raw result.`);
          throw new Error(`Invalid JSON returned by AI in phase ${phase}: ${parseError}`);
        }
      }
    }
    
    phaseCache.set(phaseKey, result);
    return result;
  }

  public decidePhases(mode: GenerationMode, changedFiles: string[]): string[] {
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

  public buildPhaseInput(phase: string, prompt: string, files: Record<string, string>, dependencyGraph: DependencyNode[], activeWorkspace?: any): string {
    return `PHASE: ${phase.toUpperCase()}\nUSER REQUEST: ${prompt}\n\nCONTEXT:\n${this.buildContext(files, dependencyGraph, prompt)}`;
  }

  public buildContext(files: Record<string, string>, dependencyGraph: DependencyNode[], prompt?: string): string {
    let impactWarning = "";
    const contextSet = new Set<string>();

    if (prompt) {
      const impacted = this.analyzeImpact(prompt, dependencyGraph);
      const mentioned = this.detectMentionedFiles(prompt, files);
      
      impacted.forEach(f => contextSet.add(f));
      mentioned.forEach(f => contextSet.add(f));

      if (impacted.length > 0) {
        impactWarning = `\n\n⚠️ ACTIVE IMPACT ANALYSIS:\nBased on your request, the following files are structurally dependent and MUST be reviewed/updated to prevent breaking changes:\n${impacted.map(f => `- ${f}`).join('\n')}`;
      }
    }

    for (const node of dependencyGraph) {
      if (contextSet.has(node.file)) {
        node.imports.forEach(imp => {
          if (files[imp]) contextSet.add(imp);
        });
      }
    }

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
    
    const graphContext = JSON.stringify(dependencyGraph.map(n => ({ file: n.file, tables: n.tablesUsed, services: n.servicesUsed })), null, 2);
    return `PROJECT MAP:\n${Object.keys(files).join('\n')}${impactWarning}\n\nDEEP DEPENDENCY GRAPH (Summary):\n${graphContext}\n\nRELEVANT FILES ONLY:\n${contextText}`;
  }

  public analyzeImpact(prompt: string, dependencyGraph: DependencyNode[]): string[] {
    const impactedFiles = new Set<string>();
    const lowerPrompt = prompt.toLowerCase();

    const mentionedTables = new Set<string>();
    const mentionedServices = new Set<string>();

    for (const node of dependencyGraph) {
      for (const table of node.tablesUsed) {
        if (lowerPrompt.includes(table.toLowerCase())) mentionedTables.add(table);
      }
      for (const service of node.servicesUsed) {
        if (lowerPrompt.includes(service.toLowerCase())) mentionedServices.add(service);
      }
    }

    const directImpactFiles = new Set<string>();
    for (const node of dependencyGraph) {
      const usesMentionedTable = node.tablesUsed.some(t => mentionedTables.has(t));
      const usesMentionedService = node.servicesUsed.some(s => mentionedServices.has(s));
      
      if (usesMentionedTable || usesMentionedService) {
        directImpactFiles.add(node.file);
        impactedFiles.add(node.file);
      }
    }

    for (const node of dependencyGraph) {
      for (const imp of node.imports) {
        if (directImpactFiles.has(imp)) {
          impactedFiles.add(node.file);
        }
      }
    }

    return Array.from(impactedFiles);
  }

  public detectMentionedFiles(prompt: string, files: Record<string, string>): string[] {
    const lowerPrompt = prompt.toLowerCase();
    return Object.keys(files).filter(f => {
      const fileName = f.split('/').pop()?.toLowerCase() || "";
      return lowerPrompt.includes(f.toLowerCase()) || (fileName && lowerPrompt.includes(fileName));
    });
  }
}
