import React, { useState } from "react";
import Error from "../images/error.png"
import Search from "../images/search.png"
import Reset from "../images/reset.png"
import { LineSeries } from "./MultiLineChartDemo";

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
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    let updated: string[];
    if (localSelection.includes(id)) {
      updated = localSelection.filter((item) => item !== id);
      setShowWarning(false);
    } else {
      if (localSelection.length >= 5) {
        setShowWarning(true);
        return;
      }
      updated = [...localSelection, id];
    }
      setLocalSelection(updated);
      onSelectionChange(updated);
  };

  const resetToDefault = () => {
    setShowWarning(false);
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
      <div className="relative bg-white rounded-2xl shadow-lg w-[500px] h-[398px] max-w-3xl p-4 z-[101]">
        

        <div className="w-full flex flex-wrap my-2 justify-between items-center">
          <div className="bg-[#ececf0] w-[204px] h-[34px] flex flex-wrap items-center justify-between px-[12px]">
            
            <span className="italic">
              Search trends
            </span>

            <img src={Search} className="w-[16px] h-[16px]" alt="search icon" />
          </div>

          <div
            className="text-[#7252bc] cursor-pointer flex flex-wrap items-center"
            onClick={resetToDefault}
          >
            <img src={Reset} className="mx-2 w-[16px] h-[16px] text-[#7252bc]" alt="reset image" />
            <span className="mx-2">
              Reset to default
            </span>
          </div>

          {/* Bezárás gomb */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>

        {showWarning && (
          <div className="relative flex flex-wrap items-center bg-gray-300">
            <div className=" bg-gray-600 text-gray-600 w-[12px] absolute left-0">
              .
            </div>
            <img src={Error} alt="error image" className="ml-5" />
            <div className="mx-2">
              For best view, select no more than 5 trends. 
            </div>
          </div>
        )}


        <div className="grid grid-cols-2 gap-4 my-2">
          {data.slice(0, 5).map((series) => (
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
              <span>{series.id} ({series.currency}) - ({series.socialClass})</span>
            </label>
          ))}

          {data.slice(5, 10).map((series) => (
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
              <span>{series.id} ({series.currency}) - ({series.socialClass})</span>
            </label>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TrendsModal;
