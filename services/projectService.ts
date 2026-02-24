
import { supabase } from './supabaseClient';
import { Project, ProjectConfig } from '../types';

export interface ProjectHistoryItem {
  id: string;
  project_id: string;
  files: Record<string, string>;
  message: string;
  created_at: string;
}

export const projectService = {
  async getProjects(userId: string): Promise<Project[]> {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return data || [];
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
    return data;
  },

  async deleteProject(userId: string, projectId: string) {
    // Attempt to delete history, but don't let it block project deletion if it fails
    try {
      await supabase.from('project_history').delete().eq('project_id', projectId);
    } catch (e) {
      console.warn("Could not clear project history:", e);
    }
    
    const { error } = await supabase.from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);
      
    if (error) {
      console.error("Project delete error:", error);
      throw new Error(error.message || "Failed to delete project from cloud.");
    }
    return true;
  },

  async saveProject(userId: string, name: string, files: Record<string, string>, config?: ProjectConfig) {
    const { data, error } = await supabase.from('projects').insert({ 
      user_id: userId, 
      name, 
      files, 
      config,
      messages: [] // Start with empty history for new projects
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateProject(userId: string, projectId: string, files: Record<string, string>, config?: ProjectConfig) {
    await supabase.from('projects').update({ files, config, updated_at: new Date().toISOString() }).eq('id', projectId).eq('user_id', userId);
  },

  async renameProject(userId: string, projectId: string, newName: string) {
    await supabase.from('projects').update({ name: newName, updated_at: new Date().toISOString() }).eq('id', projectId).eq('user_id', userId);
  },

  async createProjectSnapshot(projectId: string, files: Record<string, string>, message: string) {
    const { data, error } = await supabase.from('project_history').insert({ project_id: projectId, files, message }).select().single();
    if (error) throw error;
    return data;
  },

  async getProjectHistory(projectId: string): Promise<ProjectHistoryItem[]> {
    const { data } = await supabase.from('project_history').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    return data || [];
  },

  async deleteProjectSnapshot(snapshotId: string) {
    const { error } = await supabase.from('project_history').delete().eq('id', snapshotId);
    if (error) throw error;
  }
};
