import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const FAB = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-accent-pink text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-110 focus:outline-none"
    >
      <FontAwesomeIcon icon={faPlus} className="text-2xl" />
    </button>
  );
};

export default FAB;