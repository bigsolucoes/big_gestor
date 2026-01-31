
export enum ServiceType {
  VIDEO = 'Vídeo',
  PHOTO = 'Fotografia',
  DESIGN = 'Design',
  SITES = 'Sites',
  STORY = 'Story',
  CASAMENTO = 'Casamento',
  CONTEUDO = 'Conteúdos',
  SET = 'Set',
  EVENTOS = 'Eventos',
  INSTITUCIONAL = 'Institucional',
  SOCIAL_MEDIA = 'Social Media',
  AUXILIAR_T = 'Auxiliar T.',
  FREELA = 'Freela',
  PROGRAMACAO = 'Programação',
  REDACAO = 'Redação',
  OTHER = 'Outro',
}

export enum JobStatus {
  BRIEFING = 'Briefing',
  PRODUCTION = 'Produção',
  REVIEW = 'Revisão',
  FINALIZED = 'Finalizado',
  PAID = 'Pago',
  OTHER = 'Outros',
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  cpf?: string;
  instagram?: string; 
  birthday?: string;  
  observations?: string;
  createdAt: string;
}

export interface JobObservation {
  id: string;
  text: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO String
  method?: string;
  notes?: string;
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
}

export type ContractDuration = 'Pontual' | 'Semestral' | 'Anual';

export interface Contract {
  id: string;
  title: string;
  clientId: string;
  content: string;
  createdAt: string;
  ownerId: string;
  ownerUsername: string;
  isSigned: boolean;
  duration?: ContractDuration; // Novo campo de vigência
}

export interface Job {
  id: string;
  name: string;
  clientId: string;
  serviceType: ServiceType;
  customServiceType?: string; // Novo campo para texto livre quando ServiceType for OTHER
  value: number;
  cost?: number;
  deadline: string; // ISO string date
  recordingDate?: string; // ISO string date and time
  status: JobStatus;
  cloudLinks?: string[];
  createdAt: string;
  notes?: string;
  isDeleted?: boolean;
  observationsLog?: JobObservation[];
  payments: Payment[];
  isRecurring?: boolean;
  createCalendarEvent?: boolean;
  tasks: Task[];
  financialTasks?: Task[]; 
  linkedContractId?: string;
  linkedDraftIds: string[];
  ownerId?: string;
  ownerUsername?: string;
  isTeamJob?: boolean;
}

export enum FinancialJobStatus {
  PENDING_DEPOSIT = 'PENDING_DEPOSIT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PENDING_FULL_PAYMENT = 'PENDING_FULL_PAYMENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AppSettings {
  asaasUrl?: string;
  customLinkTitle?: string; // Título do botão personalizado
  userName?: string;
  primaryColor: string;
  accentColor: string;
  splashScreenBackgroundColor: string;
  privacyModeEnabled?: boolean;
  teamMembers?: string[];
  kanbanColumns?: { [key: string]: string }; // Mapa de status para nome personalizado
  theme: 'light' | 'dark';
}

export interface ScriptLine {
  id: string;
  scene: string;
  description: string;
  duration: number; // seconds
}

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string;
}

export interface DraftNote {
  id: string;
  title: string;
  type: 'TEXT' | 'SCRIPT';
  content?: string;
  scriptLines?: ScriptLine[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface License {
  key: string;
  status: 'active' | 'used' | 'revoked'; // Added revoked
  createdAt: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: string;
}

export interface BugReport {
  id: string;
  reporter: string;
  description: string;
  timestamp: string;
  status: 'open' | 'resolved';
}

export interface AIChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

export interface Notification {
  id: string;
  type: 'deadline' | 'overdue' | 'client' | 'birthday';
  message: string;
  linkTo: string;
  isRead: boolean;
  entityId: string;
}
