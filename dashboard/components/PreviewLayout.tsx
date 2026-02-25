
import React from 'react';
import ChatBox from './ChatBox';
import MobilePreview from './MobilePreview';
import { MobileControls, DesktopBuildButton } from './DashboardControls';
import { AppMode } from '../../types';

interface PreviewLayoutProps {
  props: any;
}

const PreviewLayout: React.FC<PreviewLayoutProps> = ({ props }) => {
  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative bg-[#09090b]">
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        <ChatBox 
          messages={props.messages} 
          input={props.input} 
          setInput={props.setInput} 
          isGenerating={props.isGenerating} 
          handleSend={props.handleSend} 
          handleStop={props.handleStop}
          currentAction={props.currentAction}
          mobileTab={props.mobileTab} 
          selectedImage={props.selectedImage} 
          setSelectedImage={props.setSelectedImage}
          handleImageSelect={props.handleImageSelect}
          executionQueue={props.executionQueue}
          waitingForApproval={props.waitingForApproval}
          phase={props.phase}
          builderStatuses={props.builderStatuses}
        />
        <MobilePreview 
          projectFiles={props.previewOverride || props.projectFiles} 
          workspace={props.workspace}
          setWorkspace={props.setWorkspace}
          setMode={props.setMode} 
          handleBuildAPK={props.handleBuildAPK} mobileTab={props.mobileTab}
          isGenerating={props.isGenerating}
          projectConfig={props.projectConfig}
          projectId={props.projectId}
          runtimeError={props.runtimeError}
          onAutoFix={props.handleAutoFix}
          isRepairing={props.isRepairing}
          repairSuccess={props.repairSuccess}
        />
      </div>
      <MobileControls 
        mobileTab={props.mobileTab} 
        setMobileTab={props.setMobileTab} 
        workspace={props.workspace}
        setWorkspace={props.setWorkspace}
        handleBuildAPK={props.handleBuildAPK}
        onOpenConfig={() => props.setMode(AppMode.CONFIG)}
        onOpenHistory={() => { props.setMode(AppMode.EDIT); props.setShowHistory(true); }}
        onOpenHelp={() => props.setMode(AppMode.HELP)}
        isGenerating={props.isGenerating}
      />
      <DesktopBuildButton onClick={props.handleBuildAPK} />
    </div>
  );
};

export default PreviewLayout;
