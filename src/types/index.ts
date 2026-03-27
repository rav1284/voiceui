export interface ConversationEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  text: string;
  timestamp: Date;
}

export interface Keyword {
  id: string;
  text: string;
  confidence: number;
  category: 'symptom' | 'condition' | 'medication' | 'procedure' | 'general';
}

export interface MedicalRecord {
  history: string;
  symptoms: string;
  prescription: string;
}