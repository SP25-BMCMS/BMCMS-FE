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
      className={`flex items-center px-4 py-2 bg-[#d9d9d9] rounded-[20px] w-[137px] border border-black hover:bg-gray-200 ${className}`}
    >
      {icon && (
        <span className="mr-2" style={{ width: iconSize, height: iconSize }}>
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
