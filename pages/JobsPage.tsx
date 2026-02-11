
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, JobStatus, Client, User, Annotation } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { 
    KANBAN_COLUMNS, PlusCircleIcon, BriefcaseIcon, 
    ListBulletIcon, CurrencyDollarIcon, TableCellsIcon,
    ArchiveIcon, TrashIcon, CheckSquareIcon, UsersIcon, PencilIcon, SaveIcon, XIcon
} from '../constants';
import Modal from '../components/Modal';
import JobForm from './forms/JobForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import JobListTableView from '../components/JobListTableView';
import PaymentRegistrationModal from '../components/modals/PaymentRegistrationModal';
import JobDetailsPanel from '../components/JobDetailsPanel'; 
import TrashModal from '../components/modals/TrashModal'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AnnotationsPanel from '../components/AnnotationsPanel';
import AnnotationsButton from '../components/AnnotationsButton';

const JobCard: React.FC<{ 
  job: Job; 
  client?: Client; 
  currentUser: User;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, jobId: string) => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onUpdateAnnotations?: (jobId: string, annotations: Annotation[]) => void;
}> = ({ job, client, currentUser, onClick, onDragStart, onArchive, onDelete, onUpdateAnnotations }) => {
  const { settings } = useAppData();
  const [showAnnotations, setShowAnnotations] = useState(false);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const deadlineDate = new Date(job.deadline);
  deadlineDate.setHours(0,0,0,0);

  const isOwner = job.ownerId === currentUser.id;
  const isOverdue = deadlineDate < today && job.status !== JobStatus.PAID && job.status !== JobStatus.FINALIZED;
  const { totalPaid, isFullyPaid } = getJobPaymentSummary(job);
  const paymentProgress = job.value > 0 ? (totalPaid / job.value) * 100 : (isFullyPaid ? 100 : 0);

  const completedTasks = job.tasks?.filter(t => t.isCompleted).length || 0;
  const totalTasks = job.tasks?.length || 0;
  const annotationsCount = job.annotations?.length || 0;

  const handleUpdateAnnotations = (annotations: Annotation[]) => {
    if (onUpdateAnnotations) {
      onUpdateAnnotations(job.id, annotations);
    }
  };

  return (
    <div 
      draggable={isOwner}
      onDragStart={(e) => isOwner && onDragStart(e, job.id)}
      className={`mb-3 rounded-lg shadow-md bg-card-bg hover:shadow-lg transition-all duration-200 
                  flex items-start gap-3 p-4 border-l-4 ${isOwner ? 'border-accent' : 'border-slate-300'}
                  ${isOwner ? 'cursor-grab active:cursor-grabbing' : 'opacity-90'}`}
    >
      <div className={`flex flex-col items-center space-y-1 pt-1 ${isOwner ? '' : 'hidden'}`}>
        <button 
          onClick={onArchive} 
          className="p-1 text-slate-500 hover:text-green-500 hover:bg-green-100 rounded-full transition-colors"
          title="Arquivar Job"
        >
          <ArchiveIcon size={18} />
        </button>
        <button 
          onClick={onDelete} 
          className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
          title="Mover para Lixeira"
        >
          <TrashIcon size={18} />
        </button>
        <AnnotationsButton
          count={annotationsCount}
          onClick={() => setShowAnnotations(true)}
        />
      </div>

      <div className="flex-grow cursor-pointer" onClick={onClick}>
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-text-primary pr-2 break-words" title={job.name}>{job.name}</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-highlight-bg text-text-secondary'}`}>
                {formatDate(job.deadline)}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">{client?.name || 'Cliente desconhecido'}</p>
          {job.serviceType === 'Outro' && job.customServiceType && (
             <p className="text-xs text-accent font-medium mt-0.5 italic">{job.customServiceType}</p>
          )}
          {!isOwner && (
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center"><UsersIcon size={12} className="mr-1"/>{job.ownerUsername}</p>
          )}
          
          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <div className="flex items-center" title="Progresso de Pagamento">
                  <CurrencyDollarIcon size={14} />
                  <span className="ml-1">{formatCurrency(totalPaid, settings.privacyModeEnabled)} / {formatCurrency(job.value, settings.privacyModeEnabled)}</span>
              </div>
              {totalTasks > 0 && (
                  <div className="flex items-center" title="Progresso das Tarefas">
                      <CheckSquareIcon size={14} />
                      <span className="ml-1">{completedTasks}/{totalTasks}</span>
                  </div>
              )}
          </div>
          {job.value > 0 && (
              <div className="w-full bg-highlight-bg rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${paymentProgress}%` }}></div>
              </div>
          )}
      </div>
      
      {/* Annotations Panel */}
      <AnnotationsPanel
        annotations={job.annotations || []}
        currentUser={currentUser}
        parentId={job.id}
        type="job"
        onUpdateAnnotations={handleUpdateAnnotations}
        isOpen={showAnnotations}
        onClose={() => setShowAnnotations(false)}
      />
    </div>
  );
};


