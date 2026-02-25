
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, WorkspaceType, AIProvider, GenerationMode, GenerationResult } from "../types";

const BASE_ROLE = `You are a "Lovable-style" Autonomous AI Full-Stack App Builder.
Your goal is to build 100% COMPLETE, functional, and production-ready MOBILE APPLICATIONS with separate WEB ADMIN DASHBOARDS and shared DATABASES.`;

const DEEP_THINKING = `### 🧠 DEEP THINKING PROTOCOL (MANDATORY):
Before generating any code, you MUST use the "thought" field to perform a deep analysis:
1. **LOGICAL BREAKDOWN:** Explain the step-by-step logic of how the requested feature will work.
2. **MODULAR STRATEGY:** Explain why you are choosing specific files and folders for this implementation.
3. **ERROR ANTICIPATION:** Identify at least 3 potential errors or edge cases that could occur with this implementation and explain how you will prevent them.
4. **DATABASE SYNC:** Explain how the data will stay synchronized between the Mobile App and the Admin Dashboard.
5. **UI/UX REASONING:** Explain the design choices for both interfaces to ensure they are professional and user-friendly.`;

const UNIT_TESTING = `### 🧪 UNIT TESTING PROTOCOL (MANDATORY):
For any complex logic, services, or utility functions:
1. **TEST GENERATION:** You MUST create a \`tests/\` directory INSIDE the workspace (e.g., \`app/tests/\` or \`admin/tests/\`) and write unit tests using a simple assertion pattern (e.g., \`if (result !== expected) throw new Error(...)\`).
2. **CRITICAL LOGIC COVERAGE:** Focus on edge cases, data transformations, and database interactions.
3. **SELF-VERIFICATION:** Explain in your "thought" process how these tests verify the correctness of your code.`;

const DEPENDENCY_GRAPH = `### 🧠 DEPENDENCY GRAPH & MEMORY (MANDATORY):
You MUST track and respect the relationship between files:
1. **FLOW:** Component -> Service -> Database.
2. **IMPACT ANALYSIS:** If you change a Database table, you MUST update the corresponding Service and then the Component.
3. **IMPORT CHECK:** Always verify that imports are correct and the file exists in the PROJECT MAP.`;

const SURGICAL_EDITING = `### ✂️ SURGICAL EDITING & MIGRATION (STRICT):
1. **MINIMAL CHANGES:** Only change the specific lines required.
2. **DATABASE MIGRATIONS:** If the database schema changes, do NOT overwrite \`database.sql\`. Instead, create a new file \`migrations/YYYYMMDD_description.sql\`.
3. **NO DELETIONS:** Never delete existing features unless explicitly asked.`;

const MANDATORY_RULES = `### 🛠 MANDATORY RULES:
1. **MANDATORY TYPESCRIPT ENFORCEMENT (CRITICAL):**
   - You MUST use **TypeScript** for ALL logic and component files.
   - Avoid using \`any\`. Use strict typing.

2. **MODULAR CODE ARCHITECTURE:**
   - Break down code into small, manageable files.
   - Folder structure: \`components/\`, \`hooks/\`, \`services/\`, \`utils/\`, \`styles/\`.

3. **SMART ADMIN DETECTION:**
   - Create an \`admin/\` dashboard ONLY if the app requires:
     - Multi-user management.
     - Content/Inventory management.
     - Order/Transaction tracking.
   - Otherwise, stick to a single \`app/\` interface.

4. **HALLUCINATION GUARD:**
   - ONLY use packages already listed in \`package.json\`.
   - If a new package is absolutely necessary, you MUST add it to the \`dependencies\` section of \`package.json\` in the same response.

5. **STRICT DIRECTORY ENFORCEMENT:**
   - **Mobile App:** \`app/\`.
   - **Admin Dashboard:** \`admin/\`.
   - **Root:** ONLY \`database.sql\`, \`migrations/\`, \`package.json\`, \`README.md\`.`;

const DESIGN_SYSTEM = `### 🎨 MANDATORY DESIGN SYSTEM (STRICT):
1. **COLOR PALETTE:** Primary: Emerald (#10b981), Secondary: Slate (#64748b), Background: White/Stone-50, Text: Zinc-900/600.
2. **SPACING & RADIUS:** Use Tailwind scale. \`rounded-xl\` for cards/buttons, \`rounded-2xl\` for containers.
3. **TYPOGRAPHY:** Inter font. Headings: semibold, tracking-tight. Body: normal, leading-relaxed.`;

