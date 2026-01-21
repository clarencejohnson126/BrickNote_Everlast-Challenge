'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/types';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('bricknote_projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string) => {
    if (!userId) return { error: new Error('Not authenticated') };

    try {
      const { data, error: createError } = await supabase
        .from('bricknote_projects')
        .insert({ name, user_id: userId })
        .select()
        .single();

      if (createError) throw createError;

      setProjects((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to create project'),
      };
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('bricknote_projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Failed to delete project'),
      };
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    deleteProject,
    refresh: fetchProjects,
  };
}
