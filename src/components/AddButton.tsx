// AddButton.tsx
import React from 'react';

type AddButtonProps = {
  onClick?: () => void;
  label?: string;
  className?: string;
};

const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  label = 'Add User',
  className = '',
}) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center px-4 py-2 bg-[#d9d9d9] rounded-[20px] w-[137px] border border-black hover:bg-gray-200 ${className}`}
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
      </svg>
      {label}
    </button>
  );
};

export default AddButton;