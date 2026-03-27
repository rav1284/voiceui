import React from 'react';
import { User, UserCheck } from 'lucide-react';
import type { ConversationEntry } from '../types';

interface ConversationPanelProps {
  conversations: ConversationEntry[];
  isRecording: boolean;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  isRecording
}) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Live Conversation
        </h3>
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600 font-medium">Recording</span>
          </div>
        )}
      </div>
      
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">Click "Start Recording" to capture conversation</p>
          </div>
        ) : (
          conversations.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-start space-x-3 ${
                entry.speaker === 'doctor' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  entry.speaker === 'doctor' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  entry.speaker === 'doctor' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {entry.speaker === 'doctor' ? <UserCheck size={16} /> : <User size={16} />}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    entry.speaker === 'doctor'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{entry.text}</p>
                  <p className={`text-xs mt-1 ${
                    entry.speaker === 'doctor' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};