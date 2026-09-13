import React from "react";
import { createPortal } from "react-dom";
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

  // position:fixed は「transform / filter / backdrop-filter を持つ祖先」があると
  // ビューポートではなくその祖先を基準に配置される。モーダルは .glass-card
  // (backdrop-filter あり) の内側から開かれることがあるため、必ず body 直下へ
  // ポータルで逃がして常に画面中央に出るようにする。
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      } ${isChildModal ? "" : "bg-gray-900/50 backdrop-blur-sm"}`}
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="glass-modal w-full max-w-md max-h-full overflow-y-auto overscroll-contain p-6 rounded-3xl border border-white/20 dark:border-white/10 text-text-dark dark:text-gray-100 transform transition-transform duration-300"
        style={{
          ...shadowStyle,
          animation: `${isClosing ? "modal-out" : "modal-in"} 0.3s forwards`,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-xl font-bold">{title}</h3>}
          <button
            onClick={handleClose}
            className="ml-auto text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
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
    </div>,
    document.body
  );
};

export default Modal;
