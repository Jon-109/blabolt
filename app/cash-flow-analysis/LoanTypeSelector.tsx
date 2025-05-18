import React from 'react';
import styles from './LoanTypeSelector.module.css';
import { LoanType } from './loan-types';

interface LoanTypeSelectorProps {
  loanType: LoanType;
  onLoanTypeChange: (type: LoanType) => void;
}

const LoanTypeSelector: React.FC<LoanTypeSelectorProps> = ({ loanType, onLoanTypeChange }) => {
  return (
    <div className={styles.loanTypeContainer}>
      <h3>Select Loan Type</h3>
      <div className={styles.loanTypeOptions}>
        <div className={styles.loanTypeCard}>
          <input
            type="radio"
            id="owner-occupied"
            name="loan-type"
            value="owner-occupied"
            checked={loanType === 'owner-occupied'}
            onChange={(e) => onLoanTypeChange(e.target.value as LoanType)}
          />
          <label htmlFor="owner-occupied">
            <h4>Owner-Occupied Property</h4>
            <p>Your business will use this property, and no rental income is generated.</p>
          </label>
        </div>

        <div className={styles.loanTypeCard}>
          <input
            type="radio"
            id="investment"
            name="loan-type"
            value="investment"
            checked={loanType === 'investment'}
            onChange={(e) => onLoanTypeChange(e.target.value as LoanType)}
          />
          <label htmlFor="investment">
            <h4>Investment Property</h4>
            <p>This property generates rental income from tenants.</p>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LoanTypeSelector;