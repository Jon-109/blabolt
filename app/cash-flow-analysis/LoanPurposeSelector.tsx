import React, { useReducer, useCallback, useMemo, useEffect } from 'react';
import styles from './LoanPurposeSelector.module.css';
import { PurposeSelection, LoanPurpose } from './loan-types';
import { loanPurposes } from './data/loanPurposes';
import CategoryCard from './components/CategoryCard';
import SubcategoryCard from './components/SubcategoryCard';
import CustomPurposeInput from './components/CustomPurposeInput';
import { trackLoanPurposeEvent } from './utils/analytics';
import { saveState, loadState, clearState } from './utils/storage';
import { State } from '@/types/state';

type Action =
  | { type: 'SELECT_CATEGORY'; payload: string }
  | { type: 'SELECT_SUBCATEGORY'; payload: string }
  | { type: 'UPDATE_CUSTOM_PURPOSE'; payload: string }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOAD_STATE'; payload: State };

// Initial state
const initialState: State = {
  selectedCategory: null,
  selectedSubcategory: null,
  customPurpose: '',
  error: null,
};

// Reducer function
const reducer = (state: State, action: Action): State => {
  let newState: State;
  
  switch (action.type) {
    case 'SELECT_CATEGORY':
      newState = {
        ...state,
        selectedCategory: action.payload,
        selectedSubcategory: null,
        error: null,
      };
      break;
    case 'SELECT_SUBCATEGORY':
      newState = {
        ...state,
        selectedSubcategory: action.payload,
        error: null,
      };
      break;
    case 'UPDATE_CUSTOM_PURPOSE':
      newState = {
        ...state,
        customPurpose: action.payload,
        error: action.payload.length > 500 ? 'Description must be 500 characters or less' : null,
      };
      break;
    case 'RESET':
      newState = initialState;
      break;
    case 'SET_ERROR':
      newState = {
        ...state,
        error: action.payload,
      };
      break;
    case 'LOAD_STATE':
      newState = action.payload;
      break;
    default:
      return state;
  }

  // Save state to localStorage after each update
  saveState(newState);
  return newState;
};

interface LoanPurposeSelectorProps {
  onPurposeSelect: (selection: PurposeSelection) => void;
}

const LoanPurposeSelector: React.FC<LoanPurposeSelectorProps> = ({ onPurposeSelect }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadState();
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
      
      // If there was a previous selection, notify the parent
      if (savedState.selectedCategory) {
        const category = loanPurposes[savedState.selectedCategory];
        if (category) {
          const subcategory = savedState.selectedSubcategory ? 
            category.subcategories?.[savedState.selectedSubcategory] ?? null : 
            null;

          if (subcategory) {
            onPurposeSelect({
              category: category.title,
              subcategory,
              custom: null,
            });
          } else if (savedState.selectedCategory === 'other') {
            onPurposeSelect({
              category: category.title,
              subcategory: null,
              custom: savedState.customPurpose,
            });
          } else if (!category.subcategories) {
            onPurposeSelect({
              category: category.title,
              subcategory: null,
              custom: null,
            });
          }
        }
      }
    }
  }, [onPurposeSelect]);

  // Memoize category entries
  const categoryEntries = useMemo(() => Object.entries(loanPurposes), []);

  // Memoize subcategory entries
  const subcategoryEntries = useMemo(() => {
    if (!state.selectedCategory) return [];
    const category = loanPurposes[state.selectedCategory];
    if (!category?.subcategories) return [];
    return Object.entries(category.subcategories);
  }, [state.selectedCategory]);

  const handleCategorySelect = useCallback((category: string): void => {
    dispatch({ type: 'SELECT_CATEGORY', payload: category });
    trackLoanPurposeEvent({ action: 'select_category', category });
    
    const selectedCategory = loanPurposes[category];
    if (selectedCategory && !selectedCategory.subcategories) {
      onPurposeSelect({
        category: selectedCategory.title,
        subcategory: null,
        custom: category === 'other' ? state.customPurpose : null,
      });
    }
  }, [state.customPurpose, onPurposeSelect]);

  const handleSubcategorySelect = useCallback((subcategory: string): void => {
    dispatch({ type: 'SELECT_SUBCATEGORY', payload: subcategory });
    
    if (state.selectedCategory) {
      const category = loanPurposes[state.selectedCategory];
      if (!category) return;
      
      const subcategoryValue = category.subcategories?.[subcategory] ?? null;
      
      if (subcategoryValue) {
        trackLoanPurposeEvent({
          action: 'select_subcategory',
          category: category.title,
          subcategory: subcategoryValue,
        });
        
        onPurposeSelect({
          category: category.title,
          subcategory: subcategoryValue,
          custom: null,
        });
      }
    }
  }, [state.selectedCategory, onPurposeSelect]);

  const handleCustomPurposeChange = useCallback((value: string): void => {
    dispatch({ type: 'UPDATE_CUSTOM_PURPOSE', payload: value });
    
    if (state.selectedCategory === 'other') {
      trackLoanPurposeEvent({
        action: 'enter_custom_purpose',
        customPurpose: value,
      });
      
      onPurposeSelect({
        category: 'Other Loan Purposes',
        subcategory: null,
        custom: value,
      });
    }
  }, [state.selectedCategory, onPurposeSelect]);

  const handleReset = useCallback((): void => {
    dispatch({ type: 'RESET' });
    clearState();
    trackLoanPurposeEvent({ action: 'reset' });
  }, []);

  const selectedCategoryData = state.selectedCategory ? loanPurposes[state.selectedCategory] : null;

  return (
    <div 
      className={styles.purposeSelector}
      role="form"
      aria-label="Loan Purpose Selection"
    >
      <div className={styles.mainCategories}>
        <h3 id="categoryHeading">Select Loan Purpose</h3>
        <div 
          className={styles.categoryGrid}
          role="radiogroup"
          aria-labelledby="categoryHeading"
        >
          {categoryEntries.map(([key, value]) => (
            <CategoryCard
              key={key}
              id={key}
              data={value}
              isSelected={state.selectedCategory === key}
              onSelect={handleCategorySelect}
            />
          ))}
        </div>
      </div>

      {selectedCategoryData?.subcategories && (
        <div className={styles.subcategories}>
          <h3 id="subcategoryHeading">Select Specific Purpose</h3>
          <div 
            className={styles.subcategoryGrid}
            role="radiogroup"
            aria-labelledby="subcategoryHeading"
          >
            {subcategoryEntries.map(([key, value]) => (
              <SubcategoryCard
                key={key}
                id={key}
                label={value}
                isSelected={state.selectedSubcategory === key}
                onSelect={handleSubcategorySelect}
              />
            ))}
          </div>
        </div>
      )}

      {state.selectedCategory === 'other' && (
        <CustomPurposeInput
          value={state.customPurpose}
          error={state.error}
          onChange={handleCustomPurposeChange}
        />
      )}

      <button
        onClick={handleReset}
        className={styles.resetButton}
        type="button"
        aria-label="Reset selection"
      >
        Reset
      </button>
    </div>
  );
};

export default LoanPurposeSelector;