const PATCH_MODE_RULE = `### 🔧 PATCH MODE (WHEN EDITING EXISTING FILES):
If the file already exists in the PROJECT MAP:
- DO NOT return the full file.
- Return ONLY a unified diff patch format.
- Use standard unified diff format:

Example:
--- app/components/Button.tsx
+++ app/components/Button.tsx
@@ -12,7 +12,7 @@
- const color = "red";
+ const color = "blue";

If creating a NEW file:
- Return full file normally.`;

const RESPONSE_FORMAT = `### 🚀 RESPONSE FORMAT (JSON ONLY):
{
  "thought": "DETAILED DEEP THINKING ANALYSIS (Logic, Strategy, Errors, Sync, UI/UX) in the User's language.",
  "questions": [], 
  "plan": ["Step 1...", "Step 2..."],
  "answer": "Summary of changes.",
  "files": { 
    "app/components/NewComponent.tsx": "...",
    "migrations/20240224_add_field.sql": "..."
  }
}`;

const PLANNING_PROMPT = `You are the "Architect Model". Your task is to create a detailed technical plan for the requested feature.
Focus on:
1. Database schema changes.
2. File structure and modularity.
3. Logic flow between App and Admin.
4. Potential edge cases.
Output ONLY a JSON object with "thought" and "plan" (array of steps).`;

const CODING_PROMPT = `You are the "Developer Model". Your task is to implement the provided technical plan.
Follow the plan strictly. Use TypeScript and maintain modularity.
Output ONLY a JSON object with "answer" and "files" (Record<string, string>).`;

const REVIEW_PROMPT = `You are the "Reviewer Model". Your task is to review the generated code for errors, bugs, or missing logic.
If you find issues, provide the corrected files.
Output ONLY a JSON object with "thought" (review findings) and "files" (only if corrections are needed).`;

const OPTIMIZATION_PROMPT = `You are the "Security Model". Your task is to ensure the code follows security best practices.
Check for:
1. SQL injection vulnerabilities.
2. Proper authentication/authorization checks.
3. Sensitive data exposure.
4. Secure API communication.
Output ONLY a JSON object with "thought" (security findings) and "files" (only if changes are needed).`;

const PERFORMANCE_PROMPT = `You are the "Performance Audit Model". Your task is to ensure the code is highly performant and free of memory leaks.
Check for:
1. Memory leaks (uncleaned useEffects, event listeners).
2. Unnecessary React re-renders (missing memo, useMemo, useCallback).
3. Heavy computations in the main thread.
4. Efficient data fetching and caching.
Output ONLY a JSON object with "thought" (performance findings) and "files" (only if changes are needed).`;

const UI_UX_PROMPT = `You are the "UI/UX Designer Model". Your task is to ensure the code strictly follows the MANDATORY DESIGN SYSTEM.
Check for:
1. Consistent color usage (Emerald/Slate/Zinc).
2. Consistent border radius (rounded-xl/2xl).
3. Proper spacing and alignment.
4. Professional typography (Inter).
Output ONLY a JSON object with "thought" (design findings) and "files" (only if changes are needed).`;

export class GeminiService {
  private isLocalModel(modelName: string): boolean {
    const name = modelName.toLowerCase();
    return name.includes('local') || name.includes('llama') || name.includes('qwen') || name.includes('coder');
  }

  async callPhase(
    phase: 'planning' | 'coding' | 'review' | 'security' | 'performance' | 'uiux',
    input: string,
    modelName: string = 'gemini-3-flash-preview'
  ): Promise<any> {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key || key === "undefined") throw new Error("GEMINI_API_KEY not found.");