const JobsPage: React.FC = () => {
  const { jobs, clients, updateJob, deleteJob, setJobForDetails, jobForDetails, settings, updateSettings, loading } = useAppData();
  const { currentUser } = useAuth();
  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [jobForPayment, setJobForPayment] = useState<Job | undefined>(undefined);
  const [isTrashModalOpen, setTrashModalOpen] = useState(false);
  const navigate = useNavigate();

  // Kanban Column Renaming State
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [tempColumnTitle, setTempColumnTitle] = useState('');

  useEffect(() => {
    const savedViewMode = localStorage.getItem('big_job_view_mode');
    if (savedViewMode === 'list' || savedViewMode === 'kanban') {
      setViewMode(savedViewMode);
    }
  }, []);
  
  const handleSetViewMode = (mode: 'kanban' | 'list') => {
    localStorage.setItem('big_job_view_mode', mode);
    setViewMode(mode);
  };

  const filteredJobs = useMemo(() => {
    if (!currentUser) return [];
    
    console.log('🔍 Debug - Filtrando jobs:', {
      totalJobs: jobs.length,
      currentUserId: currentUser.id,
      currentUserUsername: currentUser.username
    });
    
    const filtered = jobs.filter(job => {
      // Verificar se não está deletado
      if (job.isDeleted) {
        console.log(`❌ Job "${job.name}" excluído, não mostrando`);
        return false;
      }
      
      // Verificar propriedade por ID ou Username (fallback)
      const isOwnerById = job.ownerId === currentUser.id;
      const isOwnerByUsername = job.ownerUsername === currentUser.username;
      const isTeamMember = job.isTeamJob === true;
      
      const shouldShow = isOwnerById || isOwnerByUsername || isTeamMember;
      
      if (!shouldShow) {
        console.log(`❌ Job "${job.name}" não pertence ao usuário:`, {
          jobOwnerId: job.ownerId,
          jobOwnerUsername: job.ownerUsername,
          isTeamJob: job.isTeamJob,
          isOwnerById,
          isOwnerByUsername,
          isTeamMember
        });
      } else {
        console.log(`✅ Job "${job.name}" será mostrado`);
      }
      
      return shouldShow;
    });
    
    console.log(`📊 Resultado: ${filtered.length} jobs serão mostrados de ${jobs.length} totais`);
    return filtered;
  }, [jobs, currentUser]);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, jobId: string) => {
    e.dataTransfer.setData("jobId", jobId);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: JobStatus) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    const jobToUpdate = jobs.find(j => j.id === jobId);

    if (jobToUpdate && jobToUpdate.status !== newStatus) {
      if (newStatus === JobStatus.PAID) {
        setJobForPayment(jobToUpdate);
        setPaymentModalOpen(true);
      } else {
        updateJob({ ...jobToUpdate, status: newStatus });
        toast.success(`Job movido para ${newStatus}`);
      }
    }
    e.currentTarget.classList.remove('border-accent', 'border-2', 'border-dashed');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-accent', 'border-2', 'border-dashed');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-accent', 'border-2', 'border-dashed');
  };

  const openJobModal = (job?: Job) => {
    setEditingJob(job);
    setJobModalOpen(true);
  };
  
  const closeJobModal = () => {
    setEditingJob(undefined);
    setJobModalOpen(false);
  };

  const handleJobClick = (job: Job) => {
    setJobForDetails(job);
  };

  const handleDeleteJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && window.confirm(`Tem certeza que deseja mover "${job.name}" para a lixeira?`)) {
      deleteJob(jobId);
      toast.success('Job movido para a lixeira!');
    }
  };

  const handleArchiveJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if(job && window.confirm(`Tem certeza que deseja arquivar o job "${job.name}"? Ele será movido para o Arquivo Morto.`)){
        updateJob({ ...job, status: JobStatus.PAID });
        toast.success('Job arquivado com sucesso!');
    }
  };

  // Kanban Column Editing
  const startEditingColumn = (columnId: string, currentTitle: string) => {
      setEditingColumnId(columnId);
      setTempColumnTitle(currentTitle);
  };

  const saveColumnTitle = (columnId: string) => {
      if (tempColumnTitle.trim()) {
          const newColumns = { ...settings.kanbanColumns, [columnId]: tempColumnTitle };
          updateSettings({ kanbanColumns: newColumns });
          toast.success("Coluna renomeada!");
      }
      setEditingColumnId(null);
  };

  const cancelEditingColumn = () => {
      setEditingColumnId(null);
      setTempColumnTitle('');
  };

  const handleUpdateJobAnnotations = (jobId: string, annotations: Annotation[]) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      updateJob({ ...job, annotations });
      toast.success('Anotações atualizadas!');
    }
  };
  
  if (loading || !currentUser) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-text-primary">Jobs</h1>
        <div className="flex items-center space-x-2">
             <div className="p-1 bg-highlight-bg rounded-lg flex items-center space-x-1">
                <button 
                    onClick={() => navigate('/archive')} 
                    className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                    title="Ver Arquivo Morto"
                >
                    <ArchiveIcon size={16} className="mr-1.5"/> Arquivo
                </button>
                <button 
                    onClick={() => setTrashModalOpen(true)} 
                    className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                    title="Ver Lixeira"
                >
                    <TrashIcon size={16} className="mr-1.5"/> Lixeira
                </button>
                
                <div className="h-5 w-px bg-border-color mx-1"></div>

                <button onClick={() => handleSetViewMode('kanban')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center ${viewMode === 'kanban' ? 'bg-accent text-white shadow-sm' : 'text-text-primary hover:bg-hover-bg'}`}><TableCellsIcon size={16} className="mr-1.5"/> Kanban</button>
                <button onClick={() => handleSetViewMode('list')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center ${viewMode === 'list' ? 'bg-accent text-white shadow-sm' : 'text-text-primary hover:bg-hover-bg'}`}><ListBulletIcon size={16} className="mr-1.5"/> Lista</button>
            </div>
          <button
            onClick={() => openJobModal()}
            className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center"
          >
            <PlusCircleIcon size={20} /> <span className="ml-2">Novo Job</span>
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(column => {
            const columnTitle = settings.kanbanColumns?.[column.id] || column.title;
            const isEditing = editingColumnId === column.id;

            return (
                <div
                key={column.id}
                onDrop={(e) => handleDrop(e, column.status)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className="bg-subtle-bg p-3 rounded-lg min-h-[500px] transition-all"
                >
                <div className="font-semibold mb-3 text-text-primary text-center pb-2 border-b-2 border-border-color flex justify-center items-center group relative h-8">
                    {isEditing ? (
                        <div className="flex items-center space-x-1 absolute inset-0 bg-subtle-bg">
                            <input 
                                type="text" 
                                value={tempColumnTitle} 
                                onChange={(e) => setTempColumnTitle(e.target.value)} 
                                autoFocus
                                className="w-full text-sm p-1 border rounded"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') saveColumnTitle(column.id);
                                    if(e.key === 'Escape') cancelEditingColumn();
                                }}
                            />
                            <button onClick={() => saveColumnTitle(column.id)} className="text-green-600 hover:text-green-800"><SaveIcon size={16}/></button>
                            <button onClick={cancelEditingColumn} className="text-red-600 hover:text-red-800"><XIcon size={16}/></button>
                        </div>
                    ) : (
                        <>
                            <span>{columnTitle}</span>
                            <button 
                                onClick={() => startEditingColumn(column.id, columnTitle)} 
                                className="ml-2 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-accent transition-opacity absolute right-0"
                                title="Renomear coluna"
                            >
                                <PencilIcon size={14}/>
                            </button>
                        </>
                    )}
                </div>
                {filteredJobs
                    .filter(job => job.status === column.status)
                    .map(job => (
                    <JobCard
                        key={job.id}
                        job={job}
                        client={clients.find(c => c.id === job.clientId)}
                        currentUser={currentUser}
                        onClick={() => handleJobClick(job)}
                        onDragStart={handleDragStart}
                        onArchive={(e) => { e.stopPropagation(); handleArchiveJob(job.id); }}
                        onDelete={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                        onUpdateAnnotations={handleUpdateJobAnnotations}
                    />
                    ))}
                </div>
            );
          })}
        </div>
      ) : (
        <JobListTableView 
            jobs={filteredJobs} 
            clients={clients}
            currentUser={currentUser}
            onEditJob={openJobModal} 
            onDeleteJob={handleDeleteJob} 
            privacyModeEnabled={settings.privacyModeEnabled || false}
        />
      )}
      
      <Modal isOpen={isJobModalOpen} onClose={closeJobModal} title={editingJob ? 'Editar Job' : 'Adicionar Novo Job'} size="lg">
        <JobForm onSuccess={closeJobModal} jobToEdit={editingJob} />
      </Modal>
      
      {jobForPayment && <PaymentRegistrationModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        job={jobForPayment}
        onSuccess={() => { setPaymentModalOpen(false); setJobForPayment(undefined); }}
      />}

      <Modal isOpen={isTrashModalOpen} onClose={() => setTrashModalOpen(false)} title="Lixeira de Jobs" size="lg">
        <TrashModal onClose={() => setTrashModalOpen(false)} />
      </Modal>
      
      {jobForDetails && (
        <JobDetailsPanel 
            job={jobForDetails}
            client={clients.find(c => c.id === jobForDetails.clientId)}
            currentUser={currentUser}
            isOpen={!!jobForDetails}
            onClose={() => setJobForDetails(null)}
            onEdit={(job) => { setJobForDetails(null); openJobModal(job); }}
            onDelete={(jobId) => { setJobForDetails(null); handleDeleteJob(jobId); }}
            onRegisterPayment={(job) => { setJobForDetails(null); setJobForPayment(job); setPaymentModalOpen(true); }}
            onOpenArchive={() => { setJobForDetails(null); navigate('/archive'); }}
            onOpenTrash={() => { setJobForDetails(null); setTrashModalOpen(true); }}
        />
      )}

    </div>
  );
};

export default JobsPage;
