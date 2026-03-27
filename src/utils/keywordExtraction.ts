import { Keyword } from '../types';

// Simulated keyword extraction - in real app, this would call an actual API
export const extractKeywords = async (conversationText: string): Promise<Keyword[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock keywords based on common medical terms in the conversation
  const mockKeywords: Keyword[] = [
    {
      id: 'kw-1',
      text: 'persistent headaches',
      confidence: 0.95,
      category: 'symptom'
    },
    {
      id: 'kw-2',
      text: 'throbbing pain',
      confidence: 0.88,
      category: 'symptom'
    },
    {
      id: 'kw-3',
      text: 'nausea',
      confidence: 0.82,
      category: 'symptom'
    },
    {
      id: 'kw-4',
      text: 'morning headaches',
      confidence: 0.79,
      category: 'symptom'
    },
    {
      id: 'kw-5',
      text: 'ibuprofen',
      confidence: 0.92,
      category: 'medication'
    },
    {
      id: 'kw-6',
      text: 'sleep deprivation',
      confidence: 0.85,
      category: 'condition'
    },
    {
      id: 'kw-7',
      text: '4-5 hours sleep',
      confidence: 0.76,
      category: 'general'
    },
    {
      id: 'kw-8',
      text: 'temporary relief',
      confidence: 0.71,
      category: 'general'
    },
    {
      id: 'kw-9',
      text: 'work stress',
      confidence: 0.68,
      category: 'condition'
    },
    {
      id: 'kw-10',
      text: 'late night work',
      confidence: 0.73,
      category: 'general'
    }
  ];

  // Filter and return keywords based on conversation content
  return mockKeywords.filter(keyword => 
    conversationText.toLowerCase().includes(keyword.text.toLowerCase()) ||
    keyword.confidence > 0.8
  );
};