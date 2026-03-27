import React, { useState, useRef, useEffect } from "react";

export const KeywordPanel = ({
  keywords= [],
  onAssignKeyword =(keyword:string, category:string)=>{}, //(keyword, category) => void
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAssign = (keyword: string, category: string) => {
    onAssignKeyword(keyword, category);
    setActiveIndex(null); // close popover
  };

  return (
    <div className="relative p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Keywords</h2>

      {keywords.length === 0 ? (
        <p className="text-sm text-gray-500">No keywords yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 relative">
          {keywords.map((k, i) => (
            <li key={i} className="relative">
              <button
                type="button"
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs hover:bg-blue-200 cursor-pointer"
              >
                {k}
              </button>

              {/* Popover */}
              {activeIndex === i && (
                <div
                  ref={popoverRef}
                  className="absolute z-20 mt-1 -right-20 -top-36 bg-white shadow-lg rounded-md border border-gray-200 p-2 text-sm"
                >
                  {/* <p className="text-xs text-gray-500 mb-1">Assign to:</p> */}
                  <div className="flex flex-col space-y-1 *:cursor-pointer">
                    <button
                      onClick={() => handleAssign(k, "history")}
                      className="hover:bg-gray-100 px-2 py-1 rounded text-left"
                    >
                      History
                    </button>
                    <button
                      onClick={() => handleAssign(k, "symptoms")}
                      className="hover:bg-gray-100 px-2 py-1 rounded text-left"
                    >
                      Chief Complaint
                    </button>
                    <button
                      onClick={() => handleAssign(k, "prescription")}
                      className="hover:bg-gray-100 px-2 py-1 rounded text-left"
                    >
                      Action Insights
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

