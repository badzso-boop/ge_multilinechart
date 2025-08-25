import React, { useState } from "react";

interface LineValue {
  x: number;
  y: number;
}

interface LineSeries {
  id: string           // vonal neve (pl. "Family A")
  values: LineValue[] // a vonalhoz tartozó pontok
  color: string        // a vonal színe
  currency: string
}

interface TrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LineSeries[];
  selectedIds: string[]; // jelenleg kiválasztott sorok
  onSelectionChange: (ids: string[]) => void;
}

const DEFAULT_SELECTION = ["Smith", "Blackwood", "Wilson"];

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
      if (localSelection.length >= 5) {
        alert("Egyszerre legfeljebb 5 család választható ki.");
        return;
      }
      updated = [...localSelection, id];
    }
      setLocalSelection(updated);
      onSelectionChange(updated);
  };

  const resetToDefault = () => {
    setLocalSelection(DEFAULT_SELECTION);
    onSelectionChange(DEFAULT_SELECTION);
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

          <div
            className="text-[#7252bc] cursor-pointer"
            onClick={resetToDefault}
          >
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

        <div className="flex flex-wrap items-center">
          <div className="mx-2">
            .
          </div>
          <div className="mx-2">
            i
          </div>
          <div className="mx-2">
            For best view, select no more than 5 trends. 
          </div>
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
                {series.id} - {series.currency} - {series.socialClass}
              </span>
            </label>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TrendsModal;
