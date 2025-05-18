import { State } from '@/types/state';

const STORAGE_KEY = 'loan_purpose_state';

export const saveState = (state: State): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

export const loadState = (): State | null => {
  try {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return null;
};

export const clearState = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error clearing state:', error);
  }
};
