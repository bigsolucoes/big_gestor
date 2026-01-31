
import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useNavigate } from 'react-router-dom';
import { Job, User } from '../types';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, VideoIcon, ClockIcon } from '../constants';
import { useAuth } from '../hooks/useAuth';

type CalendarViewMode = 'delivery' | 'recording' | 'all';

const TEAM_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#6366f1', // indigo-500
];

const generateColorForUsername = (username: string, colorMap: React.MutableRefObject<Map<string, string>>) => {
    if (colorMap.current.has(username)) {
        return colorMap.current.get(username);
    }
    const assignedColors = Array.from(colorMap.current.values());
    const availableColors = TEAM_COLORS.filter(c => !assignedColors.includes(c));
    const color = availableColors.length > 0 ? availableColors[0] : TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
    colorMap.current.set(username, color);
    return color;
};

interface CalendarEvent {
    job: Job;
    type: 'delivery' | 'recording';
    date: Date;
}

const CalendarPage: React.FC = () => {
  const { jobs, setJobForDetails, settings } = useAppData();
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('all');
  const navigate = useNavigate();
  const userColorMap = React.useRef(new Map<string, string>());

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1); // Avoid month-end issues
      newDate.setMonth(prevDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };
  
  const { monthName, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { monthName, year, daysInMonth, firstDayOfMonth };
  }, [currentDate]);

  const activeJobs = useMemo(() => jobs.filter(job => !job.isDeleted), [jobs]);

  const calendarGridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ key: `pad-${i}`, isPadding: true, day: 0, events: [] });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);

      const dayEvents: CalendarEvent[] = [];

      activeJobs.forEach(job => {
          // Check Delivery
          if (viewMode === 'delivery' || viewMode === 'all') {
              try {
                  const dDate = new Date(job.deadline);
                  if (new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate()).getTime() === date.getTime()) {
                      dayEvents.push({ job, type: 'delivery', date: dDate });
                  }
              } catch(e) {}
          }
          // Check Recording
          if (viewMode === 'recording' || viewMode === 'all') {
              try {
                  if (job.recordingDate) {
                      const rDate = new Date(job.recordingDate);
                      if (new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()).getTime() === date.getTime()) {
                           dayEvents.push({ job, type: 'recording', date: rDate });
                      }
                  }
              } catch(e) {}
          }
      });

      const today = new Date();
      const isToday = day === today.getDate() && 
                      currentDate.getMonth() === today.getMonth() &&
                      year === today.getFullYear();

      cells.push({ key: `day-${day}`, day, isToday, events: dayEvents, isPadding: false });
    }
    return cells;
  }, [firstDayOfMonth, daysInMonth, year, currentDate, activeJobs, viewMode]);
  
  const teamLegend = useMemo(() => {
    // Show legend for recording or all, as long as it's not just delivery (personal preference, usually recordings are team based)
    if (viewMode === 'delivery' || !currentUser) return null;
    const teamMembers = [currentUser.username, ...(settings.teamMembers || [])];
    return teamMembers.map(username => ({
        username,
        color: generateColorForUsername(username, userColorMap)
    }));
  }, [viewMode, settings.teamMembers, currentUser]);

  const handleEventClick = (job: Job) => {
    setJobForDetails(job);
    navigate('/jobs');
  };

  const EventPill: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const { job, type } = event;
    let pillColor = settings.accentColor || '#1e293b'; 

    // For recordings, color by user if possible
    if (type === 'recording') {
         pillColor = generateColorForUsername(job.ownerUsername || 'Desconhecido', userColorMap)!;
    }

    const Icon = type === 'recording' ? VideoIcon : ClockIcon;
    const titlePrefix = type === 'delivery' ? 'Entrega' : `Gravação`;
    
    return (
        <button 
        onClick={() => handleEventClick(job)}
        style={{ backgroundColor: pillColor }}
        className={`w-full text-left text-white px-1.5 py-0.5 text-xs rounded-sm mb-1 truncate hover:brightness-125 transition-all flex items-center gap-1`}
        title={`${titlePrefix} (${job.ownerUsername}): ${job.name}`}
        >
        <Icon size={10} className="flex-shrink-0" />
        <span className="truncate">{job.name}</span>
        </button>
    );
  };
  
  const ViewModeButton: React.FC<{
    value: CalendarViewMode;
    currentView: CalendarViewMode;
    onClick: (value: CalendarViewMode) => void;
    children: React.ReactNode;
  }> = ({ value, currentView, onClick, children }) => {
     const isActive = value === currentView;
     return (
        <button
            onClick={() => onClick(value)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                isActive ? 'bg-accent text-white shadow-sm' : 'hover:bg-hover-bg text-text-primary'
            }`}
        >
            {children}
        </button>
     );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
            <CalendarIcon size={32} className="text-accent mr-3" />
            <h1 className="text-3xl font-bold text-text-primary">Calendário de Eventos</h1>
        </div>
        <div className="flex items-center space-x-1 p-1 bg-highlight-bg rounded-lg overflow-x-auto max-w-full">
            <ViewModeButton value="all" currentView={viewMode} onClick={setViewMode}>Todos</ViewModeButton>
            <ViewModeButton value="delivery" currentView={viewMode} onClick={setViewMode}>Entregas</ViewModeButton>
            <ViewModeButton value="recording" currentView={viewMode} onClick={setViewMode}>Gravações</ViewModeButton>
        </div>
      </div>

      <div className="flex-grow bg-card-bg shadow-lg rounded-xl flex flex-col overflow-hidden border border-border-color">
        <header className="flex flex-wrap justify-between items-center p-3 border-b border-border-color">
          <div className="flex items-center">
            <button onClick={() => navigateDate('prev')} className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-hover-bg transition-colors" title="Mês Anterior">
              <ChevronLeftIcon size={24} />
            </button>
            <h2 className="text-xl font-semibold text-text-primary mx-4 w-52 text-center capitalize">{monthName}</h2>
            <button onClick={() => navigateDate('next')} className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-hover-bg transition-colors" title="Próximo Mês">
              <ChevronRightIcon size={24} />
            </button>
             <button onClick={() => navigateDate('today')} className="ml-4 px-3 py-1.5 text-sm font-semibold border border-border-color rounded-md hover:bg-subtle-bg transition-colors">
              Hoje
            </button>
          </div>
          {teamLegend && (
            <div className="flex items-center space-x-3 mt-2 md:mt-0 overflow-x-auto max-w-full">
                {teamLegend.map(({ username, color }) => (
                    <div key={username} className="flex items-center whitespace-nowrap">
                        <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: color }}></span>
                        <span className="text-xs font-medium text-text-secondary">{username === currentUser?.username ? 'Você' : username}</span>
                    </div>
                ))}
            </div>
          )}
        </header>
        
        <>
            <div className="grid grid-cols-7 text-center font-semibold text-text-secondary text-sm p-2 border-b border-border-color">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 flex-grow bg-highlight-bg gap-px">
              {calendarGridCells.map(cell => (
                <div key={cell.key} className={`bg-card-bg p-1.5 overflow-hidden ${cell.isPadding ? 'bg-subtle-bg' : ''}`}>
                  {!cell.isPadding && (
                    <>
                      <span className={`text-sm font-medium ${cell.isToday ? 'bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-text-secondary'}`}>
                        {cell.day}
                      </span>
                      <div className="mt-1 space-y-0.5 max-h-[90px] overflow-y-auto">
                        {cell.events?.map((event, idx) => <EventPill key={`${event.job.id}-${idx}`} event={event} />)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
      </div>
    </div>
  );
};

export default CalendarPage;
