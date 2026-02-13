
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth'; 
import { APP_NAME, SettingsIcon, EyeOpenIcon, EyeClosedIcon, LogOutIcon, BellIcon, LOGO_LIGHT_THEME_BASE64, LOGO_DARK_THEME_BASE64, ListBulletIcon } from '../constants';
import { Notification } from '../types';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
    notifications: Notification[];
    markNotificationsAsRead: (notificationId: string) => void;
    onToggleMobileMenu: () => void; // New prop
}

const Header: React.FC<HeaderProps> = ({ notifications, markNotificationsAsRead, onToggleMobileMenu }) => {
  const { settings, updateSettings } = useAppData();
  const { currentUser, logout } = useAuth(); 
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogoClick = () => {
    if (currentUser) {
      navigate('/rest'); 
    }
  };

  const togglePrivacyMode = () => {
    updateSettings({ privacyModeEnabled: !settings.privacyModeEnabled });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
        markNotificationsAsRead(notification.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelRef]);

  return (
    <header className="bg-card-bg text-text-primary py-4 px-4 sm:px-8 shadow-md flex justify-between items-center h-20 sticky top-0 z-20 select-none">
      <div className="flex items-center">
        {/* Mobile Menu Button */}
        <button 
            onClick={onToggleMobileMenu}
            className="mr-3 md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-hover-bg rounded-lg"
        >
            <ListBulletIcon size={24} />
        </button>

        {/* Logo */}
        <div 
            onClick={handleLogoClick}
            className="cursor-pointer flex items-center"
            title="Ir para a tela de descanso"
        >
            <img src={LOGO_LIGHT_THEME_BASE64} alt={`${APP_NAME} Logo`} className="logo-light h-10 sm:h-12 max-h-full max-w-[150px] object-contain" />
            <img src={LOGO_DARK_THEME_BASE64} alt={`${APP_NAME} Logo`} className="logo-dark h-10 sm:h-12 max-h-full max-w-[150px] object-contain" />
        </div>
      </div>

      {/* Icons on the right */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsPanelOpen(prev => !prev)}
                className="p-2 text-text-secondary hover:text-accent transition-colors relative"
                title="Notificações"
            >
                <BellIcon size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-card-bg"></span>
                )}
            </button>
            {isPanelOpen && (
                <NotificationsPanel
                    notifications={notifications}
                    onClose={() => setIsPanelOpen(false)}
                    onNotificationClick={handleNotificationClick}
                />
            )}
        </div>

        <button
          onClick={togglePrivacyMode}
          className="p-2 text-text-secondary hover:text-accent transition-colors hidden sm:block"
          title={settings.privacyModeEnabled ? "Mostrar Valores Monetários" : "Ocultar Valores Monetários"}
        >
          {settings.privacyModeEnabled ? <EyeClosedIcon size={20} /> : <EyeOpenIcon size={20} />}
        </button>
        
        {/* Updated: Removed 'hidden sm:block' to show on mobile */}
        <Link 
          to="/settings" 
          className="p-2 text-text-secondary hover:text-accent transition-colors"
          title="Configurações"
        >
          <SettingsIcon size={20} />
        </Link>
        
        <button
          onClick={logout}
          className="p-2 text-text-secondary hover:text-red-500 transition-colors"
          title="Sair da conta"
        >
          <LogOutIcon size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
