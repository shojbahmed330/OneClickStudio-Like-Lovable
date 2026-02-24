
import { AIController } from './controller';
import { ChatMessage } from '../types';

export class SelfHealingService {
  private controller = new AIController();

  async fixError(
    error: { message: string; line: number; source: string; stack?: string },
    projectFiles: Record<string, string>,
    history: ChatMessage[] = []
  ) {
    // Attempt to find the specific file content based on source name
    const sourceFile = Object.keys(projectFiles).find(f => f.endsWith(error.source)) || 'app/index.html';
    const fileContent = projectFiles[sourceFile];

    const repairPrompt = `
      CRITICAL SYSTEM ERROR DETECTED IN WORKSPACE:
      - Error: "${error.message}"
      - File: "${sourceFile}"
      - Line: ${error.line}
      - Stack Trace: ${error.stack || 'No stack provided'}

      INSTRUCTION:
      Analyzing the current code of "${sourceFile}":
      --- START CODE ---
      ${fileContent}
      --- END CODE ---

      Identify the cause of the error (e.g., missing variable, syntax error, or bad reference) and FIX it.
      Return the updated files in the standard JSON format. ONLY return the fixed files. 
      In the "answer" field, explain what you fixed in 1 short sentence.
    `;

    return await this.controller.processRequest(
      repairPrompt,
      projectFiles,
      history,
      false
    );
  }
}
