import React, { useState } from "react";

interface LineValue {
  x: number;
  y: number;
}

interface LineSeries {
  id: string;
  color: string;
  values: LineValue[];
}

interface TrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LineSeries[];
  selectedIds: string[]; // jelenleg kiválasztott sorok
  onSelectionChange: (ids: string[]) => void;
}

const TrendsModal: React.FC<TrendsModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedIds,
  onSelectionChange,
}) => {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    let updated: string[];
    if (localSelection.includes(id)) {
      updated = localSelection.filter((item) => item !== id);
    } else {
      updated = [...localSelection, id];
    }
    setLocalSelection(updated);
    onSelectionChange(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">

      {/* Háttér overlay */}
      <div
        className="absolute inset-0 custom-opacity"
        onClick={onClose}
      />


      {/* Modal tartalom */}
      <div className="relative bg-white rounded-2xl shadow-lg w-[500px] max-w-3xl p-4 z-[101]">
        

        <div className="w-full flex flex-wrap my-2 justify-between">
          <div className="pl-[10px] pr-[60px] italic bg-[#ececf0]">
            Search trends
          </div>

          <div className="text-[#7252bc] cursor-pointer" onClick={() => {setLocalSelection([]);onSelectionChange([]);}}>
            Reset to default
          </div>

          {/* Bezárás gomb */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 my-2">
          {data.map((series) => (
            <label
              key={series.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localSelection.includes(series.id)}
                onChange={() => toggleId(series.id)}
                className="h-4 w-4 bg-[#d7d8db]"
              />
              <span>
                {series.id}
              </span>
            </label>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TrendsModal;
