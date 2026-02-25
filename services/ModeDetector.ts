
import { GenerationMode } from "../types";

export class ModeDetector {
  public static detectMode(prompt: string, currentFiles: Record<string, string>): GenerationMode {
    const p = prompt.toLowerCase();
    const hasFiles = Object.keys(currentFiles).length > 0;

    if (!hasFiles) return GenerationMode.SCAFFOLD;
    if (p.includes('fix') || p.includes('error') || p.includes('bug') || p.includes('failed')) return GenerationMode.FIX;
    if (p.includes('optimize') || p.includes('performance') || p.includes('speed up')) return GenerationMode.OPTIMIZE;
    return GenerationMode.EDIT;
  }
}
