import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { Job, Client, AppSettings, DraftNote, JobStatus, User, ServiceType, Contract } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';
import * as blobService from '../services/blobStorageService';

const SYSTEM_USER_ID = 'system_data';

// Default theme colors
const DEFAULT_PRIMARY_COLOR = '#f8fafc'; // slate-50
const DEFAULT_ACCENT_COLOR = '#1e293b'; // slate-800
const DEFAULT_SPLASH_BACKGROUND_COLOR = '#111827'; // Dark Slate (e.g., gray-900)

const defaultInitialSettings: AppSettings = {
  asaasUrl: 'https://www.asaas.com/login',
  userName: '',
  primaryColor: DEFAULT_PRIMARY_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
  splashScreenBackgroundColor: DEFAULT_SPLASH_BACKGROUND_COLOR,
  privacyModeEnabled: false,
  teamMembers: [],
  theme: 'light',
};


interface AppDataContextType {
  jobs: Job[];
  clients: Client[];
  contracts: Contract[];
  draftNotes: DraftNote[];
  settings: AppSettings;
  allUsers: User[]; // All users in the system for team management
  jobForDetails: Job | null;
  setJobForDetails: (job: Job | null) => void;
  draftForDetails: DraftNote | null;
  setDraftForDetails: (draft: DraftNote | null) => void;
  contractForDetails: Contract | null;
  setContractForDetails: (contract: Contract | null) => void;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'isDeleted' | 'observationsLog' | 'payments' | 'cloudLinks' | 'tasks' | 'linkedDraftIds' | 'ownerId' | 'ownerUsername' | 'linkedContractId'> & Partial<Pick<Job, 'cloudLinks' | 'cost' | 'isRecurring' | 'createCalendarEvent' | 'isTeamJob' | 'linkedContractId'>>) => void;
  updateJob: (job: Job) => void;
  deleteJob: (jobId: string) => void; // Soft delete
  permanentlyDeleteJob: (jobId: string) => void; // Hard delete
  getJobById: (jobId: string) => Job | undefined;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'cpf' | 'observations'> & Partial<Pick<Client, 'cpf' | 'observations'>>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Client | undefined;
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'ownerId' | 'ownerUsername'>) => void;
  updateContract: (contract: Contract) => void;
  deleteContract: (contractId: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addDraftNote: (draft: { title: string, type: 'TEXT' | 'SCRIPT' }) => DraftNote;
  updateDraftNote: (draft: DraftNote) => void;
  deleteDraftNote: (draftId: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => Promise<boolean>;
  loading: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// --- START: Sample Data for New Users ---
const initialClientsForNewUser: Client[] = [
    { id: 'client1', name: 'Ana Silva', company: 'TechCorp Solutions', email: 'ana.silva@techcorp.com', phone: '11987654321', createdAt: new Date().toISOString() },
    { id: 'client2', name: 'Bruno Costa', company: 'Design Criativo', email: 'bruno@designcriativo.com', phone: '21912345678', createdAt: new Date().toISOString() },
    { id: 'client3', name: 'Carla Dias', company: 'Eventos Memoráveis', email: 'carla.dias@eventos.com', phone: '31988887777', createdAt: new Date().toISOString() },
    { id: 'client4', name: 'Daniel Rocha', email: 'daniel.rocha@email.com', createdAt: new Date().toISOString() },
    { id: 'client5', name: 'Elisa Ferreira', company: 'Imóveis & Cia', email: 'elisa@imoveis.com', phone: '41999990000', createdAt: new Date().toISOString() },
];

const getInitialJobsForNewUser = (currentUser: User, clients: Client[]): Job[] => {
    const now = new Date();
    const ownerProps = { ownerId: currentUser.id, ownerUsername: currentUser.username };
    const aFewDaysAgo = (days: number) => new Date(new Date().setDate(now.getDate() - days)).toISOString();
    const inAFewDays = (days: number) => new Date(new Date().setDate(now.getDate() + days)).toISOString();

    return [
        { id: uuidv4(), name: 'Vídeo Institucional TechCorp', clientId: clients[0].id, serviceType: ServiceType.INSTITUCIONAL, value: 5000, deadline: inAFewDays(15), status: JobStatus.PRODUCTION, createdAt: aFewDaysAgo(5), payments: [{ id: uuidv4(), amount: 2000, date: new Date().toISOString(), method: 'PIX' }], tasks: [{ id: uuidv4(), text: 'Roteiro aprovado', isCompleted: true }, { id: uuidv4(), text: 'Gravação dia 1', isCompleted: false }], isDeleted: false, observationsLog: [], cloudLinks: [], isRecurring: false, linkedDraftIds: [], ...ownerProps },
        { id: uuidv4(), name: 'Fotos para Catálogo', clientId: clients[1].id, serviceType: ServiceType.PHOTO, value: 1200, deadline: aFewDaysAgo(3), status: JobStatus.REVIEW, createdAt: aFewDaysAgo(20), payments: [], tasks: [], isDeleted: false, observationsLog: [], cloudLinks: [], isRecurring: false, linkedDraftIds: [], ...ownerProps },
        { id: uuidv4(), name: 'Cobertura Evento de Lançamento', clientId: clients[2].id, serviceType: ServiceType.EVENTOS, value: 3500, deadline: inAFewDays(5), status: JobStatus.FINALIZED, createdAt: aFewDaysAgo(10), payments: [{ id: uuidv4(), amount: 1500, date: aFewDaysAgo(9), method: 'Transferência' }], tasks: [], isDeleted: false, observationsLog: [], cloudLinks: [], isRecurring: false, linkedDraftIds: [], ...ownerProps },
        { id: uuidv4(), name: 'Criação de Website Pessoal', clientId: clients[3].id, serviceType: ServiceType.SITES, value: 4200, deadline: inAFewDays(45), status: JobStatus.BRIEFING, createdAt: new Date().toISOString(), payments: [], tasks: [], isDeleted: false, observationsLog: [], cloudLinks: [], isRecurring: false, linkedDraftIds: [], ...ownerProps },
        { id: uuidv4(), name: 'Gerenciamento de Redes Sociais', clientId: clients[4].id, serviceType: ServiceType.SOCIAL_MEDIA, value: 2500, deadline: inAFewDays(25), status: JobStatus.PRODUCTION, createdAt: aFewDaysAgo(2), payments: [], tasks: [], isDeleted: false, observationsLog: [], cloudLinks: [], isRecurring: true, linkedDraftIds: [], ...ownerProps }
    ];
};

const getInitialContractsForNewUser = (currentUser: User): Contract[] => {
    const ownerProps = { ownerId: currentUser.id, ownerUsername: currentUser.username };
    return [
        { id: 'contract1', title: 'Contrato Padrão - TechCorp', clientId: 'client1', content: 'Este é um modelo de contrato para prestação de serviços de vídeo institucional...', createdAt: new Date().toISOString(), ...ownerProps },
    ];
};

const initialDraftNotesForNewUser: DraftNote[] = [
    {id: uuidv4(), title: "Exemplo de Roteiro", type: 'SCRIPT', content: "", scriptLines: [{id: uuidv4(), scene: "1", description: "CENA DE ABERTURA: Um dia ensolarado no parque.", duration: 15}], attachments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
];
// --- END: Sample Data for New Users ---


export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [draftNotes, setDraftNotes] = useState<DraftNote[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultInitialSettings);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobIdForDetails, setJobIdForDetails] = useState<string | null>(null);
  const [draftForDetails, setDraftForDetails] = useState<DraftNote | null>(null);
  const [contractIdForDetails, setContractIdForDetails] = useState<string | null>(null);

  const jobForDetails = useMemo(() => {
    if (!jobIdForDetails) return null;
    return jobs.find(job => job.id === jobIdForDetails) ?? null;
  }, [jobs, jobIdForDetails]);

  const setJobForDetails = useCallback((job: Job | null) => {
    setJobIdForDetails(job ? job.id : null);
  }, []);

  const contractForDetails = useMemo(() => {
    if (!contractIdForDetails) return null;
    return contracts.find(c => c.id === contractIdForDetails) ?? null;
  }, [contracts, contractIdForDetails]);

  const setContractForDetails = useCallback((contract: Contract | null) => {
    setContractIdForDetails(contract ? contract.id : null);
  }, []);

  useEffect(() => {
    // These are now handled by CSS variables in index.html, but we keep this for dynamic user settings
    document.documentElement.style.setProperty('--color-accent', settings.accentColor || DEFAULT_ACCENT_COLOR);
    document.documentElement.style.setProperty('--color-input-focus-border', settings.accentColor || DEFAULT_ACCENT_COLOR);
    // Note: primaryColor is not used here anymore as `bg-main-bg` in `index.html` handles it.
  }, [settings.accentColor]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setJobs([]);
      setClients([]);
      setContracts([]);
      setDraftNotes([]);
      setSettings(defaultInitialSettings);
      setAllUsers([]);
      return;
    }
    
    const loadUserData = async () => {
      setLoading(true);
      try {
        const storedUsers = await blobService.get<User[]>(SYSTEM_USER_ID, 'users');
        const systemUsers = storedUsers || [];
        setAllUsers(systemUsers);

        const storedSettings = await blobService.get<AppSettings>(currentUser.id, 'settings');
        const userSettings = { ...defaultInitialSettings, ...(storedSettings || {}) };
        
        const teamMemberUsernames = userSettings.teamMembers || [];
        const usernamesToFetch = [currentUser.username, ...teamMemberUsernames];
        const userIdsToFetch = systemUsers
            .filter(u => usernamesToFetch.includes(u.username))
            .map(u => u.id);

        const jobsPromises = userIdsToFetch.map(id => blobService.get<Job[]>(id, 'jobs'));
        const teamJobsData = await Promise.all(jobsPromises);

        const allTeamJobs: Job[] = teamJobsData.flatMap((userJobs, index) => {
          if (!userJobs) return [];
          const ownerId = userIdsToFetch[index];
          const owner = systemUsers.find(u => u.id === ownerId);
          return userJobs.map((job: any): Job => ({
            ...job, id: job.id || uuidv4(), isDeleted: job.isDeleted ?? false, observationsLog: job.observationsLog || [], cloudLinks: job.cloudLinks || (job.cloudLink ? [job.cloudLink] : []), cost: job.cost ?? undefined, payments: job.payments || [], isRecurring: job.isRecurring ?? false, tasks: job.tasks || [], linkedDraftIds: job.linkedDraftIds || [],
            ownerId: ownerId,
            ownerUsername: owner?.username || 'Desconhecido',
            isTeamJob: job.isTeamJob ?? false,
          }));
        });
        
        const [storedClients, storedContracts, storedDrafts] = await Promise.all([
          blobService.get<Client[]>(currentUser.id, 'clients'),
          blobService.get<Contract[]>(currentUser.id, 'contracts'),
          blobService.get<DraftNote[]>(currentUser.id, 'draftNotes'),
        ]);

        const isNewUser = !storedClients && !storedDrafts && !userSettings.userName && allTeamJobs.filter(j => j.ownerId === currentUser.id).length === 0;

        const finalInitialClients = isNewUser ? initialClientsForNewUser : (storedClients || []);
        const finalInitialJobs = isNewUser ? getInitialJobsForNewUser(currentUser, finalInitialClients) : [];
        const finalInitialContracts = isNewUser ? getInitialContractsForNewUser(currentUser) : (storedContracts || []);
        const finalInitialDrafts = isNewUser ? initialDraftNotesForNewUser : (storedDrafts || []);
        
        setJobs(isNewUser ? [...allTeamJobs, ...finalInitialJobs] : allTeamJobs);
        setClients(finalInitialClients);
        setContracts(finalInitialContracts);
        
        const parsedDrafts = finalInitialDrafts.map((draft: any): DraftNote => ({
          ...draft, type: draft.type || 'SCRIPT', scriptLines: draft.scriptLines || (draft.content ? [{id: uuidv4(), scene: "1", description: draft.content, duration: 0}] : []), content: draft.content || '', attachments: draft.attachments || [],
        }));
        setDraftNotes(parsedDrafts);
        
        setSettings({ ...userSettings, userName: userSettings.userName || currentUser.username });

      } catch (error) {
        console.error("Failed to load or migrate data from blob storage for user", currentUser.id, error);
        setJobs([]); setClients([]); setContracts([]); setDraftNotes([]); setSettings(defaultInitialSettings);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [currentUser]);

  const saveData = useCallback(async <T extends unknown>(key: string, data: T, userId?: string) => {
    const targetUserId = userId || currentUser?.id;
    if (!loading && targetUserId && data) {
        console.log(`Saving ${key} for user ${targetUserId}`);
        try {
            await blobService.set(targetUserId, key, data);
        } catch (error) {
            console.error(`Error saving ${key} data:`, error);
            toast.error(`Failed to save ${key}. Please try again.`);
        }
    }
  }, [currentUser, loading]);

  // Remove all auto-save effects since we'll handle saves manually in each operation


  const addJob = useCallback(async (jobData: Omit<Job, 'id' | 'createdAt' | 'isDeleted' | 'observationsLog' | 'payments' | 'cloudLinks' | 'tasks' | 'linkedDraftIds' | 'ownerId' | 'ownerUsername' | 'linkedContractId'> & Partial<Pick<Job, 'cloudLinks' | 'cost' | 'isRecurring' | 'createCalendarEvent' | 'isTeamJob' | 'linkedContractId'>>) => {
    if (!currentUser) return;
    const newJob: Job = {
        ...jobData,
        id: uuidv4(), 
        createdAt: new Date().toISOString(), 
        isDeleted: false, 
        observationsLog: [], 
        payments: [], 
        cloudLinks: jobData.cloudLinks || [], 
        isRecurring: jobData.isRecurring || false, 
        tasks: [], 
        linkedDraftIds: [],
        ownerId: currentUser.id,
        ownerUsername: currentUser.username,
        isTeamJob: jobData.isTeamJob || false,
    };
    const newJobs = [...jobs, newJob];
    const userJobs = newJobs.filter(j => j.ownerId === currentUser.id);
    await saveData('jobs', userJobs);
    setJobs(newJobs);
  }, [currentUser, saveData, jobs]);

  const updateJob = useCallback(async (updatedJob: Job) => {
    if (!currentUser) return;
    let newJobs = jobs.map(job => job.id === updatedJob.id ? updatedJob : job);
    
    const previousJob = jobs.find(j => j.id === updatedJob.id);
    if (previousJob && previousJob.status !== JobStatus.PAID && updatedJob.status === JobStatus.PAID && updatedJob.isRecurring) {
      const deadlineDate = new Date(updatedJob.deadline);
      deadlineDate.setMonth(deadlineDate.getMonth() + 1);

      const newRecurringJob: Job = {
          ...updatedJob,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          deadline: deadlineDate.toISOString(),
          status: JobStatus.BRIEFING, 
          payments: [],
          observationsLog: [],
          tasks: [],
          linkedDraftIds: [],
          name: `${updatedJob.name.replace(/ \(Mês Seguinte\)$/i, '')}`,
      };

      toast.success(`Job recorrente "${newRecurringJob.name}" criado para o próximo mês.`);
      newJobs = [...newJobs, newRecurringJob];
    }
    
    const userJobs = newJobs.filter(j => j.ownerId === currentUser.id);
    await saveData('jobs', userJobs);
    setJobs(newJobs);
  }, [currentUser, saveData, jobs]);

  const deleteJob = useCallback(async (jobId: string) => { 
    if (!currentUser) return;
    const newJobs = jobs.map(job => job.id === jobId ? { ...job, isDeleted: true } : job);
    const userJobs = newJobs.filter(j => j.ownerId === currentUser.id);
    await saveData('jobs', userJobs);
    setJobs(newJobs);
  }, [currentUser, saveData, jobs]);

  const permanentlyDeleteJob = useCallback(async (jobId: string) => { 
    if (!currentUser) return;
    const newJobs = jobs.filter(job => job.id !== jobId);
    const userJobs = newJobs.filter(j => j.ownerId === currentUser.id);
    await saveData('jobs', userJobs);
    setJobs(newJobs);
  }, [currentUser, saveData, jobs]);
  
  const getJobById = useCallback((jobId: string) => jobs.find(job => job.id === jobId), [jobs]);
  
  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>) => { 
    if (!currentUser) return;
    const newClient = { ...clientData, id: uuidv4(), createdAt: new Date().toISOString() };
    const newClients = [...clients, newClient];
    await saveData('clients', newClients);
    setClients(newClients);
  }, [currentUser, saveData, clients]);

  const updateClient = useCallback(async (updatedClient: Client) => { 
    if (!currentUser) return;
    const newClients = clients.map(client => client.id === updatedClient.id ? updatedClient : client);
    await saveData('clients', newClients);
    setClients(newClients);
  }, [currentUser, saveData, clients]);
  
  const deleteClient = useCallback(async (clientId: string) => {
    if (!currentUser) return;
    const clientToDelete = clients.find(c => c.id === clientId);
    if (!clientToDelete) return;

    const associatedContracts = contracts.filter(c => c.clientId === clientId);
    const associatedJobsCount = jobs.filter(job => job.clientId === clientId && !job.isDeleted).length;
    
    let confirmMessage = `Tem certeza que deseja excluir o cliente "${clientToDelete.name}"?`;
    if (associatedContracts.length > 0) {
        confirmMessage += `\n\nATENÇÃO: ${associatedContracts.length} contrato(s) associado(s) também será(ão) EXCLUÍDO(S) PERMANENTEMENTE.`;
    }
    if (associatedJobsCount > 0) {
      confirmMessage += `\n\n${associatedJobsCount} job(s) associados perderão a referência a este cliente.`;
    }
    confirmMessage += "\n\nEsta ação não pode ser desfeita.";

    if (window.confirm(confirmMessage)) {
      if (associatedContracts.length > 0) {
        const contractIdsToDelete = new Set(associatedContracts.map(c => c.id));
        const newContracts = contracts.filter(c => !contractIdsToDelete.has(c.id));
        await saveData('contracts', newContracts);
        setContracts(newContracts);

        const newJobs = jobs.map(job => contractIdsToDelete.has(job.linkedContractId || '') ? { ...job, linkedContractId: undefined } : job);
        const userJobs = newJobs.filter(j => j.ownerId === currentUser.id);
        await saveData('jobs', userJobs);
        setJobs(newJobs);
      }

      const newClients = clients.filter(client => client.id !== clientId);
      await saveData('clients', newClients);
      setClients(newClients);
      
      toast.success('Cliente e contratos associados foram excluídos com sucesso!');
    }
  }, [currentUser, clients, contracts, jobs, saveData]);

  const getClientById = useCallback((clientId: string) => clients.find(client => client.id === clientId), [clients]);
  
  const addContract = useCallback(async (contractData: Omit<Contract, 'id' | 'createdAt' | 'ownerId' | 'ownerUsername'>) => {
    if (!currentUser) return;
    const newContract: Contract = {
        ...contractData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ownerId: currentUser.id,
        ownerUsername: currentUser.username,
    };
    const newContracts = [...contracts, newContract];
    await saveData('contracts', newContracts);
    setContracts(newContracts);
  }, [currentUser, saveData, contracts]);

  const updateContract = useCallback(async (updatedContract: Contract) => { 
    if (!currentUser) return;
    const newContracts = contracts.map(contract => contract.id === updatedContract.id ? updatedContract : contract);
    await saveData('contracts', newContracts);
    setContracts(newContracts);
  }, [currentUser, saveData, contracts]);
  
  const deleteContract = useCallback(async (contractId: string) => { 
    if (!currentUser) return;
    const newContracts = contracts.filter(contract => contract.id !== contractId);
    await saveData('contracts', newContracts);
    setContracts(newContracts);
    
    const newJobs = jobs.map(job => job.linkedContractId === contractId ? { ...job, linkedContractId: undefined } : job);
    const userJobs = newJobs.filter(j => j.ownerId === currentUser.id);
    await saveData('jobs', userJobs);
    setJobs(newJobs);
  }, [currentUser, saveData, contracts, jobs]);
  
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => { 
    if (!currentUser) return;
    const updatedSettings = { ...settings, ...newSettings };
    await saveData('settings', updatedSettings);
    setSettings(updatedSettings);
  }, [currentUser, saveData, settings]);
  
  const addDraftNote = useCallback(async (draftData: { title: string, type: 'TEXT' | 'SCRIPT' }): Promise<DraftNote> => {
    if (!currentUser) throw new Error("User not authenticated.");
    const newDraft: DraftNote = { 
      ...draftData, 
      id: uuidv4(), 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(), 
      content: draftData.type === 'TEXT' ? '' : '', 
      scriptLines: draftData.type === 'SCRIPT' ? [{ id: uuidv4(), scene: '1', description: '', duration: 0 }] : [], 
      attachments: [], 
    };
    const newDrafts = [newDraft, ...draftNotes];
    await saveData('draftNotes', newDrafts);
    setDraftNotes(newDrafts);
    return newDraft;
  }, [currentUser, saveData, draftNotes]);

  const updateDraftNote = useCallback(async (updatedDraft: DraftNote) => { 
    if (!currentUser) return;
    const newDrafts = draftNotes.map(draft => 
      draft.id === updatedDraft.id ? { ...updatedDraft, updatedAt: new Date().toISOString() } : draft
    );
    await saveData('draftNotes', newDrafts);
    setDraftNotes(newDrafts);
  }, [currentUser, saveData, draftNotes]);

  const deleteDraftNote = useCallback(async (draftId: string) => { 
    if (!currentUser) return;
    const newDrafts = draftNotes.filter(draft => draft.id !== draftId);
    await saveData('draftNotes', newDrafts);
    setDraftNotes(newDrafts);
  }, [currentUser, saveData, draftNotes]);

  const exportData = useCallback(async () => {
    if (!currentUser) {
      toast.error("Você precisa estar logado para exportar dados.");
      return;
    }

    try {
      // Filter user-specific data
      const userJobsToExport = jobs.filter(j => j.ownerId === currentUser.id);
      const userContractsToExport = contracts.filter(c => c.ownerId === currentUser.id);

      const dataToExport = {
        version: '2.5-contracts-owned',
        exportedAt: new Date().toISOString(),
        data: {
          jobs: userJobsToExport,
          clients,
          contracts: userContractsToExport,
          draftNotes,
          settings,
        }
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `big_backup_${currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      // Ensure data is synced after export
      await saveData('jobs', userJobsToExport);
      await saveData('contracts', userContractsToExport);
      await saveData('clients', clients);
      await saveData('draftNotes', draftNotes);
      await saveData('settings', settings);
      
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Erro ao exportar dados. Tente novamente.");
    }
  }, [jobs, clients, contracts, draftNotes, settings, currentUser, saveData]);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    if (!currentUser) {
      toast.error("Você precisa estar logado para importar dados.");
      return false;
    }
    try {
      const parsedData = JSON.parse(jsonData);
      if (!parsedData.data || !parsedData.data.jobs || !parsedData.data.clients || !parsedData.data.settings) {
        toast.error("Arquivo de backup inválido ou corrompido.");
        return false;
      }

      const {
        jobs: importedJobs,
        clients: importedClients,
        contracts: importedContracts,
        draftNotes: importedDrafts,
        settings: importedSettings,
      } = parsedData.data;
      
      const jobsWithOwnership = (importedJobs || []).map((job: Job) => ({
        ...job,
        ownerId: currentUser.id,
        ownerUsername: currentUser.username,
      }));

      const contractsWithOwnership = (importedContracts || []).map((contract: Contract) => ({
        ...contract,
        ownerId: currentUser.id,
        ownerUsername: currentUser.username,
      }));

      // Await all save operations before updating state
      await Promise.all([
        saveData('jobs', jobsWithOwnership),
        saveData('contracts', contractsWithOwnership),
        saveData('clients', importedClients || []),
        saveData('draftNotes', importedDrafts || []),
        saveData('settings', importedSettings || defaultInitialSettings)
      ]);

      // Update state after all saves are complete
      setJobs(prevJobs => [...prevJobs.filter(j => j.ownerId !== currentUser.id), ...jobsWithOwnership]);
      setContracts(prevContracts => [...prevContracts.filter(c => c.ownerId !== currentUser.id), ...contractsWithOwnership]);
      setClients(importedClients || []);
      setDraftNotes(importedDrafts || []);
      setSettings(importedSettings || defaultInitialSettings);
      
      toast.success("Dados importados com sucesso! A aplicação será recarregada.");

      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Erro ao processar o arquivo de importação. Verifique se é um JSON válido.");
      return false;
    }
  }, [currentUser, saveData]);


  const contextValue: AppDataContextType = {
    jobs, clients, contracts, draftNotes, settings, allUsers, 
    addJob, updateJob, deleteJob, permanentlyDeleteJob, getJobById, 
    addClient, updateClient, deleteClient, getClientById,
    addContract, updateContract, deleteContract, 
    updateSettings, addDraftNote, updateDraftNote, deleteDraftNote, exportData, importData, loading, 
    jobForDetails, setJobForDetails, 
    draftForDetails, setDraftForDetails,
    contractForDetails, setContractForDetails
  };

  return React.createElement(AppDataContext.Provider, { value: contextValue }, children);
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};