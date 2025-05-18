import React, { memo } from 'react';
import styles from '../LoanPurposeSelector.module.css';

interface SubcategoryCardProps {
  id: string;
  label: string;
  isSelected: boolean;
  onSelect: (subcategory: string) => void;
}

const SubcategoryCard: React.FC<SubcategoryCardProps> = ({
  id,
  label,
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
      className={`${styles.subcategoryCard} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(id)}
      onKeyPress={handleKeyPress}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
    >
      {label}
    </button>
  );
};

export default memo(SubcategoryCard);
