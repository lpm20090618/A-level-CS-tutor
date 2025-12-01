
export enum AppMode {
  Chat = 'CHAT',
  Quiz = 'QUIZ',
  Grader = 'GRADER',
  Sandbox = 'SANDBOX'
}

export enum Sender {
  User = 'USER',
  AI = 'AI'
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'zh';

export type TeachingPersona = 'standard' | 'socratic' | 'examiner';

export interface Attachment {
  type: 'image' | 'file';
  mimeType: string;
  data: string; // base64
  name: string;
}

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  persona?: TeachingPersona;
  isDiagram?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserStats {
  points: number;
  streak: number;
  lastLogin: string; // ISO date
  quizzesTaken: number;
}
