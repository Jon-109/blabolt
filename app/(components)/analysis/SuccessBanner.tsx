import React from 'react';

interface SuccessBannerProps {
  userEmail: string | null;
}

const SuccessBanner: React.FC<SuccessBannerProps> = ({ userEmail }) => {
  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-6 rounded-md shadow-sm text-center" role="alert">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        <span role="img" aria-label="confetti" className="mr-2">🎉</span>
        Your reports are on the way!
      </h1>
      <p className="text-lg mb-1">
        {userEmail 
          ? <>We've sent the detailed <strong>Cash Flow Analysis</strong> and <strong>Business Debt Summary</strong> reports to <strong>{userEmail}</strong>.</>
          : <>Your <strong>Cash Flow Analysis</strong> and <strong>Business Debt Summary</strong> reports are being generated.</>
        }
      </p>
      <p className="text-base mb-2">
        <span role="img" aria-label="stopwatch" className="mr-1">⏱️</span>
        Expect delivery within ~2 minutes. Please check your inbox (and spam folder, just in case).
      </p>
    </div>
  );
};

export default SuccessBanner;
