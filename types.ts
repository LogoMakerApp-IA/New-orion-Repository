
export enum OrionState {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATING = 'AUTHENTICATING',
  BOOTING = 'BOOTING', 
  IDLE = 'IDLE',
  FOCUSED = 'FOCUSED',
  FOCUSED_EMPTY = 'FOCUSED_EMPTY',
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  PRE_SLEEP = 'PRE_SLEEP',
  LOOKING_AROUND = 'LOOKING_AROUND',
  SYSTEM_SEARCHING = 'SYSTEM_SEARCHING', // Novo estado para busca de info técnica
  SQUINTING = 'SQUINTING',
  SLEEPING = 'SLEEPING',
  OBSERVING = 'OBSERVING',
  AWAITING_PERMISSION = 'AWAITING_PERMISSION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SYSTEM_SUCCESS = 'SYSTEM_SUCCESS',
  CHARGING = 'CHARGING', 
  ON_BATTERY = 'ON_BATTERY',
  LISTENING = 'LISTENING', 
}

export interface Message {
  id: string;
  role: 'user' | 'system' | 'model';
  content: string;
  timestamp: number;
  isHidden?: boolean; 
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

export interface SysNotification {
  id: string;
  title: string;
  details: string;
  timestamp: number;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'HARDWARE' | 'SECURITY' | 'MEMORY' | 'GENERAL';
}

export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
}

export interface UserSession {
  uid: string;
  name: string;
  email: string;
  isGuest: boolean;
}
