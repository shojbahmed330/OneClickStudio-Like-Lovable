
import { GithubConfig, ProjectConfig } from "../types";
import { WORKFLOW_YAML } from "./github/workflow";
import { toBase64 } from "./github/utils";
import { buildFinalHtml } from "../utils/previewBuilder";
import sodium from 'libsodium-wrappers';

export class GithubService {
  async setRepoSecret(config: GithubConfig, name: string, value: string) {
    const { token, owner, repo } = config;
    const headers = { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json' 
    };

    // 1. Get public key
    const keyRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, { headers });
    if (!keyRes.ok) throw new Error("Failed to get GitHub public key.");
    const { key_id, key } = await keyRes.json();

    // 2. Encrypt the secret
    await sodium.ready;
    const binKey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const binSec = sodium.from_string(value);
    const encSec = sodium.crypto_box_seal(binSec, binKey);
    const output = sodium.to_base64(encSec, sodium.base64_variants.ORIGINAL);

    // 3. Update secret
    await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${name}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        encrypted_value: output,
        key_id: key_id
      })
    });
  }

  async createRepo(token: string, repoName: string): Promise<string> {
    const headers = { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    
    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) throw new Error("GitHub authentication failed.");
    const userData = await userRes.json();
    const username = userData.login;
    
    const checkRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
    
    if (!checkRes.ok) {
      await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: repoName, private: false, auto_init: true })
      });
      await new Promise(r => setTimeout(r, 4000));
      
      try {
        await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ build_type: 'workflow' })
        });
      } catch (e) {
        console.warn("Could not auto-enable Pages.");
      }
    }

    return username;
  }

  async pushToGithub(config: GithubConfig, files: Record<string, string>, appConfig?: ProjectConfig, customMessage?: string) {
    const { token, owner, repo } = config;
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };

    let sanitizedAppId = (appConfig?.packageName || 'com.oneclick.studio').toLowerCase().replace(/[^a-z0-9.]/g, '');
    const capConfig = { appId: sanitizedAppId, appName: appConfig?.appName || 'OneClickApp', webDir: 'www' };
    
    // CRITICAL: Isolate App workspace from Admin workspace during bundling
    const appOnlyFiles = Object.fromEntries(
        Object.entries(files).filter(([path]) => path.startsWith('app/') || !path.includes('/'))
    );

    const entryPath = files['app/index.html'] ? 'app/index.html' : 'index.html';
    const bundledAppHtml = buildFinalHtml(appOnlyFiles, entryPath, appConfig);
    
    const allFiles: Record<string, string> = { ...files };
    
    // We no longer overwrite app/index.html with a bundled version.
    // This ensures the GitHub repository remains modular as requested by the user.
    // The GitHub Action will handle the environment injection.
    
    allFiles['capacitor.config.json'] = JSON.stringify(capConfig, null, 2);

    if (appConfig?.icon) allFiles['assets/icon-only.png'] = appConfig.icon;
    if (appConfig?.keystore_base64) allFiles['android/app/release-key.jks'] = appConfig.keystore_base64;

    const filePaths = Object.keys(allFiles);
    
    for (const path of filePaths) {
      const content = allFiles[path];
      const isBinary = content.startsWith('data:') || path.startsWith('assets/') || path.endsWith('.jks');
      const finalContent = isBinary ? content.split(',')[1] || content : toBase64(content);

      const getRes = await fetch(`${baseUrl}/contents/${path}`, { headers });
      let sha: string | undefined;
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      await fetch(`${baseUrl}/contents/${path}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${customMessage || "Production Bundle"} [${path}]`, content: finalContent, sha })
      });
    }

    const workflowPath = '.github/workflows/android.yml';
    const getWorkflowRes = await fetch(`${baseUrl}/contents/${workflowPath}`, { headers });
    let workflowSha: string | undefined;
    if (getWorkflowRes.ok) {
      const data = await getWorkflowRes.json();
      workflowSha = data.sha;
    }

    let finalWorkflow = WORKFLOW_YAML;
    if (appConfig?.keystore_base64) {
        finalWorkflow = finalWorkflow
            .replace('SIGNING_STORE_PASSWORD: ""', `SIGNING_STORE_PASSWORD: "${appConfig.keystore_password}"`)
            .replace('SIGNING_KEY_ALIAS: ""', `SIGNING_KEY_ALIAS: "${appConfig.key_alias}"`)
            .replace('SIGNING_KEY_PASSWORD: ""', `SIGNING_KEY_PASSWORD: "${appConfig.key_password}"`);
    }

    await fetch(`${baseUrl}/contents/${workflowPath}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: `Uplink Build Engine [${workflowPath}]`, 
        content: toBase64(finalWorkflow), 
        sha: workflowSha 
      })
    });
  }

  async getRunDetails(config: GithubConfig) {
    const headers = { 'Authorization': `token ${config.token}`, 'Accept': 'application/vnd.github.v3+json' };
    try {
      const runsRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs?per_page=1`, { headers });
      if (!runsRes.ok) return null;
      const data = await runsRes.json();
      const latestRun = data.workflow_runs?.[0];
      if (!latestRun) return null;

      const jobsRes = await fetch(latestRun.jobs_url, { headers });
      const jobsData = await jobsRes.json();
      return { run: latestRun, jobs: jobsData.jobs || [] };
    } catch (e) { return null; }
  }

  async getLatestApk(config: GithubConfig) {
    const details = await this.getRunDetails(config);
    if (!details || details.run.status !== 'completed') return null;

    const headers = { 'Authorization': `token ${config.token}`, 'Accept': 'application/vnd.github.v3+json' };
    const artifactsRes = await fetch(details.run.artifacts_url, { headers });
    const data = await artifactsRes.json();
    
    const apk = data.artifacts?.find((a: any) => a.name === 'app-debug' || a.name === 'app-release');
    
    return { 
      downloadUrl: apk?.archive_download_url, 
      webUrl: `https://${config.owner}.github.io/${config.repo}/`,
      runUrl: details.run.html_url
    };
  }

  async getJobLogs(config: GithubConfig, jobId: number): Promise<string | null> {
    const headers = { 'Authorization': `token ${config.token}`, 'Accept': 'application/vnd.github.v3+json' };
    try {
      const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/actions/jobs/${jobId}/logs`, { headers });
      if (!res.ok) return null;
      return await res.text();
    } catch (e) { return null; }
  }

  async downloadArtifact(config: GithubConfig, url: string) {
    const res = await fetch(url, { headers: { 'Authorization': `token ${config.token}` } });
    if (!res.ok) throw new Error("Download failed.");
    return await res.blob();
  }
}
