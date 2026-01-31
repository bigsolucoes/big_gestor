import { Contract, ContractTemplate, ContractPreset, ContractClause, ContractGenerationOptions, Client, Job, ServiceType } from '../types';
import { generateContractContent } from './geminiService';
import * as blobService from './blobStorageService';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_USER_ID = 'system_data';

// Built-in contract templates for each service type
const BUILTIN_CONTRACT_TEMPLATES: Omit<ContractTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Contrato de Produção de Vídeo',
    serviceType: ServiceType.VIDEO,
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PRODUÇÃO DE VÍDEO

PARTES:
CONTRATANTE: [Nome do Cliente]
CONTRATADA: BIG SOLUÇÕES

CLÁUSULAS:

1. OBJETO DO CONTRATO
A CONTRATADA se compromete a produzir conteúdo audiovisual conforme especificações acordadas, incluindo:
- Roteiro e planejamento
- Filmagem em local(s) definido(s)
- Edição e pós-produção
- Entrega em formatos digitais

2. PRAZO DE ENTREGA
O prazo de entrega será de [PRAZO] dias a partir da data de início dos trabalhos.

3. VALOR E FORMAS DE PAGAMENTO
O valor total dos serviços é de R$ [VALOR], a ser pago da seguinte forma:
- 50% na contratação
- 50% na entrega final

4. DIREITOS DE USO
O CONTRATANTE detém os direitos de uso do conteúdo produzido para fins comerciais, desde que os pagamentos estejam em dia.

5. REVISÕES
Serão concedidas até [REVISÕES] revisões gratuitas, desde que não alterem a estrutura principal do conteúdo.

6. CONFIDENCIALIDADE
Ambas as partes se comprometem a manter sigilo sobre informações confidenciais trocadas durante o projeto.

7. RESCISÃO
O contrato pode ser rescindido por qualquer das partes com aviso prévio de 30 dias, sujeito às penalidades cabíveis.

Local, [DATA]

_________________________
CONTRATANTE

