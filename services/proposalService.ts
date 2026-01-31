import { Proposal, ProposalContent, ProposalTemplate, Client, Job, ServiceType } from '../types';
import { generateProposalContent } from './geminiService';
import * as blobService from './blobStorageService';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_USER_ID = 'system_data';

// Default proposal template based on bigprodutora.com/proposta
const DEFAULT_PROPOSAL_TEMPLATE: Omit<ProposalTemplate, 'id' | 'name' | 'serviceType'> = {
  content: {
    steps: [
      {
        id: '1',
        number: 1,
        title: 'Fechamento',
        description: 'Efetuação do pagamento, assinatura do contrato e preenchimento do briefing.',
        duration: '1 dia',
        deliverables: ['Contrato assinado', 'Briefing preenchido', 'Pagamento confirmado']
      },
      {
        id: '2',
        number: 2,
        title: 'Alinhamento',
        description: 'Esclarecimento de dúvidas de ambas as partes para garantir resultados e produção do roteiro.',
        duration: '2-3 dias',
        deliverables: ['Roteiro aprovado', 'Diretrizes claras', 'Cronograma definido']
      },
      {
        id: '3',
        number: 3,
        title: 'Produção',
        description: 'Após o alinhamento, entramos na fase de pesquisa e criação e/ou edição.',
        duration: '5-10 dias',
        deliverables: ['Conteúdo criado', 'Edição inicial', 'Revisão interna']
      },
      {
        id: '4',
        number: 4,
        title: 'Apresentação',
        description: 'A produção será enviada pelo WhatsApp para aprovação.',
        duration: '1 dia',
        deliverables: ['Envio para aprovação', 'Feedback coletado']
      },
      {
        id: '5',
        number: 5,
        title: 'Alterações',
        description: '3 Alterações gratuitas desde que não haja distorção do material.',
        duration: '2-3 dias',
        deliverables: ['Alterações implementadas', 'Versão final']
      },
      {
        id: '6',
        number: 6,
        title: 'Entrega Final',
        description: 'Todo material aprovado será disponibilizado em altíssima qualidade e em servidores nuvem.',
        duration: '1 dia',
        deliverables: ['Arquivos finais', 'Links de download', 'Garantia']
      }
    ],
    clientInfo: {
      name: '',
      company: '',
      email: '',
      phone: ''
    },
    companyInfo: {
      name: 'BIG SOLUÇÕES',
      email: 'sac@msolucoescriativas.com',
      phone: '(46) 98404-4021',
      instagram: '@bigsolucoes'
    },
    terms: {
      paymentMethod: '50% na contratação, 50% na entrega',
      revisions: 3,
      warranty: '30 dias',
      deliveryFormat: 'Digital em nuvem'
    }
  },
  customizations: {
    colors: {
      primary: '#1e293b',
      secondary: '#64748b'
    }
  },
  isDefault: true
};

export const createProposal = async (
  clientId: string,
  jobId?: string,
  customContent?: ProposalContent
): Promise<Proposal> => {
  const proposalId = uuidv4();
  
  let content: ProposalContent;
  
  if (customContent) {
    content = customContent;
  } else {
    // Generate with AI if no custom content provided
    const clients = await blobService.get<Client[]>(SYSTEM_USER_ID, 'clients') || [];
    const jobs = await blobService.get<Job[]>(SYSTEM_USER_ID, 'jobs') || [];
    
    const client = clients.find(c => c.id === clientId);
    const job = jobId ? jobs.find(j => j.id === jobId) : undefined;
    
    if (!client) {
      throw new Error('Cliente não encontrado');
    }
    
    if (job) {
      content = await generateProposalContent(job, client);
    } else {
      // Use default template
      content = {
        ...DEFAULT_PROPOSAL_TEMPLATE.content,
        clientInfo: {
          name: client.name,
          company: client.company || '',
          email: client.email,
          phone: client.phone || ''
        }
      };
    }
  }
  
  const job = jobId ? (await blobService.get<Job[]>(SYSTEM_USER_ID, 'jobs') || []).find(j => j.id === jobId) : undefined;
  
  const proposal: Proposal = {
    id: proposalId,
    title: job ? `Proposta - ${job.name}` : 'Proposta Comercial',
    clientId,
    jobId,
    content,
    status: 'draft',
    createdAt: new Date().toISOString(),
    totalValue: job?.value || 0,
    customizations: DEFAULT_PROPOSAL_TEMPLATE.customizations
  };
  
  // Save proposal
  const proposals = await blobService.get<Proposal[]>(SYSTEM_USER_ID, 'proposals') || [];
  const updatedProposals = [proposal, ...proposals];
  await blobService.set(SYSTEM_USER_ID, 'proposals', updatedProposals);
  
  return proposal;
};

