import React from 'react';

import { Tag, Plus } from 'lucide-react';
import type { Keyword } from '../types';

interface KeywordPanelProps {
  keywords: Keyword[];
  onKeywordClick: (keyword: Keyword, targetArea: 'history' | 'symptoms' | 'prescription') => void;
}

const categoryColors = {
  symptom: 'bg-red-100 text-red-700 border-red-200',
  condition: 'bg-orange-100 text-orange-700 border-orange-200',
  medication: 'bg-blue-100 text-blue-700 border-blue-200',
  procedure: 'bg-purple-100 text-purple-700 border-purple-200',
  general: 'bg-gray-100 text-gray-700 border-gray-200'
};

export const KeywordPanel: React.FC<KeywordPanelProps> = ({
  keywords,
  onKeywordClick
}) => {
  const [selectedKeyword, setSelectedKeyword] = React.useState<Keyword | null>(null);

  const handleKeywordSelect = (keyword: Keyword) => {
    setSelectedKeyword(selectedKeyword?.id === keyword.id ? null : keyword);
  };

  const handleAddToArea = (targetArea: 'history' | 'symptoms' | 'prescription') => {
    if (selectedKeyword) {
      onKeywordClick(selectedKeyword, targetArea);
      setSelectedKeyword(null);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center space-x-2">
          <Tag size={16} />
          <span>Extracted Keywords</span>
        </h3>
      </div>
      
      <div className="p-4">
        {keywords.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            Click "Process" to extract keywords from conversation
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <button
                  key={keyword.id}
                  onClick={() => handleKeywordSelect(keyword)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    categoryColors[keyword.category]
                  } ${
                    selectedKeyword?.id === keyword.id 
                      ? 'ring-2 ring-blue-300 shadow-lg transform scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  {keyword.text}
                  <span className="ml-1 text-xs opacity-70">
                    ({Math.round(keyword.confidence * 100)}%)
                  </span>
                </button>
              ))}
            </div>

            {selectedKeyword && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-3">
                  Add "<strong>{selectedKeyword.text}</strong>" to:
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToArea('history')}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs"
                  >
                    <Plus size={12} />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => handleAddToArea('symptoms')}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs"
                  >
                    <Plus size={12} />
                    <span>Symptoms</span>
                  </button>
                  <button
                    onClick={() => handleAddToArea('prescription')}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-xs"
                  >
                    <Plus size={12} />
                    <span>Prescription</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};