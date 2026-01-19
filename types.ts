export enum OrionState {
  IDLE = 'IDLE', // Standard open state
  FOCUSED = 'FOCUSED', // Input active, user typing
  FOCUSED_EMPTY = 'FOCUSED_EMPTY', // Input active but empty (blinking)
  PROCESSING = 'PROCESSING', // Thinking
  ACTIVE = 'ACTIVE', // Speaking/Outputting
  PRE_SLEEP = 'PRE_SLEEP', // Transition: Rapid blinking before sleep
  LOOKING_AROUND = 'LOOKING_AROUND', // New: Idle animation, looking around
  SQUINTING = 'SQUINTING', // Transition: Eyes pressed/heavy
  SLEEPING = 'SLEEPING', // Fully closed
  OBSERVING = 'OBSERVING', // New: Deep Dive mode, scaling up and looking around from background
  AWAITING_PERMISSION = 'AWAITING_PERMISSION', // Waiting for user confirmation
  SYSTEM_ALERT = 'SYSTEM_ALERT', // Red alert for battery/resources
  SYSTEM_SUCCESS = 'SYSTEM_SUCCESS', // Green for positive events (Charging)
}

export interface Message {
  id: string;
  role: 'user' | 'system' | 'model';
  content: string;
  timestamp: number;
  isHidden?: boolean; // For filtering notifications
}

export interface LogEntry {
  timestamp: string;
  type: 'USER_INPUT' | 'SYSTEM_RESPONSE' | 'STATE_CHANGE' | 'SYSTEM_ERROR';
  data: any;
}

export interface PendingAction {
  description: string;
  originalResponse: string;
}

// Simulated System Notification
export interface SysNotification {
  id: string;
  title: string;
  details: string;
  timestamp: number;
  read: boolean;
}

export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
}