export const updateProposal = async (proposal: Proposal): Promise<void> => {
  const proposals = await blobService.get<Proposal[]>(SYSTEM_USER_ID, 'proposals') || [];
  const updatedProposals = proposals.map(p => p.id === proposal.id ? proposal : p);
  await blobService.set(SYSTEM_USER_ID, 'proposals', updatedProposals);
};

export const getProposals = async (): Promise<Proposal[]> => {
  return await blobService.get<Proposal[]>(SYSTEM_USER_ID, 'proposals') || [];
};

export const getProposalById = async (id: string): Promise<Proposal | null> => {
  const proposals = await getProposals();
  return proposals.find(p => p.id === id) || null;
};

export const deleteProposal = async (id: string): Promise<void> => {
  const proposals = await getProposals();
  const updatedProposals = proposals.filter(p => p.id !== id);
  await blobService.set(SYSTEM_USER_ID, 'proposals', updatedProposals);
};

export const sendProposal = async (id: string): Promise<void> => {
  const proposal = await getProposalById(id);
  if (!proposal) throw new Error('Proposta não encontrada');
  
  proposal.status = 'sent';
  proposal.sentAt = new Date().toISOString();
  await updateProposal(proposal);
};

export const acceptProposal = async (id: string): Promise<void> => {
  const proposal = await getProposalById(id);
  if (!proposal) throw new Error('Proposta não encontrada');
  
  proposal.status = 'accepted';
  proposal.acceptedAt = new Date().toISOString();
  await updateProposal(proposal);
};

export const rejectProposal = async (id: string): Promise<void> => {
  const proposal = await getProposalById(id);
  if (!proposal) throw new Error('Proposta não encontrada');
  
  proposal.status = 'rejected';
  await updateProposal(proposal);
};

// Template management
export const createProposalTemplate = async (
  name: string,
  serviceType: ServiceType,
  content: ProposalContent,
  customizations?: ProposalTemplate['customizations']
): Promise<ProposalTemplate> => {
  const template: ProposalTemplate = {
    id: uuidv4(),
    name,
    serviceType,
    content,
    customizations: customizations || DEFAULT_PROPOSAL_TEMPLATE.customizations,
    isDefault: false
  };
  
  const templates = await blobService.get<ProposalTemplate[]>(SYSTEM_USER_ID, 'proposalTemplates') || [];
  const updatedTemplates = [template, ...templates];
  await blobService.set(SYSTEM_USER_ID, 'proposalTemplates', updatedTemplates);
  
  return template;
};

export const getProposalTemplates = async (): Promise<ProposalTemplate[]> => {
  return await blobService.get<ProposalTemplate[]>(SYSTEM_USER_ID, 'proposalTemplates') || [];
};

export const updateProposalTemplate = async (template: ProposalTemplate): Promise<void> => {
  const templates = await getProposalTemplates();
  const updatedTemplates = templates.map(t => t.id === template.id ? template : t);
  await blobService.set(SYSTEM_USER_ID, 'proposalTemplates', updatedTemplates);
};

export const deleteProposalTemplate = async (id: string): Promise<void> => {
  const templates = await getProposalTemplates();
  const updatedTemplates = templates.filter(t => t.id !== id);
  await blobService.set(SYSTEM_USER_ID, 'proposalTemplates', updatedTemplates);
};

export const setDefaultProposalTemplate = async (id: string): Promise<void> => {
  const templates = await getProposalTemplates();
  const updatedTemplates = templates.map(t => ({ ...t, isDefault: t.id === id }));
  await blobService.set(SYSTEM_USER_ID, 'proposalTemplates', updatedTemplates);
};

export const getDefaultTemplate = async (serviceType?: ServiceType): Promise<ProposalTemplate | null> => {
  const templates = await getProposalTemplates();
  
  if (serviceType) {
    const serviceTemplate = templates.find(t => t.serviceType === serviceType && t.isDefault);
    if (serviceTemplate) return serviceTemplate;
  }
  
  return templates.find(t => t.isDefault) || null;
};
