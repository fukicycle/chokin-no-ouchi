// src/components/SettingModal.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

const SettingModal = ({ familyId }) => {
  const handleCopy = () => {
    if (familyId) {
      navigator.clipboard.writeText(familyId);
      alert("ファミリーIDがクリップボードにコピーされました！");
    }
  };

  return (
    <div className="text-center p-4">
      <h3 className="text-lg font-bold mb-2">ファミリーID</h3>
      <div className="flex items-center justify-center p-3 bg-bg-secondary rounded-lg shadow-inner border border-gray-300">
        <p className="text-xl font-mono tracking-wide break-all flex-grow mr-2">
          {familyId || "---"}
        </p>
        <button
          onClick={handleCopy}
          className="p-2 text-accent-blue hover:text-blue-500 transition-colors duration-200"
          disabled={!familyId}
        >
          <FontAwesomeIcon icon={faCopy} className="text-xl" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-4">
        このIDを家族に共有すると、同じ家計簿を共有できます。
      </p>
    </div>
  );
};

export default SettingModal;
