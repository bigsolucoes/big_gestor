
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS, APP_NAME, ExternalLinkIcon, XIcon, SettingsIcon, BotIcon } from '../constants';
import { LucideProps, Bug } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';
import toast from 'react-hot-toast';
import * as blobService from '../services/blobStorageService';
import { BugReport } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<LucideProps>;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { settings } = useAppData();
  const { currentUser } = useAuth();
  
  const customLinkUrl = settings.asaasUrl || 'https://www.asaas.com/login';
  const customLinkTitle = settings.customLinkTitle || 'Acessar Asaas';
  
  const googleDriveUrl = 'https://drive.google.com';
  const googlePhotosUrl = 'https://photos.google.com';

  // Bug Report State
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-subtle-bg text-text-primary border-r border-border-color shadow-2xl transform transition-transform duration-300 ease-in-out
    md:relative md:translate-x-0 md:shadow-none
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  const handleReportBug = async () => {
    if (!bugDescription.trim()) {
        toast.error("Por favor, descreva o problema.");
        return;
    }
    setIsSubmittingBug(true);
    try {
        const SYSTEM_USER_ID = 'system_data';
        const currentReports = await blobService.get<BugReport[]>(SYSTEM_USER_ID, 'bug_reports') || [];
        
        const newReport: BugReport = {
            id: uuidv4(),
            reporter: currentUser?.username || 'Anônimo',
            description: bugDescription,
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        await blobService.set(SYSTEM_USER_ID, 'bug_reports', [...currentReports, newReport]);
        toast.success("Obrigado! O bug foi reportado e será analisado.");
        setBugDescription('');
        setIsBugModalOpen(false);
    } catch (e) {
        console.error(e);
        toast.error("Erro ao enviar reporte. Tente novamente.");
    } finally {
        setIsSubmittingBug(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}

      <div className={sidebarClasses}>
        <div className="flex flex-col h-full p-4">
            {/* Mobile Close Button */}
            <div className="flex justify-end md:hidden mb-2">
                <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary">
                    <XIcon size={24} />
                </button>
            </div>

            <nav className="flex-grow overflow-y-auto no-scrollbar"> 
                <ul>
                {(NAVIGATION_ITEMS as NavigationItem[]).map((item) => {
                    const IconComponent = item.icon;
                    return (
                    <li key={item.name} className="mb-2">
                        <NavLink
                        to={item.path}
                        onClick={() => onClose()} // Close menu on navigation (mobile)
                        className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out group ${
                            isActive 
                                ? 'bg-accent font-semibold text-white shadow-lg shadow-accent/20' 
                                : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                            }`
                        }
                        >
                        {({ isActive }) => (
                            <>
                            {IconComponent && <IconComponent size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`} />}
                            <span>{item.name}</span>
                            </>
                        )}
                        </NavLink>
                    </li>
                    );
                })}
                
                {/* Settings Link explicitly added to Sidebar for Mobile access */}
                <li className="mb-2 mt-4 pt-4 border-t border-border-color">
                    <NavLink
                    to="/settings"
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                        `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out group ${
                        isActive 
                            ? 'bg-accent font-semibold text-white shadow-lg shadow-accent/20' 
                            : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                        }`
                    }
                    >
                    {({ isActive }) => (
                        <>
                        <SettingsIcon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`} />
                        <span>Configurações</span>
                        </>
                    )}
                    </NavLink>
                </li>
                </ul>
            </nav>

            {/* External Links Section */}
            <div className="mt-4 pt-4 border-t border-border-color space-y-2">
                <a
                href={customLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg bg-highlight-bg hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors duration-200 ease-in-out"
                title={customLinkTitle}
                >
                <ExternalLinkIcon size={20} />
                <span className="truncate">{customLinkTitle}</span>
                </a>
                <a
                href={googleDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg bg-highlight-bg hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors duration-200 ease-in-out"
                >
                <ExternalLinkIcon size={20} />
                <span>Acessar Drive</span>
                </a>
                <a
                href={googlePhotosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg bg-highlight-bg hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors duration-200 ease-in-out"
                >
                <ExternalLinkIcon size={20} />
                <span>Acessar Google Fotos</span>
                </a>
            </div>

            <div className="text-center text-xs text-text-secondary mt-auto pt-4 pb-2">
                <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
                <p>BIG Soluções</p>
                
                <button 
                    onClick={() => setIsBugModalOpen(true)}
                    className="mt-3 text-[10px] text-text-secondary opacity-60 hover:opacity-100 hover:text-red-500 transition-all flex items-center justify-center w-full gap-1"
                >
                    <Bug size={10} /> Encontrou um Bug? Clique para relatar.
                </button>
            </div>
        </div>
      </div>

      <Modal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} title="Relatar um Bug 🐛">
        <div className="space-y-4">
            <p className="text-sm text-text-secondary">Descreva o erro que você encontrou. Se possível, diga onde aconteceu e o que você estava fazendo.</p>
            <textarea
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="Ex: O botão de salvar não funcionou na tela de jobs..."
                className="w-full p-2 border border-border-color rounded-md bg-card-bg text-text-primary focus:ring-2 focus:ring-accent outline-none h-32"
            />
            <div className="flex justify-end">
                <button
                    onClick={handleReportBug}
                    disabled={isSubmittingBug}
                    className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all disabled:opacity-50"
                >
                    {isSubmittingBug ? "Enviando..." : "Enviar Reporte"}
                </button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
