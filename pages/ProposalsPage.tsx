import React, { useState, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { Proposal, ProposalTemplate, Client, Job } from '../types';
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
  SparklesIcon
} from '../constants';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ProposalsPage: React.FC = () => {
  const { clients, jobs } = useAppData();
  const { currentUser } = useAuth();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [proposalsData, templatesData] = await Promise.all([
        // Load proposals (we'll need to add this to blobService)
        Promise.resolve([] as Proposal[]), // Temporarily empty
        getProposalTemplates()
      ]);
      
      setProposals(proposalsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!selectedClientId) {
      toast.error('Selecione um cliente');
      return;
    }

    setIsGenerating(true);
    try {
      const proposal = await createProposal(selectedClientId, selectedJobId || undefined);
      setProposals([proposal, ...proposals]);
      setShowCreateModal(false);
      setSelectedClientId('');
      setSelectedJobId('');
      toast.success('Proposta criada com sucesso!');
      
      // Open editor for the new proposal
      setSelectedProposal(proposal);
      setShowEditorModal(true);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Erro ao criar proposta');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !selectedServiceType || !selectedProposal) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const template = await createProposalTemplate(
        templateName,
        selectedServiceType as any,
        selectedProposal.content,
        selectedProposal.customizations
      );
      setTemplates([template, ...templates]);
      setShowTemplateModal(false);
      setTemplateName('');
      setSelectedServiceType('');
      setSelectedProposal(null);
      toast.success('Template criado com sucesso!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const handleUpdateProposal = async (updatedProposal: Proposal) => {
    try {
      await updateProposal(updatedProposal);
      setProposals(proposals.map(p => p.id === updatedProposal.id ? updatedProposal : p));
      setSelectedProposal(updatedProposal);
      toast.success('Proposta atualizada!');
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Erro ao atualizar proposta');
    }
  };

  const handleSendProposal = async (id: string) => {
    try {
      await sendProposal(id);
      setProposals(proposals.map(p => p.id === id ? { ...p, status: 'sent', sentAt: new Date().toISOString() } : p));
      toast.success('Proposta enviada!');
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error('Erro ao enviar proposta');
    }
  };

  const handleAcceptProposal = async (id: string) => {
    try {
      await acceptProposal(id);
      setProposals(proposals.map(p => p.id === id ? { ...p, status: 'accepted', acceptedAt: new Date().toISOString() } : p));
      toast.success('Proposta aceita!');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Erro ao aceitar proposta');
    }
  };

  const handleRejectProposal = async (id: string) => {
    try {
      await rejectProposal(id);
      setProposals(proposals.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
      toast.success('Proposta rejeitada!');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Erro ao rejeitar proposta');
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta proposta?')) return;
    
    try {
      await deleteProposal(id);
      setProposals(proposals.filter(p => p.id !== id));
      toast.success('Proposta excluída!');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Erro ao excluir proposta');
    }
  };

  const handleSetDefaultTemplate = async (id: string) => {
    try {
      await setDefaultProposalTemplate(id);
      setTemplates(templates.map(t => ({ ...t, isDefault: t.id === id })));
      toast.success('Template definido como padrão!');
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Erro ao definir template padrão');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este template?')) return;
    
    try {
      await deleteProposalTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template excluído!');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const filteredJobs = jobs.filter(job => !job.isDeleted && (!selectedClientId || job.clientId === selectedClientId));

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: Proposal['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'sent': return 'Enviada';
      case 'accepted': return 'Aceita';
      case 'rejected': return 'Rejeitada';
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
          Propostas Comerciais
        </h1>
        <div className="flex gap-2">
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
                  const client = clients.find(c => c.id === proposal.clientId);
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
                            onClick={() => handleSendProposal(proposal.id)}
                            disabled={proposal.status !== 'draft'}
                            className="p-1 text-text-secondary hover:text-blue-600 transition-colors disabled:opacity-50"
                            title="Enviar"
                          >
                            <SendHorizonalIcon size={16} />
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
                            onClick={() => handleRejectProposal(proposal.id)}
                            disabled={proposal.status !== 'sent'}
                            className="p-1 text-text-secondary hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Rejeitar"
                          >
                            <AlertCircleIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(proposal.id)}
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
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Criar Nova Proposta</h2>
            
            <div className="space-y-4">
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
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedClientId('');
                  setSelectedJobId('');
                }}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProposal}
                disabled={isGenerating || !selectedClientId}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isGenerating ? <LoadingSpinner size="sm" color="text-white" className="mr-2" /> : <SparklesIcon size={16} className="mr-2" />}
                {isGenerating ? 'Gerando...' : 'Criar Proposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Templates de Proposta</h2>
            
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  Nenhum template criado ainda.
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="border border-border-color rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-text-primary">{template.name}</h3>
                        <p className="text-sm text-text-secondary">Tipo: {template.serviceType}</p>
                        {template.isDefault && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!template.isDefault && (
                          <button
                            onClick={() => handleSetDefaultTemplate(template.id)}
                            className="text-sm text-text-secondary hover:text-accent transition-colors"
                          >
                            Definir como padrão
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsPage;
