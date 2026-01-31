
import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Job, Client, ServiceType, JobStatus } from '../../types';
import { JOB_STATUS_OPTIONS, SERVICE_TYPE_OPTIONS, LinkIcon, RemoveLinkIcon, CalendarIcon, SyncIcon, UsersIcon, ContractIcon } from '../../constants';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

interface JobFormProps {
  onSuccess: () => void;
  jobToEdit?: Job;
}

const JobForm: React.FC<JobFormProps> = ({ onSuccess, jobToEdit }) => {
  const { clients, contracts, addJob, updateJob } = useAppData();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.VIDEO);
  const [customServiceType, setCustomServiceType] = useState('');
  const [value, setValue] = useState<number>(0);
  const [cost, setCost] = useState<number | undefined>(undefined);
  const [deadline, setDeadline] = useState('');
  const [recordingDate, setRecordingDate] = useState('');
  const [recordingTime, setRecordingTime] = useState('');
  const [status, setStatus] = useState<JobStatus>(JobStatus.BRIEFING);
  const [cloudLinks, setCloudLinks] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [createCalendarEvent, setCreateCalendarEvent] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isTeamJob, setIsTeamJob] = useState(false);
  const [linkedContractId, setLinkedContractId] = useState<string | undefined>(undefined);

  const availableContracts = useMemo(() => {
    if (!clientId) return [];
    return contracts.filter(c => c.clientId === clientId);
  }, [clientId, contracts]);

  useEffect(() => {
    if (jobToEdit) {
      setName(jobToEdit.name);
      setClientId(jobToEdit.clientId);
      setServiceType(jobToEdit.serviceType);
      setCustomServiceType(jobToEdit.customServiceType || '');
      setValue(jobToEdit.value);
      setCost(jobToEdit.cost);
      setLinkedContractId(jobToEdit.linkedContractId);
      try {
        if (jobToEdit.deadline) {
            const d = new Date(jobToEdit.deadline);
            if (!isNaN(d.getTime())) setDeadline(d.toISOString().split('T')[0]);
            else setDeadline('');
        } else { setDeadline(''); }

        if (jobToEdit.recordingDate) {
            const rd = new Date(jobToEdit.recordingDate);
            if (!isNaN(rd.getTime())) {
                setRecordingDate(rd.toISOString().split('T')[0]);
                setRecordingTime(rd.toTimeString().split(' ')[0].substring(0, 5));
            } else {
                setRecordingDate('');
                setRecordingTime('');
            }
        } else {
            setRecordingDate('');
            setRecordingTime('');
        }
      } catch (e) {
        setDeadline(''); 
        setRecordingDate('');
        setRecordingTime('');
        toast.error("Erro ao carregar datas do job.");
      }
      setStatus(jobToEdit.status);
      setCloudLinks(jobToEdit.cloudLinks && jobToEdit.cloudLinks.length > 0 ? [...jobToEdit.cloudLinks, ''] : ['']);
      setNotes(jobToEdit.notes || '');
      setCreateCalendarEvent(jobToEdit.createCalendarEvent || false);
      setIsRecurring(jobToEdit.isRecurring || false);
      setIsTeamJob(jobToEdit.isTeamJob || false);
    } else {
      // Reset form for new job
      setName('');
      setClientId(clients.length > 0 ? clients[0].id : '');
      setServiceType(ServiceType.VIDEO);
      setCustomServiceType('');
      setValue(0);
      setCost(undefined);
      setDeadline('');
      setRecordingDate('');
      setRecordingTime('');
      setStatus(JobStatus.BRIEFING);
      setCloudLinks(['']);
      setNotes('');
      setCreateCalendarEvent(false);
      setIsRecurring(false);
      setIsTeamJob(false);
      setLinkedContractId(undefined);
    }
  }, [jobToEdit, clients]);

  // When client changes, reset linked contract if it doesn't belong to the new client
  useEffect(() => {
    if (linkedContractId && !availableContracts.some(c => c.id === linkedContractId)) {
        setLinkedContractId(undefined);
    }
  }, [clientId, linkedContractId, availableContracts]);


  const handleCloudLinkChange = (index: number, val: string) => {
    const newLinks = [...cloudLinks];
    newLinks[index] = val;
    // If user starts typing in the last empty input, add a new empty input
    if(index === cloudLinks.length - 1 && val.trim() !== '') {
        newLinks.push('');
    }
    setCloudLinks(newLinks);
  };
  
  const removeCloudLink = (index: number) => {
    const newLinks = cloudLinks.filter((_, i) => i !== index);
    // Ensure there's always at least one (possibly empty) input field
    if (newLinks.length === 0 || newLinks[newLinks.length - 1] !== '') {
        newLinks.push('');
    }
    setCloudLinks(newLinks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !deadline) {
      toast.error('Preencha Nome, Cliente e Prazo de Entrega.');
      return;
    }
    const deadlineDate = new Date(deadline + "T23:59:59.000Z"); // End of day in local timezone
    if (isNaN(deadlineDate.getTime())) {
      toast.error('Data de prazo inválida.');
      return;
    }
    if (recordingDate && !recordingTime) {
        toast.error('Por favor, defina um horário para a data de gravação.');
        return;
    }
    if (serviceType === ServiceType.OTHER && !customServiceType.trim()) {
        toast.error('Por favor, especifique o tipo do serviço.');
        return;
    }

    const finalCloudLinks = cloudLinks.map(link => link.trim()).filter(link => link !== '');

    const jobDataPayload = {
      name,
      clientId,
      serviceType,
      customServiceType: serviceType === ServiceType.OTHER ? customServiceType : undefined,
      value: Number(value),
      cost: cost ? Number(cost) : undefined,
      deadline: deadlineDate.toISOString(),
      recordingDate: recordingDate && recordingTime ? new Date(`${recordingDate}T${recordingTime}:00`).toISOString() : undefined,
      status,
      cloudLinks: finalCloudLinks.length > 0 ? finalCloudLinks : [],
      notes: notes || undefined,
      createCalendarEvent,
      isRecurring,
      isTeamJob,
      linkedContractId: linkedContractId || undefined,
    };

    if (jobToEdit) {
      updateJob({ 
        ...jobToEdit, 
        ...jobDataPayload, 
       });
      toast.success('Job atualizado!');
    } else {
      addJob(jobDataPayload);
      toast.success('Job adicionado!');
    }
    onSuccess();
  };
  
  const commonInputClass = "w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary outline-none transition-shadow bg-card-bg";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
      <div>
        <label htmlFor="jobName" className="block text-sm font-medium text-text-secondary mb-1">Nome do Job <span className="text-red-500">*</span></label>
        <input type="text" id="jobName" value={name} onChange={(e) => setName(e.target.value)} className={commonInputClass} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="client" className="block text-sm font-medium text-text-secondary mb-1">Cliente <span className="text-red-500">*</span></label>
            <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={commonInputClass} required>
            <option value="" disabled>Selecione um cliente</option>
            {clients.map((client: Client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
            ))}
            </select>
        </div>
        <div>
            <label htmlFor="linkedContractId" className="block text-sm font-medium text-text-secondary mb-1">Contrato Vinculado (Opcional)</label>
            <select id="linkedContractId" value={linkedContractId || ''} onChange={(e) => setLinkedContractId(e.target.value || undefined)} className={commonInputClass} disabled={availableContracts.length === 0}>
                <option value="">{availableContracts.length > 0 ? 'Nenhum contrato' : 'Nenhum contrato para este cliente'}</option>
                {availableContracts.map(contract => (
                    <option key={contract.id} value={contract.id}>{contract.title}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-text-secondary mb-1">Tipo de Serviço</label>
            <select id="serviceType" value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)} className={commonInputClass}>
            {SERVICE_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
            {serviceType === ServiceType.OTHER && (
                <input 
                    type="text" 
                    value={customServiceType} 
                    onChange={(e) => setCustomServiceType(e.target.value)} 
                    placeholder="Qual o tipo de serviço?" 
                    className={`${commonInputClass} mt-2`} 
                    required 
                />
            )}
        </div>
        <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-text-secondary mb-1">Prazo de Entrega <span className="text-red-500">*</span></label>
            <input type="date" id="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={commonInputClass} required/>
        </div>
      </div>
       <div className="bg-subtle-bg p-3 rounded-lg border border-border-color">
        <h3 className="text-base font-medium text-text-primary mb-2">Datas Adicionais (Opcional)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-2">
                <label htmlFor="recordingDate" className="block text-sm font-medium text-text-secondary mb-1">Dia da Gravação</label>
                <input type="date" id="recordingDate" value={recordingDate} onChange={(e) => setRecordingDate(e.target.value)} className={commonInputClass}/>
            </div>
            <div>
                <label htmlFor="recordingTime" className="block text-sm font-medium text-text-secondary mb-1">Horário</label>
                <input type="time" id="recordingTime" value={recordingTime} onChange={(e) => setRecordingTime(e.target.value)} className={commonInputClass} disabled={!recordingDate}/>
            </div>
        </div>
      </div>
      
      <div className="bg-subtle-bg p-3 rounded-lg border border-border-color">
        <h3 className="text-base font-medium text-text-primary mb-2">Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="value" className="block text-sm font-medium text-text-secondary mb-1">Valor Total (R$)</label>
                <input type="number" id="value" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className={commonInputClass} min="0" step="0.01" />
            </div>
             <div>
                <label htmlFor="cost" className="block text-sm font-medium text-text-secondary mb-1">Custo do Job (R$) (Opcional)</label>
                <input type="number" id="cost" value={cost || ''} onChange={(e) => setCost(e.target.value ? parseFloat(e.target.value) : undefined)} className={commonInputClass} min="0" step="0.01" />
            </div>
        </div>
        {value > 0 && (
             <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs font-medium text-text-secondary">Entrada (40%)</p>
                    <p className="text-sm font-semibold text-text-primary bg-highlight-bg px-2 py-1 rounded">{formatCurrency(value * 0.4, false)}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-text-secondary">Restante (60%)</p>
                    <p className="text-sm font-semibold text-text-primary bg-highlight-bg px-2 py-1 rounded">{formatCurrency(value * 0.6, false)}</p>
                </div>
            </div>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className={commonInputClass}>
        {JOB_STATUS_OPTIONS.filter(opt => opt.value !== JobStatus.PAID).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
        ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Links da Nuvem (Opcional)</label>
        {cloudLinks.map((link, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <LinkIcon size={18} />
            <input 
              type="url" 
              value={link} 
              onChange={(e) => handleCloudLinkChange(index, e.target.value)} 
              className={commonInputClass} 
              placeholder={`https://...`}
            />
            {link && (
                 <button type="button" onClick={() => removeCloudLink(index)} className="p-1 text-red-500 hover:text-red-700">
                    <RemoveLinkIcon size={18} />
                 </button>
            )}
          </div>
        ))}
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">Notas Gerais (Opcional)</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={commonInputClass} placeholder="Detalhes adicionais sobre o job..."></textarea>
      </div>

      <div className="space-y-3 bg-subtle-bg p-3 rounded-lg border border-border-color">
        <div className="flex items-center space-x-2">
            <input
            type="checkbox"
            id="createCalendarEvent"
            checked={createCalendarEvent}
            onChange={(e) => setCreateCalendarEvent(e.target.checked)}
            className="h-4 w-4 text-accent border-border-color rounded focus:ring-accent"
            />
            <label htmlFor="createCalendarEvent" className="text-sm font-medium text-text-secondary flex items-center">
                <CalendarIcon size={16} className="mr-1 text-accent" /> Criar evento no Google Calendar para o prazo
            </label>
        </div>
        <div className="flex items-center space-x-2">
            <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 text-accent border-border-color rounded focus:ring-accent"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-text-secondary flex items-center">
                <SyncIcon size={16} className="mr-1 text-accent" /> Job Recorrente (cria um novo para o próximo mês ao ser finalizado)
            </label>
        </div>
         <div className="flex items-center space-x-2">
            <input
            type="checkbox"
            id="isTeamJob"
            checked={isTeamJob}
            onChange={(e) => setIsTeamJob(e.target.checked)}
            className="h-4 w-4 text-accent border-border-color rounded focus:ring-accent"
            />
            <label htmlFor="isTeamJob" className="text-sm font-medium text-text-secondary flex items-center">
                <UsersIcon size={16} className="mr-1 text-accent" /> Compartilhar com a equipe (visível no Kanban)
            </label>
        </div>
      </div>


      <div className="flex justify-end pt-4 border-t border-border-color sticky bottom-0 bg-card-bg py-2">
        <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:brightness-90 transition-all">
          {jobToEdit ? 'Salvar Alterações' : 'Adicionar Job'}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