_________________________
BIG SOLUÇÕES`,
    isDefault: true,
    isBuiltIn: true
  },
  {
    name: 'Contrato de Serviços Fotográficos',
    serviceType: ServiceType.PHOTO,
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS

PARTES:
CONTRATANTE: [Nome do Cliente]
CONTRATADA: BIG SOLUÇÕES

CLÁUSULAS:

1. OBJETO DO CONTRATO
A CONTRATADA realizará serviços fotográficos conforme briefing aprovado, incluindo:
- Sessão fotográfica em local definido
- Edição das imagens selecionadas
- Entrega em alta resolução

2. PRAZO DE ENTREGA
As fotos editadas serão entregues em até [PRAZO] dias úteis após a sessão.

3. VALOR E FORMAS DE PAGAMENTO
O valor total é de R$ [VALOR], pago em:
- 50% na contratação
- 50% na entrega das fotos

4. DIREITOS DE USO
O CONTRATANTE possui direitos de uso das imagens para fins pessoais e comerciais, mediante pagamento integral.

5. ENTREGáveis
- Mínimo de [QUANTIDADE] fotos editadas
- Arquivos em alta resolução (300 DPI)
- Versão para redes sociais

6. REVISÕES
Até [REVISÕES] ajustes nas fotos selecionadas sem custo adicional.

Local, [DATA]

_________________________
CONTRATANTE

_________________________
BIG SOLUÇÕES`,
    isDefault: true,
    isBuiltIn: true
  },
  {
    name: 'Contrato de Serviços de Design',
    serviceType: ServiceType.DESIGN,
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESIGN

PARTES:
CONTRATANTE: [Nome do Cliente]
CONTRATADA: BIG SOLUÇÕES

CLÁUSULAS:

1. OBJETO DO CONTRATO
A CONTRATADA desenvolverá peças gráficas/digitais conforme especificações, incluindo:
- Conceituação e criação
- Revisões conforme feedback
- Entrega de arquivos finais

2. PRAZO DE ENTREGA
O prazo de entrega é de [PRAZO] dias corridos a partir da aprovação do briefing.

3. VALOR E FORMAS DE PAGAMENTO
O valor total é de R$ [VALOR], parcelado em:
- 50% na aprovação do briefing
- 50% na entrega final

4. ENTREGÁVEIS
- Arquivos em formatos editáveis (AI, PSD, etc.)
- Versões para web e impressão
- Guia de uso da marca (se aplicável)

5. DIREITOS AUTORAIS
Os direitos autorais são transferidos ao CONTRATANTE após quitação integral dos pagamentos.

6. CONFIDENCIALIDADE
O CONTRATANTE garante confidencialidade das informações fornecidas para desenvolvimento do projeto.

Local, [DATA]

_________________________
CONTRATANTE

_________________________
BIG SOLUÇÕES`,
    isDefault: true,
    isBuiltIn: true
  }
];

// Built-in contract presets
const BUILTIN_PRESETS: Omit<ContractPreset, 'id' | 'createdAt'>[] = [
  {
    name: 'Padrão Vídeo Corporativo',
    description: 'Template ideal para vídeos institucionais e corporativos',
    serviceType: ServiceType.VIDEO,
    clauses: [
      {
        id: '1',
        title: 'Direitos de Imagem',
        content: 'Autorização expressa para uso de imagem de colaboradores e terceiros',
        isRequired: true,
        category: 'confidentiality'
      },
      {
        id: '2',
        title: 'Entrega de Materiais Brutos',
        content: 'Entrega dos materiais brutos (raw footage) mediante pagamento adicional',
        isRequired: false,
        category: 'delivery'
      }
    ],
    customizations: {
      paymentMethod: '50% na contratação, 50% na entrega',
      warrantyPeriod: '30 dias',
      revisionCount: 3,
      deliveryFormat: 'Digital (MP4, MOV)'
    },
    isDefault: true
  },
  {
    name: 'Padrão Fotografia Comercial',
    description: 'Template para ensaios fotográficos comerciais',
    serviceType: ServiceType.PHOTO,
    clauses: [
      {
        id: '1',
        title: 'Uso Comercial',
        content: 'Autorização para uso comercial das imagens em todos os canais',
        isRequired: true,
        category: 'delivery'
      },
      {
        id: '2',
        title: 'Exclusividade',
        content: 'Exclusividade de uso das imagens por período de 12 meses',
        isRequired: false,
        category: 'custom'
      }
    ],
    customizations: {
      paymentMethod: '50% na contratação, 50% na entrega',
      warrantyPeriod: '15 dias',
      revisionCount: 2,
      deliveryFormat: 'Digital (JPG, PNG) + Impressão'
    },
    isDefault: true
  }
];

export class EnhancedContractService {
  // Initialize built-in templates and presets
  static async initializeBuiltInContent(): Promise<void> {
    const existingTemplates = await blobService.get<ContractTemplate[]>(SYSTEM_USER_ID, 'contractTemplates') || [];
    const existingPresets = await blobService.get<ContractPreset[]>(SYSTEM_USER_ID, 'contractPresets') || [];

    // Add built-in templates if they don't exist
    const builtInTemplatesToAdd = BUILTIN_CONTRACT_TEMPLATES.filter(builtIn => 
      !existingTemplates.some(existing => 
        existing.isBuiltIn && existing.serviceType === builtIn.serviceType
      )
    );

    if (builtInTemplatesToAdd.length > 0) {
      const newTemplates = builtInTemplatesToAdd.map(template => ({
        ...template,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        usageCount: 0
      }));

      const allTemplates = [...existingTemplates, ...newTemplates];
      await blobService.set(SYSTEM_USER_ID, 'contractTemplates', allTemplates);
    }

    // Add built-in presets if they don't exist
    const builtInPresetsToAdd = BUILTIN_PRESETS.filter(builtIn => 
      !existingPresets.some(existing => 
        existing.name === builtIn.name && existing.serviceType === builtIn.serviceType
      )
    );

    if (builtInPresetsToAdd.length > 0) {
      const newPresets = builtInPresetsToAdd.map(preset => ({
        ...preset,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }));

      const allPresets = [...existingPresets, ...newPresets];
      await blobService.set(SYSTEM_USER_ID, 'contractPresets', allPresets);
    }
  }

  // Get all templates
  static async getTemplates(): Promise<ContractTemplate[]> {
    await this.initializeBuiltInContent();
    return await blobService.get<ContractTemplate[]>(SYSTEM_USER_ID, 'contractTemplates') || [];
  }

  // Get templates by service type
  static async getTemplatesByServiceType(serviceType: ServiceType): Promise<ContractTemplate[]> {
    const templates = await this.getTemplates();
    return templates.filter(template => template.serviceType === serviceType);
  }

  // Create custom template
  static async createTemplate(
    name: string,
    serviceType: ServiceType,
    content: string
  ): Promise<ContractTemplate> {
    const template: ContractTemplate = {
      id: uuidv4(),
      name,
      serviceType,
      content,
      isDefault: false,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    const templates = await this.getTemplates();
    const updatedTemplates = [template, ...templates];
    await blobService.set(SYSTEM_USER_ID, 'contractTemplates', updatedTemplates);

    return template;
  }

  // Update template
  static async updateTemplate(template: ContractTemplate): Promise<void> {
    const templates = await this.getTemplates();
    const updatedTemplates = templates.map(t => t.id === template.id ? template : t);
    await blobService.set(SYSTEM_USER_ID, 'contractTemplates', updatedTemplates);
  }

  // Delete template
  static async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const updatedTemplates = templates.filter(t => t.id !== id && !t.isBuiltIn);
    await blobService.set(SYSTEM_USER_ID, 'contractTemplates', updatedTemplates);
  }

  // Increment template usage count
  static async incrementTemplateUsage(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const updatedTemplates = templates.map(t => 
      t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    await blobService.set(SYSTEM_USER_ID, 'contractTemplates', updatedTemplates);
  }

  // Generate contract with enhanced options
  static async generateContract(
    client: Client,
    job: Job,
    options: ContractGenerationOptions
  ): Promise<string> {
    let content = options.template.content;

    // Replace placeholders
    content = content.replace(/\[Nome do Cliente\]/g, client.name);
    content = content.replace(/\[Nome da Empresa\]/g, client.company || '');
    content = content.replace(/\[Email\]/g, client.email);
    content = content.replace(/\[Telefone\]/g, client.phone || '');
    content = content.replace(/\[CPF\/CNPJ\]/g, client.cpf || '');
    content = content.replace(/\[Valor\]/g, `R$ ${job.value.toLocaleString('pt-BR')}`);
    content = content.replace(/\[Prazo\]/g, job.deadline ? new Date(job.deadline).toLocaleDateString('pt-BR') : 'A definir');
    content = content.replace(/\[Data\]/g, new Date().toLocaleDateString('pt-BR'));
    content = content.replace(/\[REVISÕES\]/g, options.customizations.includeSpecificClauses.length.toString() || '3');
    content = content.replace(/\[QUANTIDADE\]/g, '15'); // Default for photos

    // Add custom clauses if specified
    if (options.customizations.includeSpecificClauses.length > 0) {
      const customClausesSection = `
8. CLÁUSULAS ADICIONAIS
${options.customizations.includeSpecificClauses.map((clause, index) => 
  `${index + 1}. ${clause}`
).join('\n')}`;
      
      content = content.replace(/Local, \[DATA\]/, customClausesSection + '\n\nLocal, [DATA]');
    }

    // Increment usage count
    await this.incrementTemplateUsage(options.template.id);

    return content;
  }

  // Check if client is defaulter
  static async checkClientDefaulterStatus(clientId: string): Promise<boolean> {
    const jobs = await blobService.get<any[]>(SYSTEM_USER_ID, 'jobs') || [];
    const clientJobs = jobs.filter(job => job.clientId === clientId && !job.isDeleted);
    
    // Check if client has overdue payments
    const hasOverduePayments = clientJobs.some(job => {
      const totalPaid = job.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
      return totalPaid < job.value && new Date(job.deadline) < new Date();
    });

    return hasOverduePayments;
  }

  // Get defaulters list
  static async getDefaulters(): Promise<Array<{client: Client, overdueAmount: number}>> {
    const clients = await blobService.get<any[]>(SYSTEM_USER_ID, 'clients') || [];
    const jobs = await blobService.get<any[]>(SYSTEM_USER_ID, 'jobs') || [];
    
    const defaulters: Array<{client: Client, overdueAmount: number}> = [];
    
    for (const client of clients) {
      const clientJobs = jobs.filter(job => job.clientId === client.id && !job.isDeleted);
      let totalOverdue = 0;
      
      for (const job of clientJobs) {
        const totalPaid = job.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
        const overdue = job.value - totalPaid;
        
        if (overdue > 0 && new Date(job.deadline) < new Date()) {
          totalOverdue += overdue;
        }
      }
      
      if (totalOverdue > 0) {
        defaulters.push({ client, overdueAmount: totalOverdue });
      }
    }
    
    return defaulters;
  }

  // Preset management
  static async getPresets(): Promise<ContractPreset[]> {
    await this.initializeBuiltInContent();
    return await blobService.get<ContractPreset[]>(SYSTEM_USER_ID, 'contractPresets') || [];
  }

  static async createPreset(preset: Omit<ContractPreset, 'id' | 'createdAt'>): Promise<ContractPreset> {
    const newPreset: ContractPreset = {
      ...preset,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    const presets = await this.getPresets();
    const updatedPresets = [newPreset, ...presets];
    await blobService.set(SYSTEM_USER_ID, 'contractPresets', updatedPresets);

    return newPreset;
  }

  static async updatePreset(preset: ContractPreset): Promise<void> {
    const presets = await this.getPresets();
    const updatedPresets = presets.map(p => p.id === preset.id ? preset : p);
    await blobService.set(SYSTEM_USER_ID, 'contractPresets', updatedPresets);
  }

  static async deletePreset(id: string): Promise<void> {
    const presets = await this.getPresets();
    const updatedPresets = presets.filter(p => p.id !== id);
    await blobService.set(SYSTEM_USER_ID, 'contractPresets', updatedPresets);
  }

  static async setDefaultPreset(id: string): Promise<void> {
    const presets = await this.getPresets();
    const updatedPresets = presets.map(p => ({ ...p, isDefault: p.id === id }));
    await blobService.set(SYSTEM_USER_ID, 'contractPresets', updatedPresets);
  }
}
