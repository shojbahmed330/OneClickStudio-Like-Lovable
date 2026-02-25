
import { useState, useRef, useEffect, useCallback } from 'react';
import { BuildStep, GithubConfig, ProjectConfig, User as UserType } from '../types';
import { GithubService } from '../services/githubService';

export interface BuildManager {
  buildStatus: {status: string; message: string; apkUrl: string; webUrl: string; runUrl: string};
  setBuildStatus: (s: {status: string; message: string; apkUrl: string; webUrl: string; runUrl: string}) => void;
  buildSteps: BuildStep[];
  setBuildSteps: (s: BuildStep[] | ((prev: BuildStep[]) => BuildStep[])) => void;
  isDownloading: boolean;
  setIsDownloading: (b: boolean) => void;
  githubConfig: GithubConfig;
  setGithubConfig: (config: GithubConfig) => void;
  handleBuildAPK: (onRedirect?: () => void) => Promise<void>;
  handleSecureDownload: () => Promise<void>;
}

export const useBuildManager = (
  user: UserType | null, 
  projectFilesRef: React.MutableRefObject<Record<string, string>>,
  projectConfig: ProjectConfig,
  addToast: (msg: string, type?: any) => void,
  handleSend: any
): BuildManager => {
  const [buildStatus, setBuildStatus] = useState<{status: string; message: string; apkUrl: string; webUrl: string; runUrl: string}>({ 
    status: 'idle', message: '', apkUrl: '', webUrl: '', runUrl: '' 
  });
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [githubConfig, setGithubConfigState] = useState<GithubConfig>(() => {
    const cached = localStorage.getItem('gh_config_cache');
    if (cached) return JSON.parse(cached);
    return { token: '', owner: '', repo: '' };
  });

  const github = useRef(new GithubService());

  const setGithubConfig = useCallback((config: GithubConfig) => {
    setGithubConfigState(config);
    localStorage.setItem('gh_config_cache', JSON.stringify(config));
  }, []);

  useEffect(() => {
    if (user) {
      const dbConfig = { 
        token: user.github_token || githubConfig.token || '', 
        owner: user.github_owner || githubConfig.owner || '', 
        repo: user.github_repo || githubConfig.repo || '' 
      };
      setGithubConfigState(dbConfig);
      localStorage.setItem('gh_config_cache', JSON.stringify(dbConfig));
    }
  }, [user]);

  const handleBuildAPK = async (onRedirect?: () => void) => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
      addToast("GitHub Infrastructure is not configured. Please setup in settings.", "error");
      onRedirect?.();
      return;
    }

    setBuildStatus({ status: 'pushing', message: 'Uplinking source code...', apkUrl: '', webUrl: '', runUrl: '' });
    setBuildSteps([{ name: 'Source Analysis', status: 'completed', conclusion: 'success' }, { name: 'Cloud Sync', status: 'in_progress', conclusion: null }]);

    try {
      await github.current.createRepo(githubConfig.token, githubConfig.repo);
      
      if (projectConfig.supabase_url && projectConfig.supabase_key) {
        setBuildStatus(prev => ({ ...prev, message: 'Syncing Database Secrets...' }));
        await github.current.setRepoSecret(githubConfig, 'SUPABASE_URL', projectConfig.supabase_url);
        await github.current.setRepoSecret(githubConfig, 'SUPABASE_KEY', projectConfig.supabase_key);
      }

      await github.current.pushToGithub(githubConfig, projectFilesRef.current, projectConfig);
      setBuildSteps(prev => prev.map(s => s.name === 'Cloud Sync' ? { ...s, status: 'completed', conclusion: 'success' } : s).concat([{ name: 'Build Engine Trigger', status: 'in_progress', conclusion: null }]));
      
      setBuildStatus(prev => ({ ...prev, status: 'building', message: 'Build Engine Initialized. Polling status...' }));
      
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const details = await github.current.getRunDetails(githubConfig);
        if (details) {
          const { run, jobs } = details;
          const mappedSteps: BuildStep[] = jobs.flatMap((j: any) => (j.steps || []).map((s: any) => ({
            name: s.name,
            status: s.status === 'completed' ? 'completed' : s.status === 'in_progress' ? 'in_progress' : 'queued',
            conclusion: s.conclusion as any
          })));
          setBuildSteps(mappedSteps);

          if (run.status === 'completed') {
            clearInterval(interval);
            if (run.conclusion === 'success') {
              const apk = await github.current.getLatestApk(githubConfig);
              setBuildStatus({ status: 'success', message: 'Compilation successful!', apkUrl: apk?.downloadUrl || '', webUrl: apk?.webUrl || '', runUrl: apk?.runUrl || '' });
              addToast("Build engine completed successfully!", "success");
            } else {
              setBuildStatus({ status: 'error', message: 'Build failed. Analyzing logs for auto-repair...', apkUrl: '', webUrl: '', runUrl: run.html_url });
              addToast("Build failed. Analyzing logs...", "error");
              
              const failedJob = jobs.find((j: any) => j.conclusion === 'failure');
              if (failedJob) {
                const logs = await github.current.getJobLogs(githubConfig, failedJob.id);
                if (logs) {
                  const buildErrorContext = `BUILD FAILURE DETECTED ON GITHUB ACTIONS:
Job: ${failedJob.name}
Logs Snippet:
${logs.slice(-2000)}

INSTRUCTION: Analyze the build logs above. Identify the cause of the failure (e.g., missing dependencies, syntax errors, configuration issues) and fix it. Update the necessary files and explain the fix.`;
                  
                  setTimeout(() => {
                    addToast("Build Feedback Loop: Triggering auto-repair...", "healing");
                    handleSend(buildErrorContext, true);
                  }, 2000);
                }
              }
            }
          }
        }
        if (attempts > 120) { 
          clearInterval(interval); 
          setBuildStatus({ status: 'error', message: 'Timeout polling build status.', apkUrl: '', webUrl: '', runUrl: '' }); 
        }
      }, 10000);
    } catch (e: any) {
      setBuildStatus({ status: 'error', message: e.message, apkUrl: '', webUrl: '', runUrl: '' });
      addToast(e.message, "error");
    }
  };

  const handleSecureDownload = async () => {
    if (!buildStatus.apkUrl) return;
    setIsDownloading(true);
    try {
      const blob = await github.current.downloadArtifact(githubConfig, buildStatus.apkUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectConfig.appName || 'app'}-build.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      addToast("Secure download failed: " + e.message, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    buildStatus, setBuildStatus,
    buildSteps, setBuildSteps,
    isDownloading, setIsDownloading,
    githubConfig, setGithubConfig,
    handleBuildAPK, handleSecureDownload
  };
};
