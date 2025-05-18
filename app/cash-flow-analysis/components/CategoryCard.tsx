import React, { memo } from 'react';
import styles from '../LoanPurposeSelector.module.css';
import { LoanPurpose } from '../loan-types';

interface CategoryCardProps {
  id: string;
  data: LoanPurpose;
  isSelected: boolean;
  onSelect: (category: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  id, 
  data, 
  isSelected, 
  onSelect 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <button
      className={`${styles.categoryCard} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(id)}
      onKeyPress={handleKeyPress}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
    >
      <h4>{data.title}</h4>
      <p>{data.description}</p>
    </button>
  );
};

export default memo(CategoryCard);
