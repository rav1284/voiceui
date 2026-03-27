import React from 'react';

interface TextAreaProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  title,
  value,
  onChange,
  placeholder,
  className = ''
}) => {
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-32 p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm leading-relaxed"
        rows={3}
      />
    </div>
  );
};