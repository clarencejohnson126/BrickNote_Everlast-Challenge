'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { VoiceEntry, Language, DefectData } from '@/lib/types';

export function useVoiceEntries(userId: string | undefined) {
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('bricknote_voice_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setEntries(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async (entry: {
    project_id: string | null;
    language: Language;
    transcript_raw: string;
    diary_markdown: string;
    defect_markdown: string;
    defect_json: DefectData | null;
    meta?: Record<string, unknown>;
  }) => {
    if (!userId) return { error: new Error('Not authenticated') };

    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };

    try {
      const { data, error: createError } = await supabase
        .from('bricknote_voice_entries')
        .insert({ ...entry, user_id: userId })
        .select()
        .single();

      if (createError) throw createError;

      setEntries((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to create entry'),
      };
    }
  };

  const deleteEntry = async (entryId: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase not configured') };

    try {
      const { error: deleteError } = await supabase
        .from('bricknote_voice_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Failed to delete entry'),
      };
    }
  };

  const fetchPreviousEntriesForProject = useCallback(
    async (projectId: string | null, limit: number = 10) => {
      if (!userId || !projectId) {
        return { data: [], error: null };
      }

      const supabase = getSupabase();
      if (!supabase) return { data: [], error: new Error('Supabase not configured') };

      try {
        const { data, error: fetchError } = await supabase
          .from('bricknote_voice_entries')
          .select('created_at, diary_markdown, defect_markdown')
          .eq('user_id', userId)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        return {
          data: data || [],
          error: null,
        };
      } catch (err) {
        return {
          data: [],
          error: err instanceof Error ? err : new Error('Failed to fetch previous entries'),
        };
      }
    },
    [userId]
  );

  return {
    entries,
    loading,
    error,
    createEntry,
    deleteEntry,
    refresh: fetchEntries,
    fetchPreviousEntriesForProject,
  };
}
