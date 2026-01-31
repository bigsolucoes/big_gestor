
import React from 'react';
import { JobStatus, ServiceType } from './types';
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

// BIG SOLUÇÕES logo (black text for light theme)
export const LOGO_LIGHT_THEME_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA2gAAAFKCAMAAADuAABeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAAEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEbC3/IAAAAkdFJOU/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8ASrC5+gAAAAlwSFlzAAAF/wAABf8Byms24gAAA1pJREFUeJzt2+tyJAUQhuEw2ChS/A94h0QxUv6/Yx3aE1qCnd1VVTv7rL2EIAgCg04KAIJOAYCgUwAg6BQA6HQKAIJOAYCgUwAg6BQA6HQKAO0+AECgKQDQ6RQACDoFAIIuAEDSKQACgSYAQKNTAECgKQDQ6RQACDoFAIIuAEDSKQAQ7QMAgSYAQKNTAECgKQDQ6RQACDoFAIIuAEDSKQACgSYAQKNTAEA7BwACgSYAQKNTAECgKQDQ6RQACDoFAIIuAEDSKQACgSYAQKNTAADqHgBAoAkA0HQKAIIuAEDSKQACgSYAQKNTAECgKQDQ6RQACDoFAIIuAECgCQCajgB0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECjUwAg0AQAgUYTgE4BgKATAKDpFABoOgVAoAkA0HQKAADqHgCg6QQAaDoFoOkUAECgCQDQdAoABF0AgKRTACDQBACNTgGAQFMANDoFABJ0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAEDTKQCQoFMAINAkAGg6BQACLgBA0ikAAgBNp0tLfwEB/K8h8dKwuHAAAAAASUVORK5CYII=';

// BIG SOLUÇÕES logo (white text for dark theme)
export const LOGO_DARK_THEME_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA2gAAAFKCAMAAADuAABeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAAEBAf///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8a9Gy8AAAkkdFJOU///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ANR/12YAAAAlwSFlzAAAF/wAABf8Byms24gAAA1pJREFUeJzt2+tyJAUQhuEw2ChS/A94h0QxUv6/Yx3aE1qCnd1VVTv7rL2EIAgCg04KAIJOAYCgUwAg6BQA6HQKAIJOAYCgUwAg6BQA6HQKAO0+AECgKQDQ6RQACDoFAIIuAEDSKQACgSYAQKNTAECgKQDQ6RQACDoFAIIuAEDSKQAQ7QMAgSYAQKNTAECgKQDQ6RQACDoFAIIuAEDSKQACgSYAQKNTAEA7BwACgSYAQKNTAECgKQDQ6RQACDoFAIIuAEDSKQACgSYAQKNTAADqHgBAoAkA0HQKAIIuAEDSKQACgSYAQKNTAECgKQDQ6RQACDoFAIIuAECgCQCajgB0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECjUwAg0AQAgUYTgE4BgKATAKDpFABoOgVAoAkA0HQKAADqHgCg6QQAaDoFoOkUAECgCQDQdAoABF0AgKRTACDQBACNTgGAQFMANDoFABJ0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECjUwAg0AQAgUYTgE4BgKATAKDpFABoOgVAoAkA0HQKAADqHgCg6QQAaDoFoOkUAECgCQDQdAoABF0AgKRTACDQBACNTgGAQFMANDoFABJ0igAEXQCApFMAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECLk2VbV/YCAQCaTgGAoFMAIGkGAECgCQCajgB0igAEXQCApFMAINAkAECLkwEAqPsAANJ0AgA0nQLQ6QQAINAkAECjUwAg0AQAgUYTgE4BgKATAKDpFABoOg---';

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
