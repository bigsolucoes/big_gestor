import { PreClient, Client, EnhancedProposal, Job, ServiceType } from '../types';
import * as blobService from './blobStorageService';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_USER_ID = 'system_data';

export class PreClientService {
  // Create pre-client from proposal
  static async createPreClient(
    name: string,
    email?: string,
    phone?: string,
    company?: string,
    proposalId?: string
  ): Promise<PreClient> {
    const preClient: PreClient = {
      id: uuidv4(),
      name,
      email,
      phone,
      company,
      status: 'pre-registered',
      proposalId,
      createdAt: new Date().toISOString()
    };

    const preClients = await this.getPreClients();
    const updatedPreClients = [preClient, ...preClients];
    await blobService.set(SYSTEM_USER_ID, 'preClients', updatedPreClients);

    return preClient;
  }

  // Get all pre-clients
  static async getPreClients(): Promise<PreClient[]> {
    return await blobService.get<PreClient[]>(SYSTEM_USER_ID, 'preClients') || [];
  }

  // Get pre-client by ID
  static async getPreClientById(id: string): Promise<PreClient | null> {
    const preClients = await this.getPreClients();
    return preClients.find(pc => pc.id === id) || null;
  }

  // Update pre-client
  static async updatePreClient(preClient: PreClient): Promise<void> {
    const preClients = await this.getPreClients();
    const updatedPreClients = preClients.map(pc => pc.id === preClient.id ? preClient : pc);
    await blobService.set(SYSTEM_USER_ID, 'preClients', updatedPreClients);
  }

  // Convert pre-client to full client
  static async convertToFullClient(preClientId: string): Promise<Client> {
    const preClient = await this.getPreClientById(preClientId);
    if (!preClient) {
      throw new Error('Pré-cliente não encontrado');
    }

    const client: Client = {
      id: uuidv4(),
      name: preClient.name,
      email: preClient.email || '',
      phone: preClient.phone || '',
      company: preClient.company || '',
      createdAt: new Date().toISOString()
    };

    // Add to clients collection
    const clients = await blobService.get<Client[]>(SYSTEM_USER_ID, 'clients') || [];
    const updatedClients = [client, ...clients];
    await blobService.set(SYSTEM_USER_ID, 'clients', updatedClients);

    // Update pre-client status
    preClient.status = 'registered';
    preClient.registeredAt = new Date().toISOString();
    await this.updatePreClient(preClient);

    return client;
  }

  // Auto-register client when proposal is approved
  static async handleProposalApproval(proposal: EnhancedProposal): Promise<Client | null> {
    if (!proposal.autoRegisterOnApproval || !proposal.preClientId) {
      return null;
    }

    try {
      const client = await this.convertToFullClient(proposal.preClientId);
      
      // Update proposal with new client ID
      const updatedProposal: EnhancedProposal = {
        ...proposal,
        clientId: client.id,
        kanbanStatus: 'approved'
      };

      // Update proposal in storage
      const proposals = await blobService.get<EnhancedProposal[]>(SYSTEM_USER_ID, 'enhancedProposals') || [];
      const updatedProposals = proposals.map(p => p.id === proposal.id ? updatedProposal : p);
      await blobService.set(SYSTEM_USER_ID, 'enhancedProposals', updatedProposals);

      return client;
    } catch (error) {
      console.error('Error auto-registering client:', error);
      return null;
    }
  }

  // Get pre-clients by kanban status
  static async getPreClientsByStatus(status: PreClient['status']): Promise<PreClient[]> {
    const preClients = await this.getPreClients();
    return preClients.filter(pc => pc.status === status);
  }

  // Update pre-client kanban status
  static async updateKanbanStatus(preClientId: string, status: EnhancedProposal['kanbanStatus']): Promise<void> {
    const preClient = await this.getPreClientById(preClientId);
    if (!preClient) return;

    // Map kanban status to pre-client status
    const statusMapping: Record<EnhancedProposal['kanbanStatus'], PreClient['status']> = {
      'pre-client': 'pre-registered',
      'contacting': 'pre-registered',
      'proposal-sent': 'pre-registered',
      'approved': 'registered',
      'rejected': 'rejected'
    };

    preClient.status = statusMapping[status] || 'pre-registered';
    await this.updatePreClient(preClient);
  }

  // Delete pre-client
  static async deletePreClient(id: string): Promise<void> {
    const preClients = await this.getPreClients();
    const updatedPreClients = preClients.filter(pc => pc.id !== id);
    await blobService.set(SYSTEM_USER_ID, 'preClients', updatedPreClients);
  }

  // Get statistics
  static async getStatistics(): Promise<{
    total: number;
    preRegistered: number;
    registered: number;
    rejected: number;
    conversionRate: number;
  }> {
    const preClients = await this.getPreClients();
    
    const total = preClients.length;
    const preRegistered = preClients.filter(pc => pc.status === 'pre-registered').length;
    const registered = preClients.filter(pc => pc.status === 'registered').length;
    const rejected = preClients.filter(pc => pc.status === 'rejected').length;
    const conversionRate = total > 0 ? (registered / total) * 100 : 0;

    return {
      total,
      preRegistered,
      registered,
      rejected,
      conversionRate
    };
  }
}
