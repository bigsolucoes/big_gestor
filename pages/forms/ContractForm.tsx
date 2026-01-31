
import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Contract, Client, Job, ContractDuration } from '../../types';
import toast from 'react-hot-toast';
import { SparklesIcon, CalendarIcon } from '../../constants';
import { generateContractContent } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ContractFormProps {
  onSuccess: () => void;
  contractToEdit?: Contract;
}

const ContractForm: React.FC<ContractFormProps> = ({ onSuccess, contractToEdit }) => {
  const { clients, jobs, addContract, updateContract } = useAppData();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [content, setContent] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [duration, setDuration] = useState<ContractDuration>('Pontual');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (contractToEdit) {
      setTitle(contractToEdit.title);
      setClientId(contractToEdit.clientId);
      setContent(contractToEdit.content);
      setIsSigned(contractToEdit.isSigned || false);
      setDuration(contractToEdit.duration || 'Pontual');
    } else {
      setTitle('');
      setClientId(clients.length > 0 ? clients[0].id : '');
      setContent('');
      setIsSigned(false);
      setDuration('Pontual');
    }
  }, [contractToEdit, clients]);

  // Filter jobs by selected client
  const clientJobs = useMemo(() => {
    if (!clientId) return [];
    return jobs.filter(j => j.clientId === clientId && !j.isDeleted);
  }, [clientId, jobs]);

  const handleGenerateAI = async () => {
    if (!clientId || !selectedJobId) {
        toast.error("Selecione um Cliente e um Job para gerar o contrato.");
        return;
    }
    
    const client = clients.find(c => c.id === clientId);
    const job = jobs.find(j => j.id === selectedJobId);
    
    if (!client || !job) return;

    setIsGenerating(true);
    try {
        const generatedText = await generateContractContent(job, client);
        setContent(generatedText);
        if (!title) setTitle(`Contrato - ${job.name}`);
        toast.success("Minuta gerada com sucesso!");
    } catch (error) {
        toast.error("Erro ao gerar contrato.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientId) {
      toast.error('Título e Cliente são obrigatórios.');
      return;
    }

    const contractData = {
      title,
      clientId,
      content,
      isSigned,
      duration
    };

    if (contractToEdit) {
      updateContract({ ...contractToEdit, ...contractData });
      toast.success('Contrato atualizado com sucesso!');
    } else {
      addContract(contractData);
      // Link contract to job if selected
      if (selectedJobId) {
        toast("Dica: Você pode vincular este contrato ao Job na tela de detalhes do Job.");
      }
      toast.success('Contrato adicionado com sucesso!');
    }
    onSuccess();
  };
  
  const commonInputClass = "w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary outline-none transition-shadow bg-card-bg";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
      <div>
        <label htmlFor="contractTitle" className="block text-sm font-medium text-text-secondary mb-1">Título do Contrato <span className="text-red-500">*</span></label>
        <input type="text" id="contractTitle" value={title} onChange={(e) => setTitle(e.target.value)} className={commonInputClass} required placeholder="Ex: Contrato de Prestação de Serviços" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="client" className="block text-sm font-medium text-text-secondary mb-1">Cliente Associado <span className="text-red-500">*</span></label>
            <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={commonInputClass} required disabled={!!contractToEdit}>
            <option value="" disabled>Selecione um cliente</option>
            {clients.map((client: Client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
            ))}
            </select>
        </div>
        
        {!contractToEdit && (
            <div>
                <label htmlFor="jobSelect" className="block text-sm font-medium text-text-secondary mb-1">Basear no Job (Opcional)</label>
                 <select 
                    id="jobSelect" 
                    value={selectedJobId} 
                    onChange={(e) => setSelectedJobId(e.target.value)} 
                    className={commonInputClass} 
                    disabled={!clientId || clientJobs.length === 0}
                 >
                    <option value="">Selecione um Job para preencher dados</option>
                    {clientJobs.map(job => (
                        <option key={job.id} value={job.id}>{job.name}</option>
                    ))}
                 </select>
            </div>
        )}
      </div>
      
      {/* Duration Selection */}
      <div className="p-3 bg-subtle-bg rounded-lg border border-border-color">
          <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-1">
              <CalendarIcon size={16} /> Vigência do Contrato
          </label>
          <div className="flex flex-wrap gap-3">
              <label className={`flex-1 flex items-center p-2 rounded-lg cursor-pointer border transition-colors ${duration === 'Pontual' ? 'bg-white border-accent shadow-sm' : 'border-transparent hover:bg-white'}`}>
                  <input 
                      type="radio" 
                      name="duration" 
                      value="Pontual" 
                      checked={duration === 'Pontual'} 
                      onChange={() => setDuration('Pontual')}
                      className="form-checkbox h-4 w-4 text-accent border-gray-300 focus:ring-accent mr-2"
                  />
                  <span className="text-sm font-medium text-text-primary">Pontual (Padrão)</span>
              </label>
              <label className={`flex-1 flex items-center p-2 rounded-lg cursor-pointer border transition-colors ${duration === 'Semestral' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'border-transparent hover:bg-white'}`}>
                  <input 
                      type="radio" 
                      name="duration" 
                      value="Semestral" 
                      checked={duration === 'Semestral'} 
                      onChange={() => setDuration('Semestral')}
                      className="form-checkbox h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm font-medium text-text-primary">Semestral (6 Meses)</span>
              </label>
              <label className={`flex-1 flex items-center p-2 rounded-lg cursor-pointer border transition-colors ${duration === 'Anual' ? 'bg-purple-50 border-purple-500 shadow-sm' : 'border-transparent hover:bg-white'}`}>
                  <input 
                      type="radio" 
                      name="duration" 
                      value="Anual" 
                      checked={duration === 'Anual'} 
                      onChange={() => setDuration('Anual')}
                      className="form-checkbox h-4 w-4 text-purple-500 border-gray-300 focus:ring-purple-500 mr-2"
                  />
                  <span className="text-sm font-medium text-text-primary">Anual (12 Meses)</span>
              </label>
          </div>
      </div>
      
      {!contractToEdit && clientId && selectedJobId && (
          <div className="flex justify-end">
              <button 
                type="button" 
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex items-center text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow transition-colors"
              >
                 {isGenerating ? <LoadingSpinner size="sm" color="text-white"/> : <SparklesIcon size={16} className="mr-2" />}
                 {isGenerating ? 'Gerando...' : 'Gerar Minuta com IA'}
              </button>
          </div>
      )}

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-1">Conteúdo do Contrato</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className={commonInputClass}
          placeholder="Digite ou gere as cláusulas do contrato aqui..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isSigned"
          checked={isSigned}
          onChange={(e) => setIsSigned(e.target.checked)}
          className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
        />
        <label htmlFor="isSigned" className="text-sm font-medium text-text-secondary">
          Contrato Assinado
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:brightness-90 transition-all">
          {contractToEdit ? 'Salvar Alterações' : 'Adicionar Contrato'}
        </button>
      </div>
    </form>
  );
};

export default ContractForm;
