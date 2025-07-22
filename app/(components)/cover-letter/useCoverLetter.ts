import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase/helpers/client';
import { CoverLetterInputs } from './schema';

interface UseCoverLetterReturn {
  data: Partial<CoverLetterInputs>;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
  updateData: (updates: Partial<CoverLetterInputs>) => void;
  saveData: () => Promise<void>;
  markCompleted: () => Promise<void>;
  reset: () => void;
}

export function useCoverLetter(loanPackagingId: string | null): UseCoverLetterReturn {
  const [data, setData] = useState<Partial<CoverLetterInputs>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Debounced save functionality
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<CoverLetterInputs>>({});
  const isSavingRef = useRef(false);

  // Load initial data from Supabase
  const loadData = useCallback(async () => {
    if (!loanPackagingId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: loanData, error: loadError } = await supabase
        .from('loan_packaging')
        .select('cover_letter_inputs, cover_letter_completed')
        .eq('id', loanPackagingId)
        .single();

      if (loadError) {
        console.error('[useCoverLetter] Error loading data:', loadError);
        throw loadError;
      }

      if (loanData) {
        const inputs = loanData.cover_letter_inputs as Partial<CoverLetterInputs> || {};
        setData(inputs);
        setIsCompleted(loanData.cover_letter_completed || false);
        console.log('[useCoverLetter] Loaded data:', inputs, 'completed:', loanData.cover_letter_completed);
      }
    } catch (err) {
      console.error('[useCoverLetter] Error in loadData:', err);
      setError('Failed to load cover letter data');
    } finally {
      setIsLoading(false);
    }
  }, [loanPackagingId]);

  // Load data on mount and when loanPackagingId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced save to Supabase
  const debouncedSave = useCallback(async () => {
    if (!loanPackagingId || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      const updatesToSave = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};

      console.log('[useCoverLetter] Saving updates to Supabase:', updatesToSave);

      const { error: saveError } = await supabase
        .from('loan_packaging')
        .update({
          cover_letter_inputs: updatesToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanPackagingId);

      if (saveError) {
        console.error('[useCoverLetter] Error saving data:', saveError);
        throw saveError;
      }

      console.log('[useCoverLetter] Successfully saved data');
      setError(null);
    } catch (err) {
      console.error('[useCoverLetter] Error in debouncedSave:', err);
      setError('Failed to save data');
    } finally {
      isSavingRef.current = false;
    }
  }, [loanPackagingId]);

  // Update data with debounced save
  const updateData = useCallback((updates: Partial<CoverLetterInputs>) => {
    setData(prevData => {
      const newData = { ...prevData, ...updates };
      pendingUpdatesRef.current = newData;
      return newData;
    });

    // Clear existing timeout and set new one
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave();
    }, 1000); // 1 second debounce
  }, [debouncedSave]);

  // Immediate save (for manual saves)
  const saveData = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await debouncedSave();
  }, [debouncedSave]);

  // Mark as completed
  const markCompleted = useCallback(async () => {
    if (!loanPackagingId) return;

    try {
      // First save any pending data
      await saveData();

      // Then mark as completed
      const { error: completeError } = await supabase
        .from('loan_packaging')
        .update({
          cover_letter_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanPackagingId);

      if (completeError) {
        console.error('[useCoverLetter] Error marking completed:', completeError);
        throw completeError;
      }

      setIsCompleted(true);
      console.log('[useCoverLetter] Marked cover letter as completed');
    } catch (err) {
      console.error('[useCoverLetter] Error in markCompleted:', err);
      setError('Failed to mark cover letter as completed');
      throw err;
    }
  }, [loanPackagingId, saveData]);

  // Reset data
  const reset = useCallback(() => {
    setData({});
    setIsCompleted(false);
    setError(null);
    pendingUpdatesRef.current = {};
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isCompleted,
    updateData,
    saveData,
    markCompleted,
    reset
  };
}
