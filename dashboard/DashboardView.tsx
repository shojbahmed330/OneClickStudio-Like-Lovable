
import React from 'react';
import { AppMode, BuildStep, ProjectConfig, BuilderPhase } from '../types';
import PreviewLayout from './components/PreviewLayout';
import EditorLayout from './components/EditorLayout';
import AppConfigView from './components/AppConfigView';

interface DashboardViewProps {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  messages: any[];
  input: string;
  setInput: (s: string) => void;
  isGenerating: boolean;
  projectFiles: Record<string, string>;
  setProjectFiles: (files: any) => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  buildStatus: { status: string; message: string; apkUrl?: string; webUrl?: string };
  setBuildStatus: (s: any) => void;
  buildSteps: BuildStep[];
  mobileTab: 'chat' | 'preview';
  setMobileTab: (t: 'chat' | 'preview') => void;
  handleSend: () => void;
  handleBuildAPK: () => void;
  handleSecureDownload: () => void;
  isDownloading: boolean;
  selectedImage: any;
  setSelectedImage: (img: any) => void;
  handleImageSelect: (file: File) => void;
  projectConfig: ProjectConfig;
  setProjectConfig: (config: ProjectConfig) => void;
  projectId?: string | null;
  phase: BuilderPhase;
  builderStatuses: any[];
  runtimeError: { message: string; line: number; source: string } | null;
  isRepairing: boolean;
  repairSuccess: boolean;
  handleAutoFix: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = (props) => {
  if (props.mode === AppMode.PREVIEW) {
    return <PreviewLayout props={props} />;
  }

  if (props.mode === AppMode.CONFIG) {
    return (
      <AppConfigView 
        config={props.projectConfig} 
        onUpdate={props.setProjectConfig} 
        onBack={() => props.setMode(AppMode.PREVIEW)} 
      />
    );
  }

  return <EditorLayout props={props} />;
};

export default DashboardView;
