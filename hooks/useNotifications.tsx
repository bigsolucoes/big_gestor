
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAppData } from './useAppData';
import { Notification, JobStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface NotificationsContextType {
  notifications: Notification[];
  markAsRead: (notificationId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { jobs, clients } = useAppData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const storedIds = localStorage.getItem('big_read_notifications');
      return storedIds ? new Set(JSON.parse(storedIds)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!jobs || !clients) return;

    const generatedNotifications: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneDay = 1000 * 60 * 60 * 24;

    // 1. Deadline & Overdue Notifications
    jobs.forEach(job => {
      if (job.isDeleted || job.status === JobStatus.PAID) return;

      try {
        const deadline = new Date(job.deadline);
        deadline.setHours(0,0,0,0);
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / oneDay);

        if (diffDays < 0) {
          generatedNotifications.push({
            id: `overdue-${job.id}`,
            type: 'overdue',
            message: `O job "${job.name}" está atrasado há ${Math.abs(diffDays)} dia(s).`,
            linkTo: `/jobs`,
            isRead: false,
            entityId: job.id,
          });
        } else if (diffDays <= 2) {
          const dayString = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanhã' : `em ${diffDays} dias`;
          generatedNotifications.push({
            id: `deadline-${job.id}`,
            type: 'deadline',
            message: `O prazo do job "${job.name}" é ${dayString}.`,
            linkTo: `/jobs`,
            isRead: false,
            entityId: job.id,
          });
        }
      } catch (e) {
        console.warn("Could not process deadline for job:", job.id, e);
      }
    });

    // 2. Client Notifications (Inactive & Birthday)
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);
    
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365);

    clients.forEach(client => {
      // 2a. Birthday
      if (client.birthday) {
          try {
              const [bYear, bMonth, bDay] = client.birthday.split('-').map(Number);
              // Month is 0-indexed in JS Date
              if (today.getDate() === bDay && today.getMonth() === (bMonth - 1)) {
                  generatedNotifications.push({
                    id: `bday-${client.id}-${today.getFullYear()}`,
                    type: 'birthday',
                    message: `Hoje é o aniversário de ${client.name}! 🎉`,
                    linkTo: `/clients/${client.id}`,
                    isRead: false,
                    entityId: client.id
                  });
              }
          } catch(e) {}
      }

      // 2b. Inactivity
      const clientJobs = jobs.filter(j => j.clientId === client.id && !j.isDeleted);
      if (clientJobs.length > 0) {
        const mostRecentJobDate = new Date(
          Math.max(...clientJobs.map(j => new Date(j.createdAt).getTime()))
        );
        
        // 1 Year Inactive (Priority)
        if (mostRecentJobDate < oneYearAgo) {
            generatedNotifications.push({
                id: `client-1yr-${client.id}`,
                type: 'client',
                message: `O cliente "${client.name}" não contrata nada há 1 ANO. Hora de reativar contato?`,
                linkTo: `/clients/${client.id}`,
                isRead: false,
                entityId: client.id,
              });
        } 
        // 60 Days Inactive (Lower Priority, only show if not 1 year)
        else if (mostRecentJobDate < sixtyDaysAgo) {
          generatedNotifications.push({
            id: `client-60d-${client.id}`,
            type: 'client',
            message: `O cliente "${client.name}" não tem novos jobs há mais de 60 dias.`,
            linkTo: `/clients/${client.id}`,
            isRead: false,
            entityId: client.id,
          });
        }
      }
    });

    const finalNotifications = generatedNotifications.map(n => ({
        ...n,
        isRead: readNotificationIds.has(n.id),
    }));

    setNotifications(finalNotifications);
  }, [jobs, clients, readNotificationIds]);

  const markAsRead = useCallback((notificationId: string) => {
    setReadNotificationIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.add(notificationId);
        try {
          localStorage.setItem('big_read_notifications', JSON.stringify(Array.from(newIds)));
        } catch (e) {
          console.error("Failed to save read notifications to localStorage", e);
        }
        return newIds;
    });
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, markAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
