
import React, { useState, useEffect, useRef } from 'react';
import { Job, Client, JobStatus, Task, DraftNote, User, Contract } from '../types';
import { useAppData } from '../hooks/useAppData';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
    XIcon, PencilIcon, TrashIcon, PlusIcon, LinkIcon, CurrencyDollarIcon, ArchiveIcon, ContractIcon, CheckSquareIcon, ListBulletIcon
} from '../constants';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import LinkDraftModal from './modals/LinkDraftModal';
import ViewContractModal from './modals/ViewContractModal';

interface JobDetailsPanelProps {
  job: Job;
  client?: Client;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: Job) => void;
  onDelete: (jobId: string) => void; 
  onRegisterPayment: (job: Job) => void;
  onOpenArchive: () => void;
  onOpenTrash: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg border-b-2
                ${active ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:border-slate-300 hover:text-text-primary'}`}
  >
    {children}
  </button>
);

const DetailsTabContent: React.FC<{ job: Job, client?: Client, isOwner: boolean }> = ({ job, client, isOwner }) => {
    const { settings, contracts } = useAppData();
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);

    const { totalPaid, remaining } = getJobPaymentSummary(job);
    const linkedContract = contracts.find(c => c.id === job.linkedContractId);
    
    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case JobStatus.BRIEFING: return 'bg-slate-200 text-slate-700';
            case JobStatus.PRODUCTION: return 'bg-indigo-200 text-indigo-700';
            case JobStatus.REVIEW: return 'bg-yellow-200 text-yellow-700';
            case JobStatus.OTHER: return 'bg-purple-200 text-purple-700';
            case JobStatus.FINALIZED: return 'bg-blue-200 text-blue-700';
            case JobStatus.PAID: return 'bg-green-200 text-green-700';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-1">Status</h3>
            <p className={`text-sm font-semibold px-2 py-1 inline-block rounded-full ${getStatusColor(job.status)}`}>{job.status}</p>
          </section>
          
          <section className="bg-subtle-bg p-4 rounded-lg border border-border-color">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Resumo Financeiro</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                    <p className="text-xs text-text-secondary font-medium">VALOR TOTAL</p>
                    <p className="font-bold text-text-primary text-lg">{formatCurrency(job.value, settings.privacyModeEnabled)}</p>
                </div>
                 <div>
                    <p className="text-xs text-text-secondary font-medium">TOTAL PAGO</p>
                    <p className="font-bold text-green-600 text-lg">{formatCurrency(totalPaid, settings.privacyModeEnabled)}</p>
                </div>
                 <div>
                    <p className="text-xs text-text-secondary font-medium">SALDO RESTANTE</p>
                    <p className="font-bold text-red-600 text-lg">{formatCurrency(remaining, settings.privacyModeEnabled)}</p>
                </div>
            </div>
            {job.payments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border-color">
                     <h4 className="text-sm font-medium text-text-secondary mb-2">Histórico de Pagamentos</h4>
                     <ul className="space-y-1 text-sm">
                        {job.payments.map(p => (
                            <li key={p.id} className="flex justify-between items-center bg-card-bg p-2 rounded">
                                <span>{formatDate(p.date, {dateStyle: 'short'})}: {p.notes || p.method || 'Pagamento'}</span>
                                <span className="font-semibold">{formatCurrency(p.amount, settings.privacyModeEnabled)}</span>
                            </li>
                        ))}
                     </ul>
                </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <section>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Cliente</h3>
                <p className="text-text-primary font-medium">{client?.name || 'N/A'}</p>
                {client?.company && <p className="text-xs text-text-secondary">{client.company}</p>}
            </section>
            <section>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Tipo de Serviço</h3>
                <p className="text-text-primary">
                    {job.serviceType}
                    {job.customServiceType && <span className="block text-xs text-accent italic">{job.customServiceType}</span>}
                </p>
            </section>
            <section>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Prazo</h3>
                <p className="text-text-primary">{formatDate(job.deadline)}</p>
            </section>
             <section>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Criado por</h3>
                <p className="text-text-primary text-sm font-semibold">{job.ownerUsername}</p>
            </section>
          </div>
          
          {linkedContract && (
            <section>
                 <h3 className="text-lg font-semibold text-text-primary mb-2">Contrato Vinculado</h3>
                 <button onClick={() => setIsContractModalOpen(true)} className="flex items-center space-x-2 text-accent hover:underline text-sm font-semibold p-2 rounded-lg hover:bg-hover-bg">
                    <ContractIcon size={18} />
                    <span>{linkedContract.title}</span>
                 </button>
                 <ViewContractModal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} contract={linkedContract} />
            </section>
          )}

          {(job.cloudLinks && job.cloudLinks.length > 0) && (
            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Links da Nuvem</h3>
              <ul className="space-y-2">
                {job.cloudLinks.map((link, index) => link && (
                  <li key={index} className="flex items-center space-x-2">
                    <LinkIcon size={18} />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-sm truncate"
                      title={link}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.notes && (
            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Notas Gerais</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap bg-subtle-bg p-3 rounded-md">{job.notes}</p>
            </section>
          )}
        </div>
    );
};

const ActivitiesTab: React.FC<{ job: Job, onUpdateTasks: (tasks: Task[]) => void, isOwner: boolean }> = ({ job, onUpdateTasks, isOwner }) => {
    const [newItemText, setNewItemText] = useState('');

    const handleAddItem = () => {
        if (!newItemText.trim()) return;
        const newTask: Task = { id: uuidv4(), text: newItemText.trim(), isCompleted: false };
        onUpdateTasks([...(job.tasks || []), newTask]);
        setNewItemText('');
        toast.success("Atualização adicionada!");
    };

    const toggleTask = (taskId: string) => {
        const updatedTasks = (job.tasks || []).map(task =>
            task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        );
        onUpdateTasks(updatedTasks);
    };

    const deleteTask = (taskId: string) => {
        onUpdateTasks((job.tasks || []).filter(task => task.id !== taskId));
    };

    return (
        <div className="space-y-6">
             <div className="flex space-x-2">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {if(e.key === 'Enter'){ e.preventDefault(); handleAddItem();}}}
                    placeholder={isOwner ? "Adicionar atualização, tarefa ou obs..." : "Apenas o proprietário pode adicionar itens."}
                    className="flex-grow p-2 border border-border-color rounded-md text-sm outline-none focus:ring-2 focus:ring-accent disabled:bg-subtle-bg"
                    disabled={!isOwner}
                />
                <button onClick={handleAddItem} className="bg-accent text-white px-3 rounded-md hover:brightness-90 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isOwner}><PlusIcon size={20} /></button>
            </div>
            
            <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                {(job.tasks || []).length === 0 && (job.observationsLog || []).length === 0 && (
                    <p className="text-center text-text-secondary text-sm py-4">Nenhuma atividade registrada.</p>
                )}
                
                {/* Active Tasks/Updates */}
                {[...(job.tasks || [])].reverse().map(task => (
                    <div key={task.id} className="flex items-start p-3 bg-subtle-bg rounded-md group hover:bg-hover-bg transition-colors">
                        <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => toggleTask(task.id)}
                            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                            disabled={!isOwner}
                        />
                        <span className={`flex-grow mx-3 text-sm whitespace-pre-wrap ${task.isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.text}</span>
                        {isOwner && (
                            <button onClick={() => deleteTask(task.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full flex-shrink-0">
                                <TrashIcon size={16}/>
                            </button>
                        )}
                    </div>
                ))}
                
                {/* Legacy Observations Log (Read Only) */}
                {job.observationsLog && job.observationsLog.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border-color">
                         <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">Histórico Antigo (Legado)</h4>
                         <div className="space-y-2 opacity-80">
                            {[...job.observationsLog].reverse().map(obs => (
                                <div key={obs.id} className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{obs.text}</p>
                                    <p className="text-xs text-slate-400 mt-1 text-right">{formatDate(obs.timestamp, { dateStyle: 'short', timeStyle: 'short' })}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DraftsTab: React.FC<{ job: Job, onUpdateLinkedDrafts: (draftIds: string[]) => void; onClosePanel: () => void; isOwner: boolean; }> = ({ job, onUpdateLinkedDrafts, onClosePanel, isOwner }) => {
    const { draftNotes, setDraftForDetails } = useAppData();
    const navigate = useNavigate();
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const linkedDrafts = (job.linkedDraftIds || [])
        .map(id => draftNotes.find(d => d.id === id))
        .filter((d): d is DraftNote => d !== undefined);

    const handleDraftClick = (draft: DraftNote) => {
        setDraftForDetails(draft);
        onClosePanel(); // Close the panel before navigating
        navigate('/drafts');
    };

    const handleUnlink = (draftId: string) => {
        onUpdateLinkedDrafts((job.linkedDraftIds || []).filter(id => id !== draftId));
        toast.success("Rascunho desvinculado.");
    };

    return (
        <div>
            <button
                onClick={() => setIsLinkModalOpen(true)}
                className="w-full bg-accent text-white py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center justify-center mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isOwner}
            >
                <PlusIcon size={20} className="mr-2"/> Vincular Roteiro Existente
            </button>
            <div className="space-y-2">
                {linkedDrafts.length > 0 ? linkedDrafts.map(draft => (
                    <div key={draft.id} className="flex items-center justify-between p-3 bg-subtle-bg rounded-md group">
                        <div>
                            <button onClick={() => handleDraftClick(draft)} className="font-medium text-accent hover:underline">{draft.title}</button>
                            <p className="text-xs text-text-secondary">{draft.type === 'SCRIPT' ? 'Roteiro' : 'Texto'}</p>
                        </div>
                        {isOwner && (
                            <button onClick={() => handleUnlink(draft.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full" title="Desvincular">
                                <TrashIcon size={16}/>
                            </button>
                        )}
                    </div>
                )) : <p className="text-center text-text-secondary text-sm">Nenhum roteiro vinculado.</p>}
            </div>
            {isLinkModalOpen && (
                 <LinkDraftModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    onLink={onUpdateLinkedDrafts}
                    currentlyLinkedIds={job.linkedDraftIds || []}
                 />
            )}
        </div>
    );
};

const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({
  job,
  client,
  currentUser,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRegisterPayment,
  onOpenArchive,
  onOpenTrash,
}) => {
  const { updateJob } = useAppData();
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'drafts'>('details');
  const panelRef = useRef<HTMLDivElement>(null);
  const isOwner = job.ownerId === currentUser.id;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (job) {
      setActiveTab('details');
    }
  }, [job]);

  const handleUpdateTasks = (tasks: Task[]) => {
    updateJob({ ...job, tasks });
  };

  const handleUpdateLinkedDrafts = (linkedDraftIds: string[]) => {
      updateJob({ ...job, linkedDraftIds });
  };
  
  if (!isOpen) return null;

  return (
    <div 
        className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose} 
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()} 
        className={`fixed top-0 right-0 h-full w-full max-w-md md:max-w-lg bg-card-bg shadow-2xl 
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-modal="true" role="dialog" aria-labelledby="job-details-panel-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-color sticky top-0 bg-card-bg z-10">
          <h2 id="job-details-panel-title" className="text-xl font-semibold text-text-primary truncate" title={job.name}>
            {job.name}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-accent p-1 rounded-full transition-colors" aria-label="Fechar painel">
            <XIcon size={24} />
          </button>
        </div>

        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="px-4 border-b border-border-color flex space-x-2 bg-subtle-bg">
                <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Visão Geral</TabButton>
                <TabButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')}>Atividades</TabButton>
                <TabButton active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')}>Roteiros</TabButton>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
                {activeTab === 'details' && <DetailsTabContent job={job} client={client} isOwner={isOwner} />}
                {activeTab === 'activities' && <ActivitiesTab job={job} onUpdateTasks={handleUpdateTasks} isOwner={isOwner} />}
                {activeTab === 'drafts' && <DraftsTab job={job} onUpdateLinkedDrafts={handleUpdateLinkedDrafts} onClosePanel={onClose} isOwner={isOwner} />}
            </div>
        </div>

        <div className="p-4 border-t border-border-color sticky bottom-0 bg-card-bg z-10">
            <div className="flex flex-wrap gap-2 justify-end">
                {job.status !== JobStatus.PAID && (
                    <button
                        onClick={() => onRegisterPayment(job)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isOwner}
                        title={!isOwner ? "Apenas o proprietário pode registrar pagamentos" : ""}
                    >
                    <CurrencyDollarIcon size={18} /> <span className="ml-1">Registrar Pagamento</span>
                    </button>
                )}
                <button
                    onClick={() => onEdit(job)}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg shadow transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isOwner}
                    title={!isOwner ? "Apenas o proprietário pode editar" : ""}
                >
                    <PencilIcon size={18} /> <span className="ml-1">Editar Job</span>
                </button>
                <button
                    onClick={() => onDelete(job.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isOwner}
                    title={!isOwner ? "Apenas o proprietário pode excluir" : ""}
                >
                <TrashIcon size={18} /> <span className="ml-1">Mover para Lixeira</span>
                </button>
            </div>
            <div className="mt-4 pt-4 border-t border-border-color flex items-center justify-start gap-4">
                 <button
                    onClick={onOpenArchive}
                    className="text-text-secondary hover:text-accent transition-colors flex items-center gap-2 text-sm font-medium p-2 rounded-lg hover:bg-hover-bg"
                    title="Ver todos os jobs arquivados"
                >
                    <ArchiveIcon size={18} />
                    <span>Ver Arquivo</span>
                </button>
                <button
                    onClick={onOpenTrash}
                    className="text-text-secondary hover:text-accent transition-colors flex items-center gap-2 text-sm font-medium p-2 rounded-lg hover:bg-hover-bg"
                    title="Ver jobs na lixeira"
                >
                    <TrashIcon size={18} />
                    <span>Ver Lixeira</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPanel;
