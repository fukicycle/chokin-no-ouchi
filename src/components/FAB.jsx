import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const FAB = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-accent-pink dark:bg-pink-600 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg dark:shadow-pink-900/30 hover:scale-110 active:scale-95 hover:bg-pink-400 dark:hover:bg-pink-500 transition-all duration-200 focus:outline-none"
      title="支出を追加"
    >
      <FontAwesomeIcon icon={faPlus} className="text-2xl" />
    </button>
  );
};

export default FAB;
