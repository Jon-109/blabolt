import React, { memo } from 'react';
import styles from '../LoanPurposeSelector.module.css';

interface CustomPurposeInputProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}

const CustomPurposeInput: React.FC<CustomPurposeInputProps> = ({
  value,
  error,
  onChange
}) => {
  return (
    <div className={styles.customPurpose}>
      <label htmlFor="customPurpose">
        <h3>Describe Your Loan Purpose</h3>
      </label>
      <textarea
        id="customPurpose"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Please describe your specific loan purpose..."
        rows={4}
        maxLength={500}
        aria-invalid={!!error}
        aria-describedby={error ? 'customPurposeError' : undefined}
      />
      {error && (
        <p id="customPurposeError" className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p className={styles.charCount}>
        {value.length}/500 characters
      </p>
    </div>
  );
};

export default memo(CustomPurposeInput);
