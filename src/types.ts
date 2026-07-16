export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'User';
  joinedDate: string;
  status: 'Active' | 'Suspended';
}

export interface Citation {
  documentId: string;
  documentName: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  rating?: 'up' | 'down' | null;
  feedbackText?: string;
  modelUsed?: string;
  tokensUsed?: number;
  citations?: Citation[];
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  isPinned: boolean;
  folder: string | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  chunkCount: number;
  status: 'indexed' | 'processing' | 'failed';
  uploadedAt: string;
  enabled: boolean;
  content: string; // complete text content for mock text search
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  category: 'Coding' | 'Legal' | 'Marketing' | 'General' | 'Enterprise';
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'info' | 'error' | 'security';
}

export interface AnalyticsStats {
  totalUsers: number;
  dailyChats: number;
  averageResponseTimeMs: number;
  userGrowth: { date: string; count: number }[];
  aiTokenUsage: { date: string; input: number; output: number }[];
  feedbackScore: number; // overall percentage of thumbs up
  uploadedDocuments: number;
  knowledgeBaseSizeKb: number;
  popularQuestions: { question: string; count: number }[];
  dailyVolume: { date: string; chats: number; tokens: number }[];
}
