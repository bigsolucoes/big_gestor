
import React, { useMemo } from 'react';
import { Contract, Job, User } from '../types';
import { useAppData } from '../hooks/useAppData';
import { XIcon, PencilIcon, TrashIcon, BriefcaseIcon, CalendarIcon } from '../constants';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ContractDetailsPanelProps {
  contract: Contract;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contract: Contract) => void;
}

const ContractDetailsPanel: React.FC<ContractDetailsPanelProps> = ({ contract, currentUser, isOpen, onClose, onEdit }) => {
  const { clients, jobs, deleteContract, setJobForDetails } = useAppData();
  const navigate = useNavigate();

  const client = useMemo(() => clients.find(c => c.id === contract.clientId), [clients, contract.clientId]);
  const linkedJobs = useMemo(() => jobs.filter(j => j.linkedContractId === contract.id), [jobs, contract.id]);
  const isOwner = contract.ownerId === currentUser.id;

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o contrato "${contract.title}"? Esta ação não pode ser desfeita.`)) {
      deleteContract(contract.id);
      onClose();
      toast.success('Contrato excluído com sucesso.');
    }
  };

  const handleJobClick = (job: Job) => {
    setJobForDetails(job);
    onClose();
    navigate('/jobs');
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-0 right-0 h-full w-full max-w-md md:max-w-lg bg-card-bg shadow-2xl 
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-modal="true" role="dialog"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-color sticky top-0 bg-card-bg z-10">
          <h2 className="text-xl font-semibold text-text-primary truncate" title={contract.title}>
            {contract.title}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-accent p-1 rounded-full transition-colors" aria-label="Fechar painel">
            <XIcon size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-start">
                <section>
                    <h3 className="text-sm font-medium text-text-secondary mb-1">Cliente</h3>
                    <p className="text-text-primary font-medium">{client?.name || 'Cliente desconhecido'}</p>
                </section>
                {contract.duration && contract.duration !== 'Pontual' && (
                    <div className={`px-3 py-1 rounded-lg border text-sm font-semibold flex items-center ${contract.duration === 'Anual' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        <CalendarIcon size={14} className="mr-1.5"/> {contract.duration}
                    </div>
                )}
            </div>
            
             <section>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Criado por</h3>
                <p className="text-text-primary font-medium">{contract.ownerUsername}</p>
            </section>
            <section>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Corpo do Contrato</h3>
                <div className="max-h-60 overflow-y-auto p-3 bg-subtle-bg border border-border-color rounded-md">
                    <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans">{contract.content || 'Nenhum conteúdo.'}</pre>
                </div>
            </section>
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><BriefcaseIcon size={18} className="mr-2"/>Jobs Vinculados ({linkedJobs.length})</h3>
                {linkedJobs.length > 0 ? (
                     <ul className="divide-y divide-border-color border-t border-b border-border-color">
                     {linkedJobs.map(job => (
                       <li key={job.id}>
                         <button onClick={() => handleJobClick(job)} className="w-full text-left p-2 hover:bg-hover-bg rounded-lg transition-colors">
                            <p className="font-semibold text-accent">{job.name}</p>
                         </button>
                       </li>
                     ))}
                   </ul>
                ) : (
                    <p className="text-sm text-text-secondary">Nenhum job vinculado a este contrato.</p>
                )}
            </section>
        </div>
        
        <div className="p-4 border-t border-border-color sticky bottom-0 bg-card-bg z-10 flex justify-end gap-2">
            <button 
                onClick={() => onEdit(contract)} 
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg shadow transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isOwner}
                title={!isOwner ? "Apenas o proprietário pode editar" : ""}
            >
                <PencilIcon size={18} /> <span className="ml-1">Editar</span>
            </button>
            <button 
                onClick={handleDelete} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isOwner}
                title={!isOwner ? "Apenas o proprietário pode excluir" : ""}
            >
                <TrashIcon size={18} /> <span className="ml-1">Excluir</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailsPanel;
