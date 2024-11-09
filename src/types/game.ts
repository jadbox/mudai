export interface GameMessage {
  id: string;
  content: string;
  timestamp: number;
  type: 'system' | 'medical' | 'error' | 'info' | 'success';
  image?: string;
}

export interface Patient {
  id: string;
  name: string;
  condition: string;
  severity: 'critical' | 'serious' | 'stable';
  treatedWith?: string[];
}

export interface Supply {
  id: string;
  name: string;
  type: 'medication' | 'equipment';
  quantity: number;
}

export interface GameState {
  patients: Patient[];
  supplies: Supply[];
  surgeries: number;
  savedLives: number;
  shiftTime: number;
  status: 'available' | 'in-surgery' | 'resting' | 'reading-manual';
  isShiftActive: boolean;
  currentCase?: Case;
  tipRequested?: boolean;
  tipTimer?: number;
  lastActionTime?: number;
  processingOption?: boolean;
  optionTimer?: number;
}

export interface Command {
  command: string;
  args: string[];
}

export interface CaseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  diagnosis: string;
  options: CaseOption[];
  tip: string;
}