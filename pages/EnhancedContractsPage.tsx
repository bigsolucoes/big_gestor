import React, { useState, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { Contract, ContractTemplate, ContractPreset, Client, Job, ServiceType } from '../types';
import { EnhancedContractService } from '../services/enhancedContractService';
import { 
  ContractIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  TrashIcon, 
  SaveIcon,
  DownloadIcon,
  ContractIcon as FileTextIcon,
  AlertCircleIcon as AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  SparklesIcon,
  EyeOpenIcon
} from '../constants';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const EnhancedContractsPage: React.FC = () => {
  const { clients, jobs, contracts, addContract, updateContract } = useAppData();
  const { currentUser } = useAuth();
  
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [presets, setPresets] = useState<ContractPreset[]>([]);
  const [defaulters, setDefaulters] = useState<Array<{client: Client, overdueAmount: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<ContractPreset | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [customClauses, setCustomClauses] = useState<string[]>(['']);
  
  // Template creation states
  const [templateName, setTemplateName] = useState('');
  const [templateServiceType, setTemplateServiceType] = useState<ServiceType>(ServiceType.OTHER);
  const [templateContent, setTemplateContent] = useState('');
  
  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await EnhancedContractService.initializeBuiltInContent();
      const [templatesData, presetsData, defaultersData] = await Promise.all([
        EnhancedContractService.getTemplates(),
        EnhancedContractService.getPresets(),
        EnhancedContractService.getDefaulters()
      ]);
      
      setTemplates(templatesData);
      setPresets(presetsData);
      setDefaulters(defaultersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    if (!selectedClientId || !selectedJobId || !selectedTemplate) {
      toast.error('Selecione cliente, job e template');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    const job = jobs.find(j => j.id === selectedJobId);
    
    if (!client || !job) {
      toast.error('Cliente ou job não encontrado');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const options = {
        template: selectedTemplate,
        customizations: {
          includeClientData: true,
          includePaymentSchedule: true,
          includeWarranty: true,
          includeSpecificClauses: customClauses.filter(clause => clause.trim() !== '')
        }
      };

      const generatedContent = await EnhancedContractService.generateContract(client, job, options);
      setContractContent(generatedContent);
      setContractTitle(`Contrato - ${job.name}`);
      toast.success('Contrato gerado com sucesso!');
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('Erro ao gerar contrato');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveContract = async () => {
    if (!contractTitle || !contractContent || !selectedClientId) {
      toast.error('Título, conteúdo e cliente são obrigatórios');
      return;
    }

    try {
      const contractData = {
        title: contractTitle,
        clientId: selectedClientId,
        content: contractContent,
        isSigned: false,
        duration: 'Pontual' as const
      };

      if (contractContent.includes('(EDITAR)')) {
        // Update existing contract
        const existingContract = contracts.find(c => c.title === contractTitle);
        if (existingContract) {
          updateContract({ ...existingContract, ...contractData });
          toast.success('Contrato atualizado!');
        } else {
          addContract(contractData);
          toast.success('Contrato adicionado!');
        }
      } else {
        addContract(contractData);
        toast.success('Contrato adicionado!');
      }

      // Reset form
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Erro ao salvar contrato');
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateServiceType || !templateContent) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const template = await EnhancedContractService.createTemplate(
        templateName,
        templateServiceType,
        templateContent
      );
      
      setTemplates([template, ...templates]);
      setShowTemplateModal(false);
      setTemplateName('');
      setTemplateServiceType(ServiceType.OTHER);
      setTemplateContent('');
      toast.success('Template criado com sucesso!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const handleGeneratePDF = async () => {
    if (!contractContent) {
      toast.error('Gere um contrato primeiro');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // This would integrate with a PDF library like jsPDF or html2pdf
      // For now, we'll simulate the PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a blob and download
      const blob = new Blob([contractContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contractTitle.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Contrato exportado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este template?')) return;
    
    try {
      await EnhancedContractService.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template excluído!');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleSetDefaultTemplate = async (id: string) => {
    try {
      const updatedTemplates = templates.map(t => ({ ...t, isDefault: t.id === id }));
      setTemplates(updatedTemplates);
      toast.success('Template definido como padrão!');
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Erro ao definir template padrão');
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedJobId('');
    setSelectedTemplate(null);
    setSelectedPreset(null);
    setContractTitle('');
    setContractContent('');
    setCustomClauses(['']);
  };

  const addCustomClause = () => {
    setCustomClauses([...customClauses, '']);
  };

  const updateCustomClause = (index: number, value: string) => {
    const updatedClauses = [...customClauses];
    updatedClauses[index] = value;
    setCustomClauses(updatedClauses);
  };

  const removeCustomClause = (index: number) => {
    setCustomClauses(customClauses.filter((_, i) => i !== index));
  };

  const filteredJobs = jobs.filter(job => !job.isDeleted && (!selectedClientId || job.clientId === selectedClientId));
  const filteredTemplates = templates.filter(template => !selectedJobId || template.serviceType === jobs.find(j => j.id === selectedJobId)?.serviceType);

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
          Contratos Avançados
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileTextIcon size={16} className="mr-2" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors"
          >
            <PlusCircleIcon size={16} className="mr-2" />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* Defaulters Alert */}
      {defaulters.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangleIcon className="text-red-600 mr-2" size={20} />
            <div>
              <h3 className="text-red-800 font-semibold">Clientes Inadimplentes Detectados</h3>
              <p className="text-red-600 text-sm">
                {defaulters.length} cliente(s) com pagamentos em atraso. Total devido: R$ {defaulters.reduce((sum, d) => sum + d.overdueAmount, 0).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Ver detalhes →
            </button>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-card-bg rounded-lg shadow-sm border border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-subtle-bg border-b border-border-color">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Cliente
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
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    Nenhum contrato encontrado. Crie seu primeiro contrato!
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => {
                  const client = clients.find(c => c.id === contract.clientId);
                  const isDefaulter = defaulters.some(d => d.client.id === contract.clientId);
                  
                  return (
                    <tr key={contract.id} className="hover:bg-hover-bg transition-colors">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-text-primary">
                          {contract.title}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-text-primary">
                            {client?.name || 'Cliente não encontrado'}
                          </div>
                          {isDefaulter && (
                            <AlertTriangleIcon className="text-red-500 ml-2" size={16} title="Inadimplente" />
                          )}
                        </div>
                        {client?.company && (
                          <div className="text-xs text-text-secondary">
                            {client.company}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {contract.isSigned ? (
                            <>
                              <CheckCircleIcon className="text-green-600 mr-2" size={16} />
                              <span className="text-sm text-green-600">Assinado</span>
                            </>
                          ) : (
                            <>
                              <XIcon className="text-gray-400 mr-2" size={16} />
                              <span className="text-sm text-gray-600">Pendente</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-text-secondary">
                          {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setContractContent(contract.content);
                              setContractTitle(contract.title);
                              setShowPreviewModal(true);
                            }}
                            className="p-1 text-text-secondary hover:text-accent transition-colors"
                            title="Visualizar"
                          >
                            <EyeOpenIcon size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setContractContent(contract.content);
                              setContractTitle(contract.title);
                              handleGeneratePDF();
                            }}
                            className="p-1 text-text-secondary hover:text-green-600 transition-colors"
                            title="Exportar PDF"
                          >
                            <DownloadIcon size={16} />
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

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Gerar Novo Contrato</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      {client.name} {defaulters.some(d => d.client.id === client.id) ? '(Inadimplente)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Job *
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                  required
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Template *
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                required
              >
                <option value="">Selecione um template</option>
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.isDefault ? '(Padrão)' : ''} {template.isBuiltIn ? '(Built-in)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Clauses */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-text-secondary">
                  Cláusulas Personalizadas
                </label>
                <button
                  onClick={addCustomClause}
                  className="px-3 py-1 bg-accent text-white rounded-lg hover:brightness-90 transition-colors text-sm"
                >
                  Adicionar Cláusula
                </button>
              </div>
              {customClauses.map((clause, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={clause}
                    onChange={(e) => updateCustomClause(index, e.target.value)}
                    placeholder="Digite a cláusula personalizada"
                    className="flex-1 p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                  />
                  <button
                    onClick={() => removeCustomClause(index)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Generated Content */}
            {contractContent && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Contrato Gerado
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPDF}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center disabled:opacity-50"
                    >
                      {isGeneratingPDF ? <LoadingSpinner size="sm" color="text-white" className="mr-2" /> : <DownloadIcon size={14} className="mr-1" />}
                      {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  rows={12}
                  className="w-full p-3 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary font-mono text-sm"
                />
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
                onClick={handleGenerateContract}
                disabled={!selectedClientId || !selectedJobId || !selectedTemplate || isGeneratingAI}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50"
              >
                {isGeneratingAI ? <LoadingSpinner size="sm" color="text-white" className="mr-2" /> : <SparklesIcon size={16} className="mr-2" />}
                {isGeneratingAI ? 'Gerando...' : 'Gerar Contrato'}
              </button>
              {contractContent && (
                <button
                  onClick={handleSaveContract}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors flex items-center"
                >
                  <SaveIcon size={16} className="mr-2" />
                  Salvar Contrato
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Templates de Contrato</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  // Open template creation modal
                }}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors flex items-center"
              >
                <PlusCircleIcon size={16} className="mr-2" />
                Novo Template
              </button>
            </div>
            
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  Nenhum template encontrado.
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="border border-border-color rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-text-primary">{template.name}</h3>
                          {template.isDefault && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Padrão
                            </span>
                          )}
                          {template.isBuiltIn && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Built-in
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mb-1">Tipo: {template.serviceType}</p>
                        <p className="text-sm text-text-secondary">Usado: {template.usageCount} vezes</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!template.isBuiltIn && (
                          <>
                            <button
                              onClick={() => handleSetDefaultTemplate(template.id)}
                              className="text-sm text-text-secondary hover:text-accent transition-colors"
                            >
                              Padrão
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">
                {contractTitle || 'Visualização de Contrato'}
              </h2>
              <div className="flex gap-2">
                {contractContent && (
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center disabled:opacity-50"
                  >
                    {isGeneratingPDF ? <LoadingSpinner size="sm" color="text-white" className="mr-2" /> : <DownloadIcon size={14} className="mr-1" />}
                    {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
                  </button>
                )}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>
            </div>
            
            {defaulters.length > 0 && !contractContent && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary">Clientes Inadimplentes</h3>
                {defaulters.map((defaulter, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-red-800">{defaulter.client.name}</h4>
                        {defaulter.client.company && (
                          <p className="text-sm text-red-600">{defaulter.client.company}</p>
                        )}
                        <p className="text-sm text-red-600">Email: {defaulter.client.email}</p>
                        <p className="text-sm text-red-600">Telefone: {defaulter.client.phone || 'Não informado'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-red-800">
                          R$ {defaulter.overdueAmount.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-red-600">Em atraso</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {contractContent && (
              <textarea
                value={contractContent}
                readOnly
                rows={20}
                className="w-full p-4 border border-border-color rounded-md bg-card-bg text-text-primary font-mono text-sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedContractsPage;
