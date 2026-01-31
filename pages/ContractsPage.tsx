
import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { Contract, ContractDuration } from '../types';
import { ContractIcon, PlusCircleIcon, CalendarIcon } from '../constants';
import Modal from '../components/Modal';
import ContractForm from './forms/ContractForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ContractDetailsPanel from '../components/ContractDetailsPanel';
import { formatDate } from '../utils/formatters';

const DurationBadge: React.FC<{ duration?: ContractDuration }> = ({ duration }) => {
    if (!duration || duration === 'Pontual') return null;
    
    const colorClass = duration === 'Anual' 
        ? 'bg-purple-100 text-purple-700 border-purple-200' 
        : 'bg-blue-100 text-blue-700 border-blue-200'; // Semestral

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClass} ml-2`}>
            <CalendarIcon size={10} className="mr-1"/> {duration}
        </span>
    );
};

const ContractsPage: React.FC = () => {
  const { contracts, clients, loading, contractForDetails, setContractForDetails } = useAppData();
  const { currentUser } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContracts = useMemo(() => {
    return contracts
      .filter(contract => {
        const client = clients.find(c => c.id === contract.clientId);
        const searchTermLower = searchTerm.toLowerCase();
        return (
          contract.title.toLowerCase().includes(searchTermLower) ||
          (client && client.name.toLowerCase().includes(searchTermLower))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts, clients, searchTerm]);

  const openModal = (contract?: Contract) => {
    setEditingContract(contract);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingContract(undefined);
    setModalOpen(false);
  };

  const handleContractClick = (contract: Contract) => {
    setContractForDetails(contract);
  };

  if (loading || !currentUser) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-text-primary flex items-center"><ContractIcon size={28} className="mr-3 text-accent"/>Contratos</h1>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Pesquisar por título ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <button
            onClick={() => openModal()}
            className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center"
          >
            <PlusCircleIcon size={20} /> <span className="ml-2">Novo Contrato</span>
          </button>
        </div>
      </div>

      {filteredContracts.length > 0 ? (
        <div className="bg-card-bg shadow-lg rounded-xl overflow-hidden border border-border-color">
            <ul className="divide-y divide-border-color">
                {filteredContracts.map(contract => {
                    const client = clients.find(c => c.id === contract.clientId);
                    return (
                        <li key={contract.id}>
                            <button onClick={() => handleContractClick(contract)} className="w-full text-left p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-text-primary flex items-center">
                                            {contract.title}
                                            <DurationBadge duration={contract.duration} />
                                        </p>
                                        <p className="text-sm text-text-secondary">{client?.name || 'Cliente desconhecido'} • Criado em: {formatDate(contract.createdAt)}</p>
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-text-secondary">Nenhum contrato encontrado.</p>
          <p className="mt-2 text-text-secondary">Clique em "Novo Contrato" para começar.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingContract ? 'Editar Contrato' : 'Novo Contrato'} size="lg">
        <ContractForm onSuccess={closeModal} contractToEdit={editingContract} />
      </Modal>

      {contractForDetails && (
        <ContractDetailsPanel
            contract={contractForDetails}
            currentUser={currentUser}
            isOpen={!!contractForDetails}
            onClose={() => setContractForDetails(null)}
            onEdit={(contract) => { setContractForDetails(null); openModal(contract); }}
        />
      )}

    </div>
  );
};

export default ContractsPage;
