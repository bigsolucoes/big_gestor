
import React from 'react';
import { JobStatus, ServiceType } from './types';
import logobig from './logobig.png';
import { 
  Home, Briefcase, Users, CreditCard, BarChartBig, MessageCircle, FolderArchive, 
  Sparkles, Cog, PlusCircle, X, Trash2, Edit3, CheckCircle, AlertCircle, Clock, 
  DollarSign, Eye, EyeOff, List, ArrowRight, CalendarDays, FileText, Bot,
  Save, Check, ChevronLeft, ChevronRight, Wallet, ExternalLink, Plus, Minus, 
  Table, ChevronDown, ChevronUp, Paperclip, Bell, RotateCw, Download, Upload, 
  LogOut, Printer, CheckSquare, GripVertical, ImageUp, ImageOff, SendHorizonal, 
  Link, Link2, Archive, GitCommitVertical, MessageSquare, Key, Lock, Copy, 
  Instagram, Video, CalendarHeart, StickyNote
} from 'lucide-react';

// Export Icons with Aliases
export const HomeIcon = Home;
export const BriefcaseIcon = Briefcase;
export const UsersIcon = Users;
export const CreditCardIcon = CreditCard;
export const BarChartIcon = BarChartBig;
export const FolderArchiveIcon = FolderArchive;
export const SparklesIcon = Sparkles;
export const SettingsIcon = Cog;
export const PlusCircleIcon = PlusCircle;
export const XIcon = X;
export const TrashIcon = Trash2;
export const PencilIcon = Edit3;
export const CheckCircleIcon = CheckCircle;
export const AlertCircleIcon = AlertCircle;
export const ExclamationCircleIcon = AlertCircle; // Alias for ExclamationCircleIcon
export const ClockIcon = Clock;
export const CurrencyDollarIcon = DollarSign;
export const EyeOpenIcon = Eye;
export const EyeClosedIcon = EyeOff;
export const ListBulletIcon = List;
export const ArrowRightIcon = ArrowRight;
export const CalendarIcon = CalendarDays;
export const ContractIcon = FileText;
export const DraftIcon = StickyNote;
export const BotIcon = Bot;
export const SaveIcon = Save;
export const CheckIcon = Check;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const WalletIcon = Wallet;
export const ExternalLinkIcon = ExternalLink;
export const PlusIcon = Plus;
export const MinusIcon = Minus;
export const TableCellsIcon = Table;
export const ChevronDownIcon = ChevronDown;
export const ChevronUpIcon = ChevronUp;
export const PaperclipIcon = Paperclip;
export const BellIcon = Bell;
export const RotateCwIcon = RotateCw;
export const DownloadIcon = Download;
export const UploadIcon = Upload;
export const LogOutIcon = LogOut;
export const PrinterIcon = Printer;
export const CheckSquareIcon = CheckSquare;
export const GripVerticalIcon = GripVertical;
export const ImageUpIcon = ImageUp;
export const ImageOffIcon = ImageOff;
export const LinkIcon = Link;
export const RemoveLinkIcon = Link2;
export const ArchiveIcon = Archive;
export const SyncIcon = GitCommitVertical;
export const WhatsAppIcon = MessageSquare;
export const KeyIcon = Key;
export const LockIcon = Lock;
export const CopyIcon = Copy;
export const InstagramIcon = Instagram;
export const VideoIcon = Video;
export const CalendarHeartIcon = CalendarHeart;
export const SendHorizonalIcon = SendHorizonal;

export const APP_NAME = "BIG";
export const ACCENT_COLOR = "custom-brown"; 

// Logo using logobig.png
export const LOGO_LIGHT_THEME_BASE64 = logobig;
export const LOGO_DARK_THEME_BASE64 = logobig;

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Jobs', path: '/jobs', icon: BriefcaseIcon },
  { name: 'Clientes', path: '/clients', icon: UsersIcon },
  { name: 'Contratos', path: '/contracts', icon: ContractIcon },
  { name: 'Financeiro', path: '/financials', icon: CreditCardIcon },
  { name: 'Calendário', path: '/calendar', icon: CalendarIcon },
  { name: 'Rascunhos', path: '/drafts', icon: DraftIcon },
  { name: 'WhatsApp', path: '/communication', icon: MessageCircle }, 
  { name: 'Desempenho', path: '/performance', icon: BarChartIcon }, 
  { name: 'Gestor IA', path: '/ai-assistant', icon: SparklesIcon },
];

export const JOB_STATUS_OPTIONS = [
  { value: JobStatus.BRIEFING, label: 'Briefing' },
  { value: JobStatus.PRODUCTION, label: 'Produção' },
  { value: JobStatus.REVIEW, label: 'Revisão' },
  { value: JobStatus.FINALIZED, label: 'Finalizado' },
  { value: JobStatus.PAID, label: 'Pago' },
  { value: JobStatus.OTHER, label: 'Outros' },
];

export const SERVICE_TYPE_OPTIONS = Object.values(ServiceType).map(type => ({
  value: type,
  label: type,
}));

export const KANBAN_COLUMNS = [
  { id: 'briefing', title: 'Briefing', status: JobStatus.BRIEFING },
  { id: 'production', title: 'Produção', status: JobStatus.PRODUCTION },
  { id: 'review', title: 'Revisão', status: JobStatus.REVIEW },
  { id: 'finalized', title: 'Finalizado', status: JobStatus.FINALIZED },
  { id: 'other', title: 'Outros', status: JobStatus.OTHER },
];
