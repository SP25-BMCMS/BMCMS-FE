import React from 'react';

type AddButtonProps = {
  onClick?: () => void;
  label?: string;
  className?: string;
  icon?: React.ReactNode;
  iconSize?: number | string; // Thêm prop cho size
};

const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  label = 'Add User',
  className = '',
  icon,
  iconSize = 20, // default size
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 bg-[#d9d9d9] dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-[20px] w-[137px] border border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 ${className}`}
    >
      {icon && (
        <span
          className="mr-2 text-gray-700 dark:text-gray-300"
          style={{ width: iconSize, height: iconSize }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: iconSize,
          })}
        </span>
      )}
      {label}
    </button>
  );
};

export default AddButton;
