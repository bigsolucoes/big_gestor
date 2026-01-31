import React, { useState, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { EnhancedProposal, PreClient, Client, Job, ServiceType } from '../types';
import { 
  createProposal, 
  updateProposal, 
  deleteProposal, 
  sendProposal, 
  acceptProposal, 
  rejectProposal,
  getProposalTemplates,
  createProposalTemplate,
  updateProposalTemplate,
  deleteProposalTemplate,
  setDefaultProposalTemplate
} from '../services/proposalService';
import { PreClientService } from '../services/preClientService';
import { 
  ContractIcon, 
  PlusCircleIcon, 
  SendHorizonalIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  EyeOpenIcon,
  PencilIcon,
  TrashIcon,
  DraftIcon,
  DownloadIcon,
  SparklesIcon,
  UsersIcon,
  PlusIcon as UserPlusIcon,
  XIcon
} from '../constants';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const EnhancedProposalsPage: React.FC = () => {
  const { clients, jobs } = useAppData();
  const { currentUser } = useAuth();
  
  const [proposals, setProposals] = useState<EnhancedProposal[]>([]);
  const [preClients, setPreClients] = useState<PreClient[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showPreClientKanban, setShowPreClientKanban] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<EnhancedProposal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  
  // Pre-client form states
  const [preClientName, setPreClientName] = useState('');
  const [preClientEmail, setPreClientEmail] = useState('');
  const [preClientPhone, setPreClientPhone] = useState('');
  const [preClientCompany, setPreClientCompany] = useState('');
  const [usePreClient, setUsePreClient] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [proposalsData, preClientsData, templatesData] = await Promise.all([
        Promise.resolve([] as EnhancedProposal[]), // Temporarily empty
        PreClientService.getPreClients(),
        getProposalTemplates()
      ]);
      
      setProposals(proposalsData);
      setPreClients(preClientsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    let clientId = selectedClientId;
    let preClientId: string | undefined;

    // Handle pre-client creation
    if (usePreClient && preClientName) {
      try {
        const preClient = await PreClientService.createPreClient(
          preClientName,
          preClientEmail || undefined,
          preClientPhone || undefined,
          preClientCompany || undefined
        );
        
        preClientId = preClient.id;
        setPreClients([preClient, ...preClients]);
        
        toast.success('Pré-cliente criado com sucesso!');
      } catch (error) {
        console.error('Error creating pre-client:', error);
        toast.error('Erro ao criar pré-cliente');
        return;
      }
    }

    if (!clientId && !preClientId) {
      toast.error('Selecione um cliente ou crie um pré-cliente');
      return;
    }

    setIsGenerating(true);
    try {
      const proposal = await createProposal(clientId || '', selectedJobId || undefined);
      
      // Enhanced proposal with pre-client data
      const enhancedProposal: EnhancedProposal = {
        ...proposal,
        preClientId,
        preRegistrationData: usePreClient ? {
          clientName: preClientName,
          clientEmail: preClientEmail,
          clientPhone: preClientPhone,
          clientCompany: preClientCompany
        } : undefined,
        autoRegisterOnApproval: !!preClientId,
        kanbanStatus: preClientId ? 'pre-client' : 'proposal-sent'
      };

      setProposals([enhancedProposal, ...proposals]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Proposta criada com sucesso!');
      
      // Open editor for the new proposal
      setSelectedProposal(enhancedProposal);
      setShowEditorModal(true);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Erro ao criar proposta');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptProposal = async (id: string) => {
    try {
      const proposal = proposals.find(p => p.id === id);
      if (!proposal) return;

      // Auto-register client if it's a pre-client
      if (proposal.autoRegisterOnApproval && proposal.preClientId) {
        const client = await PreClientService.handleProposalApproval(proposal);
        if (client) {
          toast.success('Cliente cadastrado automaticamente!');
        }
      }

      await acceptProposal(id);
      setProposals(proposals.map(p => p.id === id ? { ...p, status: 'accepted', acceptedAt: new Date().toISOString() } : p));
      toast.success('Proposta aceita!');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Erro ao aceitar proposta');
    }
  };

  const handleUpdatePreClientStatus = async (preClientId: string, status: PreClient['status']) => {
    try {
      const preClient = await PreClientService.getPreClientById(preClientId);
      if (!preClient) return;

      preClient.status = status;
      await PreClientService.updatePreClient(preClient);
      
      setPreClients(preClients.map(pc => pc.id === preClientId ? preClient : pc));
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error updating pre-client status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedJobId('');
    setSelectedTemplate(null);
    setPreClientName('');
    setPreClientEmail('');
    setPreClientPhone('');
    setPreClientCompany('');
    setUsePreClient(false);
  };

  const filteredJobs = jobs.filter(job => !job.isDeleted && (!selectedClientId || job.clientId === selectedClientId));

  const getStatusColor = (status: EnhancedProposal['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: EnhancedProposal['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'sent': return 'Enviada';
      case 'accepted': return 'Aceita';
      case 'rejected': return 'Rejeitada';
      default: return status;
    }
  };

  const getPreClientStatusColor = (status: PreClient['status']) => {
    switch (status) {
      case 'pre-registered': return 'text-yellow-600 bg-yellow-100';
      case 'registered': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPreClientStatusText = (status: PreClient['status']) => {
    switch (status) {
      case 'pre-registered': return 'Pré-cadastrado';
      case 'registered': return 'Cadastrado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center">
          <ContractIcon className="mr-2" size={24} />
          Propostas Comerciais Avançadas
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreClientKanban(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <UsersIcon size={16} className="mr-2" />
            Pré-Cadastro
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <DraftIcon size={16} className="mr-2" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors"
          >
            <PlusCircleIcon size={16} className="mr-2" />
            Nova Proposta
          </button>
        </div>
      </div>

      {/* Pre-Clients Statistics */}
      {preClients.length > 0 && (
        <div className="bg-card-bg rounded-lg shadow-sm border border-border-color p-4 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
            <UserPlusIcon className="mr-2" size={20} />
            Pré-Cadastro de Clientes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{preClients.length}</div>
              <div className="text-sm text-text-secondary">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {preClients.filter(pc => pc.status === 'pre-registered').length}
              </div>
              <div className="text-sm text-text-secondary">Pré-cadastrados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {preClients.filter(pc => pc.status === 'registered').length}
              </div>
              <div className="text-sm text-text-secondary">Convertidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {preClients.filter(pc => pc.status === 'rejected').length}
              </div>
              <div className="text-sm text-text-secondary">Rejeitados</div>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="bg-card-bg rounded-lg shadow-sm border border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-subtle-bg border-b border-border-color">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Proposta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    Nenhuma proposta encontrada. Crie sua primeira proposta!
                  </td>
                </tr>
              ) : (
                proposals.map((proposal) => {
                  const client = proposal.preClientId 
                    ? preClients.find(pc => pc.id === proposal.preClientId)
                    : clients.find(c => c.id === proposal.clientId);
                  const job = proposal.jobId ? jobs.find(j => j.id === proposal.jobId) : null;
                  
                  return (
                    <tr key={proposal.id} className="hover:bg-hover-bg transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {proposal.title}
                          </div>
                          {job && (
                            <div className="text-xs text-text-secondary">
                              Job: {job.name}
                            </div>
                          )}
                          {proposal.autoRegisterOnApproval && (
                            <div className="text-xs text-purple-600">
                              Auto-cadastro ao aprovar
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-text-primary">
                          {client?.name || 'Cliente não encontrado'}
                        </div>
                        {client?.company && (
                          <div className="text-xs text-text-secondary">
                            {client.company}
                          </div>
                        )}
                        {proposal.preClientId && (
                          <div className="text-xs text-purple-600">
                            Pré-cliente
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-text-primary">
                          R$ {proposal.totalValue.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                          {getStatusText(proposal.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-text-secondary">
                          {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowEditorModal(true);
                            }}
                            className="p-1 text-text-secondary hover:text-accent transition-colors"
                            title="Editar"
                          >
                            <PencilIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleAcceptProposal(proposal.id)}
                            disabled={proposal.status !== 'sent'}
                            className="p-1 text-text-secondary hover:text-green-600 transition-colors disabled:opacity-50"
                            title="Aceitar"
                          >
                            <CheckCircleIcon size={16} />
                          </button>
                          <button
                            onClick={() => rejectProposal(proposal.id)}
                            disabled={proposal.status !== 'sent'}
                            className="p-1 text-text-secondary hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Rejeitar"
                          >
                            <AlertCircleIcon size={16} />
                          </button>
                          <button
                            onClick={() => deleteProposal(proposal.id)}
                            className="p-1 text-text-secondary hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Criar Nova Proposta</h2>
            
            {/* Client Selection */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="usePreClient"
                  checked={usePreClient}
                  onChange={(e) => setUsePreClient(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="usePreClient" className="text-sm font-medium text-text-secondary">
                  Criar para cliente não cadastrado (pré-cadastro)
                </label>
              </div>
            </div>

            {usePreClient ? (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={preClientName}
                    onChange={(e) => setPreClientName(e.target.value)}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                    placeholder="Digite o nome do cliente"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={preClientEmail}
                      onChange={(e) => setPreClientEmail(e.target.value)}
                      className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={preClientPhone}
                      onChange={(e) => setPreClientPhone(e.target.value)}
                      className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={preClientCompany}
                    onChange={(e) => setPreClientCompany(e.target.value)}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                    placeholder="Nome da empresa (opcional)"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Cliente *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Job (Opcional)
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                    disabled={!selectedClientId}
                  >
                    <option value="">Selecione um job</option>
                    {filteredJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.name} - R$ {job.value.toLocaleString('pt-BR')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProposal}
                disabled={isGenerating || (!usePreClient && !selectedClientId) || (usePreClient && !preClientName)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isGenerating ? <LoadingSpinner size="sm" color="text-white" className="mr-2" /> : <SparklesIcon size={16} className="mr-2" />}
                {isGenerating ? 'Gerando...' : 'Criar Proposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Clients Kanban Modal */}
      {showPreClientKanban && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary flex items-center">
                <UsersIcon className="mr-2" size={24} />
                Kanban de Pré-Cadastro
              </h2>
              <button
                onClick={() => setShowPreClientKanban(false)}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pre-registered */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-3">Pré-cadastrados</h3>
                <div className="space-y-2">
                  {preClients
                    .filter(pc => pc.status === 'pre-registered')
                    .map((preClient) => (
                      <div key={preClient.id} className="bg-white rounded p-3 border border-yellow-200">
                        <div className="font-medium text-text-primary">{preClient.name}</div>
                        {preClient.company && (
                          <div className="text-sm text-text-secondary">{preClient.company}</div>
                        )}
                        <div className="text-xs text-text-secondary mt-1">
                          {preClient.email && <div>{preClient.email}</div>}
                          {preClient.phone && <div>{preClient.phone}</div>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdatePreClientStatus(preClient.id, 'registered')}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleUpdatePreClientStatus(preClient.id, 'rejected')}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Registered */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">Convertidos</h3>
                <div className="space-y-2">
                  {preClients
                    .filter(pc => pc.status === 'registered')
                    .map((preClient) => (
                      <div key={preClient.id} className="bg-white rounded p-3 border border-green-200">
                        <div className="font-medium text-text-primary">{preClient.name}</div>
                        {preClient.company && (
                          <div className="text-sm text-text-secondary">{preClient.company}</div>
                        )}
                        <div className="text-xs text-green-600 mt-1">
                          Cadastrado em: {preClient.registeredAt ? new Date(preClient.registeredAt).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Rejected */}
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3">Rejeitados</h3>
                <div className="space-y-2">
                  {preClients
                    .filter(pc => pc.status === 'rejected')
                    .map((preClient) => (
                      <div key={preClient.id} className="bg-white rounded p-3 border border-red-200">
                        <div className="font-medium text-text-primary">{preClient.name}</div>
                        {preClient.company && (
                          <div className="text-sm text-text-secondary">{preClient.company}</div>
                        )}
                        <div className="text-xs text-red-600 mt-1">
                          Rejeitado em: {new Date(preClient.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProposalsPage;
