import React from 'react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ModalData: React.FC<ModalProps> = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-7xl p-6 rounded-lg shadow-lg relative">
        <button className="absolute top-4 right-4 text-gray-600 dark:text-white" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ModalData;
