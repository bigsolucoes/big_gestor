import React from 'react';
import { DraftIcon } from '../constants';

interface AnnotationsButtonProps {
  count: number;
  onClick: () => void;
  className?: string;
}

const AnnotationsButton: React.FC<AnnotationsButtonProps> = ({
  count,
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-text-secondary hover:text-accent hover:bg-hover-bg rounded-md transition-all group ${className}`}
      title={`Anotações (${count})`}
    >
      <DraftIcon size={16} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default AnnotationsButton;
