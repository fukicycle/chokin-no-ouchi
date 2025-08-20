import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const Modal = ({ children, onClose, title, isChildModal = false }) => {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const shadowStyle = {
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      } ${isChildModal ? "" : "bg-gray-900/50 backdrop-blur-sm"}`}
    >
      <div
        className="bg-bg-secondary w-full max-w-md mx-4 p-6 rounded-3xl border border-white/20 transform transition-transform duration-300"
        style={{
          ...shadowStyle,
          animation: `${isClosing ? "modal-out" : "modal-in"} 0.3s forwards`,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-xl font-bold">{title}</h3>}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes modal-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes modal-out {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.95);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Modal;
