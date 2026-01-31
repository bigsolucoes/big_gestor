
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
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
  customLinkTitle: 'Acessar Asaas',
  userName: '',
  primaryColor: DEFAULT_PRIMARY_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
  splashScreenBackgroundColor: DEFAULT_SPLASH_BACKGROUND_COLOR,
  privacyModeEnabled: false,
  teamMembers: [],
  theme: 'light',
  kanbanColumns: {},
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
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'isDeleted' | 'observationsLog' | 'payments' | 'cloudLinks' | 'tasks' | 'financialTasks' | 'linkedDraftIds' | 'ownerId' | 'ownerUsername' | 'linkedContractId'> & Partial<Pick<Job, 'cloudLinks' | 'cost' | 'isRecurring' | 'createCalendarEvent' | 'isTeamJob' | 'linkedContractId' | 'customServiceType'>>) => void;
  updateJob: (job: Job) => void;
  deleteJob: (jobId: string) => void; // Soft delete
  permanentlyDeleteJob: (jobId: string) => void; // Hard delete
  getJobById: (jobId: string) => Job | undefined;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'cpf' | 'observations'> & Partial<Pick<Client, 'cpf' | 'observations'>>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Client | undefined;
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'ownerId' | 'ownerUsername' | 'isSigned'> & Partial<Pick<Contract, 'isSigned' | 'duration'>>) => void;
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

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [draftNotes, setDraftNotes] = useState<DraftNote[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultInitialSettings);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Public user list
  const [loading, setLoading] = useState(true);
  
  // Detail Panel States
  const [jobForDetails, setJobForDetails] = useState<Job | null>(null);
  const [draftForDetails, setDraftForDetails] = useState<DraftNote | null>(null);
  const [contractForDetails, setContractForDetails] = useState<Contract | null>(null);

  const { currentUser } = useAuth();

  const loadData = useCallback(async () => {
    if (!currentUser) {
        setJobs([]);
        setClients([]);
        setContracts([]);
        setDraftNotes([]);
        setSettings(defaultInitialSettings);
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const [loadedJobs, loadedClients, loadedContracts, loadedDrafts, loadedSettings, loadedUsers] = await Promise.all([
            blobService.get<Job[]>(currentUser.id, 'jobs'),
            blobService.get<Client[]>(currentUser.id, 'clients'),
            blobService.get<Contract[]>(currentUser.id, 'contracts'),
            blobService.get<DraftNote[]>(currentUser.id, 'drafts'),
            blobService.get<AppSettings>(currentUser.id, 'settings'),
            blobService.get<User[]>(SYSTEM_USER_ID, 'users'), // Load public user list
        ]);

        setJobs(loadedJobs || []);
        setClients(loadedClients || []);
        
        // Backward compatibility for contracts without isSigned
        const normalizedContracts = (loadedContracts || []).map(c => ({
            ...c,
            isSigned: c.isSigned ?? false,
            duration: c.duration || 'Pontual'
        }));
        setContracts(normalizedContracts);

        setDraftNotes(loadedDrafts || []);
        setSettings(loadedSettings || defaultInitialSettings);
        setAllUsers(loadedUsers || []);

    } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Erro ao carregar dados da nuvem.");
    } finally {
        setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const saveData = async (key: string, data: any) => {
      if (!currentUser) return;
      try {
          await blobService.set(currentUser.id, key, data);
      } catch (e) {
          console.error(`Failed to save ${key}`, e);
          toast.error(`Erro ao salvar ${key} na nuvem.`);
      }
  };

  const addJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'isDeleted' | 'observationsLog' | 'payments' | 'cloudLinks' | 'tasks' | 'financialTasks' | 'linkedDraftIds' | 'ownerId' | 'ownerUsername' | 'linkedContractId'> & Partial<Pick<Job, 'cloudLinks' | 'cost' | 'isRecurring' | 'createCalendarEvent' | 'isTeamJob' | 'linkedContractId' | 'customServiceType'>>) => {
    if(!currentUser) return;
    const newJob: Job = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      isDeleted: false,
      observationsLog: [],
      payments: [],
      tasks: [],
      financialTasks: [],
      linkedDraftIds: [],
      cloudLinks: jobData.cloudLinks || [],
      cost: jobData.cost || 0,
      isRecurring: jobData.isRecurring || false,
      createCalendarEvent: jobData.createCalendarEvent || false,
      isTeamJob: jobData.isTeamJob || false,
      linkedContractId: jobData.linkedContractId,
      customServiceType: jobData.customServiceType,
      ownerId: currentUser.id,
      ownerUsername: currentUser.username,
      ...jobData,
    };
    const updatedJobs = [...jobs, newJob];
    setJobs(updatedJobs);
    saveData('jobs', updatedJobs);
  };

  const updateJob = (updatedJob: Job) => {
    const updatedJobs = jobs.map(job => job.id === updatedJob.id ? updatedJob : job);
    setJobs(updatedJobs);
    if(jobForDetails && jobForDetails.id === updatedJob.id) {
        setJobForDetails(updatedJob);
    }
    saveData('jobs', updatedJobs);
  };

  const deleteJob = (jobId: string) => {
    // Soft delete
    const updatedJobs = jobs.map(job => job.id === jobId ? { ...job, isDeleted: true } : job);
    setJobs(updatedJobs);
    saveData('jobs', updatedJobs);
  };

  const permanentlyDeleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
    saveData('jobs', updatedJobs);
  };

  const getJobById = (jobId: string) => jobs.find(job => job.id === jobId);

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'cpf' | 'observations'> & Partial<Pick<Client, 'cpf' | 'observations'>>) => {
    const newClient: Client = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      cpf: clientData.cpf,
      observations: clientData.observations,
      ...clientData,
    };
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    saveData('clients', updatedClients);
  };

  const updateClient = (updatedClient: Client) => {
    const updatedClients = clients.map(client => client.id === updatedClient.id ? updatedClient : client);
    setClients(updatedClients);
    saveData('clients', updatedClients);
  };

  const deleteClient = (clientId: string) => {
    // Check if client has active jobs
    const hasActiveJobs = jobs.some(job => job.clientId === clientId && !job.isDeleted && job.status !== JobStatus.PAID);
    
    if (hasActiveJobs) {
        if (!window.confirm("Este cliente possui jobs ativos. Tem certeza que deseja excluí-lo?")) {
            return;
        }
    } else {
        if (!window.confirm("Tem certeza que deseja excluir este cliente?")) {
            return;
        }
    }

    const updatedClients = clients.filter(client => client.id !== clientId);
    setClients(updatedClients);
    saveData('clients', updatedClients);
    toast.success("Cliente excluído.");
  };

  const getClientById = (clientId: string) => clients.find(client => client.id === clientId);
  
  const addContract = (contractData: Omit<Contract, 'id' | 'createdAt' | 'ownerId' | 'ownerUsername' | 'isSigned'> & Partial<Pick<Contract, 'isSigned' | 'duration'>>) => {
    if(!currentUser) return;
    const newContract: Contract = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ownerId: currentUser.id,
        ownerUsername: currentUser.username,
        isSigned: contractData.isSigned || false,
        duration: contractData.duration || 'Pontual',
        ...contractData
    };
    const updatedContracts = [...contracts, newContract];
    setContracts(updatedContracts);
    saveData('contracts', updatedContracts);
  }

  const updateContract = (updatedContract: Contract) => {
      const updatedContracts = contracts.map(c => c.id === updatedContract.id ? updatedContract : c);
      setContracts(updatedContracts);
      saveData('contracts', updatedContracts);
  }

  const deleteContract = (contractId: string) => {
      const updatedContracts = contracts.filter(c => c.id !== contractId);
      setContracts(updatedContracts);
      saveData('contracts', updatedContracts);
      
      // Remove link from jobs
      const updatedJobs = jobs.map(j => j.linkedContractId === contractId ? { ...j, linkedContractId: undefined } : j);
      setJobs(updatedJobs);
      saveData('jobs', updatedJobs);
  }

  const addDraftNote = (draftData: { title: string, type: 'TEXT' | 'SCRIPT' }) => {
    const newDraft: DraftNote = {
        id: uuidv4(),
        title: draftData.title,
        type: draftData.type,
        content: '',
        scriptLines: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const updatedDrafts = [newDraft, ...draftNotes];
    setDraftNotes(updatedDrafts);
    saveData('drafts', updatedDrafts);
    return newDraft;
  };

  const updateDraftNote = (updatedDraft: DraftNote) => {
      const draftWithTimestamp = { ...updatedDraft, updatedAt: new Date().toISOString() };
      const updatedDrafts = draftNotes.map(d => d.id === updatedDraft.id ? draftWithTimestamp : d);
      setDraftNotes(updatedDrafts);
      saveData('drafts', updatedDrafts);
  };

  const deleteDraftNote = (draftId: string) => {
      const updatedDrafts = draftNotes.filter(d => d.id !== draftId);
      setDraftNotes(updatedDrafts);
      saveData('drafts', updatedDrafts);
      
      // Unlink from jobs
      const updatedJobs = jobs.map(j => {
          if (j.linkedDraftIds && j.linkedDraftIds.includes(draftId)) {
              return { ...j, linkedDraftIds: j.linkedDraftIds.filter(id => id !== draftId) };
          }
          return j;
      });
      setJobs(updatedJobs);
      saveData('jobs', updatedJobs);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveData('settings', updated);
  };

  const exportData = () => {
    const data = {
      jobs,
      clients,
      contracts,
      draftNotes,
      settings,
      version: '1.0'
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `big_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (data.jobs && data.clients) {
        setJobs(data.jobs);
        setClients(data.clients);
        setContracts(data.contracts || []);
        setDraftNotes(data.draftNotes || []);
        setSettings(data.settings || defaultInitialSettings);
        
        await Promise.all([
             saveData('jobs', data.jobs),
             saveData('clients', data.clients),
             saveData('contracts', data.contracts || []),
             saveData('drafts', data.draftNotes || []),
             saveData('settings', data.settings || defaultInitialSettings)
        ]);

        toast.success('Dados importados com sucesso!');
        return true;
      } else {
        toast.error('Arquivo de dados inválido.');
        return false;
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao importar dados.');
      return false;
    }
  };

  const value = {
    jobs,
    clients,
    contracts,
    draftNotes,
    settings,
    allUsers,
    jobForDetails,
    setJobForDetails,
    draftForDetails,
    setDraftForDetails,
    contractForDetails,
    setContractForDetails,
    addJob,
    updateJob,
    deleteJob,
    permanentlyDeleteJob,
    getJobById,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    addContract,
    updateContract,
    deleteContract,
    updateSettings,
    addDraftNote,
    updateDraftNote,
    deleteDraftNote,
    exportData,
    importData,
    loading
  };

  return React.createElement(AppDataContext.Provider, { value }, children);
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