    const ai = new GoogleGenAI({ apiKey: key });
    const model = modelName.includes('pro') ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    let systemInstruction = '';
    switch (phase) {
      case 'planning': 
        systemInstruction = `${BASE_ROLE}\n\n${DEEP_THINKING}\n\n${DEPENDENCY_GRAPH}\n\n${MANDATORY_RULES}\n\n${PLANNING_PROMPT}\n\n${RESPONSE_FORMAT}`; 
        break;
      case 'coding': 
        systemInstruction = `${BASE_ROLE}\n\n${DEEP_THINKING}\n\n${UNIT_TESTING}\n\n${DEPENDENCY_GRAPH}\n\n${SURGICAL_EDITING}\n\n${PATCH_MODE_RULE}\n\n${MANDATORY_RULES}\n\n${DESIGN_SYSTEM}\n\n${CODING_PROMPT}\n\n${RESPONSE_FORMAT}`; 
        break;
      case 'review': 
        systemInstruction = `${BASE_ROLE}\n\n${SURGICAL_EDITING}\n\n${PATCH_MODE_RULE}\n\n${REVIEW_PROMPT}\n\n${RESPONSE_FORMAT}`; 
        break;
      case 'security': 
        systemInstruction = `${BASE_ROLE}\n\n${SURGICAL_EDITING}\n\n${PATCH_MODE_RULE}\n\n${OPTIMIZATION_PROMPT}\n\n${RESPONSE_FORMAT}`; 
        break;
      case 'performance': 
        systemInstruction = `${BASE_ROLE}\n\n${SURGICAL_EDITING}\n\n${PATCH_MODE_RULE}\n\n${PERFORMANCE_PROMPT}\n\n${RESPONSE_FORMAT}`; 
        break;
      case 'uiux': 
        systemInstruction = `${BASE_ROLE}\n\n${DESIGN_SYSTEM}\n\n${SURGICAL_EDITING}\n\n${PATCH_MODE_RULE}\n\n${UI_UX_PROMPT}\n\n${RESPONSE_FORMAT}`; 
        break;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: input }] }],
      config: { systemInstruction, responseMimeType: "application/json", temperature: 0.1 }
    });

    return JSON.parse(response.text || '{}');
  }

  async generateWebsite(
    prompt: string, 
    currentFiles: Record<string, string> = {}, 
    history: ChatMessage[] = [],
    image?: { data: string; mimeType: string },
    activeWorkspace?: WorkspaceType | boolean,
    modelName: string = 'gemini-3-flash-preview'
  ): Promise<GenerationResult> {
    const contextText = this.buildContextString(prompt, currentFiles, activeWorkspace, { appName: 'App', packageName: 'com.app' });

    if (this.isLocalModel(modelName)) {
      return this.generateWithOllama(modelName, contextText, history);
    }

    const plan = await this.callPhase('planning', `USER REQUEST: ${prompt}\n\nCONTEXT:\n${contextText}`, modelName);
    const code = await this.callPhase('coding', `PLAN:\n${JSON.stringify(plan.plan)}\n\nCONTEXT:\n${contextText}`, modelName);
    
    return {
      thought: plan.thought,
      plan: plan.plan,
      answer: code.answer,
      files: code.files
    };
  }

  async *generateWebsiteStream(
    prompt: string, 
    currentFiles: Record<string, string> = {}, 
    history: ChatMessage[] = [],
    image?: { data: string; mimeType: string },
    projectConfig?: any,
    activeWorkspace?: WorkspaceType,
    modelName: string = 'gemini-3-flash-preview',
    signal?: AbortSignal
  ): AsyncIterable<string> {
    if (signal?.aborted) throw new Error("AbortError");
    yield "Thinking...";
    const result = await this.generateWebsite(prompt, currentFiles, history, image, activeWorkspace, modelName);
    yield JSON.stringify(result);
  }

  private buildContextString(prompt: string, currentFiles: Record<string, string>, activeWorkspace?: WorkspaceType | boolean, projectConfig?: any): string {
    const fullProjectMap: string[] = Object.keys(currentFiles);
    let configContext = '';
    if (projectConfig) {
      configContext = `\n\nPROJECT CONFIGURATION:\n- App Name: ${projectConfig.appName}\n- Package Name: ${projectConfig.packageName}`;
    }
    return `PROJECT MAP (FILES IN WORKSPACE):\n${fullProjectMap.join('\n')}\n\nCURRENT SOURCE CONTENT:\n${JSON.stringify(currentFiles)}\n\nUSER DIRECTIVE: ${prompt}${configContext}`;
  }

  private async generateWithOllama(model: string, prompt: string, history: ChatMessage[]): Promise<GenerationResult> {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `${BASE_ROLE}\n\n${DEEP_THINKING}\n\n${UNIT_TESTING}\n\n${DEPENDENCY_GRAPH}\n\n${SURGICAL_EDITING}\n\n${MANDATORY_RULES}\n\n${DESIGN_SYSTEM}\n\n${RESPONSE_FORMAT}` },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: prompt }
        ],
        stream: false,
        format: 'json'
      })
    });
    const data = await response.json();
    return JSON.parse(data.message.content);
  }
}
