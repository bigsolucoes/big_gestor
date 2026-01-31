
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Schema, Type } from "@google/genai";
import { Job, Client, ProposalContent } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getJobPaymentSummary } from '../utils/jobCalculations';

// The API key is read from the environment variable with the correct prefix.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI Assistant will not work. Please set it in your environment variables.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL_NAME = 'gemini-1.5-flash';

// Simple rate limiter to avoid quota exceeded
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

interface AppContextData {
  jobs: Job[];
  clients: Client[];
}

// --- Tool Definitions ---

const createClientTool: FunctionDeclaration = {
  name: 'create_client',
  description: 'Cria um novo cliente no sistema. Use quando o usuário pedir para cadastrar, adicionar ou criar um cliente.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome completo do cliente.' },
      email: { type: Type.STRING, description: 'Email do cliente.' },
      phone: { type: Type.STRING, description: 'Telefone do cliente (opcional).' },
      company: { type: Type.STRING, description: 'Nome da empresa (opcional).' }
    },
    required: ['name', 'email']
  }
};

const createJobTool: FunctionDeclaration = {
  name: 'create_job',
  description: 'Cria um novo job/projeto. Requer um cliente existente. Se o cliente não existir, peça para criar o cliente primeiro.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome ou título do job.' },
      clientName: { type: Type.STRING, description: 'Nome do cliente associado (o sistema tentará encontrar o ID).' },
      value: { type: Type.NUMBER, description: 'Valor total do job em Reais (apenas números).' },
      deadline: { type: Type.STRING, description: 'Prazo de entrega no formato YYYY-MM-DD. Se o usuário disser "próxima sexta", calcule a data.' },
      serviceType: { type: Type.STRING, description: 'Tipo de serviço (Vídeo, Fotografia, Design, Sites, etc).' }
    },
    required: ['name', 'clientName', 'deadline']
  }
};

const createContractTool: FunctionDeclaration = {
  name: 'create_contract',
  description: 'Cria um novo contrato. Busca o cliente pelo nome.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Título do contrato (ex: Contrato Social Media).' },
      clientName: { type: Type.STRING, description: 'Nome do cliente associado.' },
      content: { type: Type.STRING, description: 'O texto/cláusulas do contrato.' },
    },
    required: ['title', 'clientName', 'content']
  }
};

const updateJobStatusTool: FunctionDeclaration = {
  name: 'update_job_status',
  description: 'Atualiza o status de um job existente.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      jobName: { type: Type.STRING, description: 'Nome do job (aproximado).' },
      newStatus: { type: Type.STRING, description: 'Novo status (Briefing, Produção, Revisão, Finalizado, Pago, Outros).' }
    },
    required: ['jobName', 'newStatus']
  }
};

const createScriptTool: FunctionDeclaration = {
  name: 'create_script',
  description: 'Cria um roteiro estruturado e salva nos rascunhos. Gere cenas detalhadas.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Título do roteiro.' },
      scenes: {
        type: Type.ARRAY,
        description: 'Lista de cenas do roteiro.',
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.STRING, description: 'Número ou título da cena (ex: "Cena 1 - Int.").' },
            description: { type: Type.STRING, description: 'Descrição visual, falas ou ação.' },
            duration: { type: Type.NUMBER, description: 'Duração estimada em segundos.' }
          },
          required: ['scene', 'description']
        }
      }
    },
    required: ['title', 'scenes']
  }
};

export const appTools = [createClientTool, createJobTool, createContractTool, updateJobStatusTool, createScriptTool];

// AI should always see real values, regardless of UI privacy mode
const formatDataForPrompt = (data: AppContextData): string => {
  let contextString = "Dados do Sistema:\n";
  contextString += "--- Jobs ---\n";
  if (data.jobs.length > 0) {
    data.jobs.forEach(job => {
      const clientName = data.clients.find(c => c.id === job.clientId)?.name || 'Desconhecido';
      const { totalPaid, remaining } = getJobPaymentSummary(job);
      const jobValueFormatted = formatCurrency(job.value, false);
      
      contextString += `ID: ${job.id}, Nome: ${job.name}, Cliente: ${clientName}, Valor: ${jobValueFormatted}, Prazo: ${new Date(job.deadline).toLocaleDateString('pt-BR')}, Status: ${job.status}, Tipo: ${job.serviceType}\n`;
    });
  } else {
    contextString += "Nenhum job cadastrado.\n";
  }
  
  contextString += "\n--- Clientes ---\n";
  if (data.clients.length > 0) {
    data.clients.forEach(client => {
      contextString += `ID: ${client.id}, Nome: ${client.name}, Empresa: ${client.company || 'N/A'}, Email: ${client.email}\n`;
    });
  } else {
    contextString += "Nenhum cliente cadastrado.\n";
  }

  contextString += "---\n";
  return contextString;
};

export const callGeminiApi = async (
  userQuery: string, 
  appContextData: AppContextData
): Promise<GenerateContentResponse> => {
  if (!ai) {
    const mockResponse: GenerateContentResponse = {
      text: "Desculpe, o assistente de IA não está configurado corretamente (API Key ausente).",
      candidates: [],
    } as unknown as GenerateContentResponse;
    return Promise.resolve(mockResponse); 
  }

  const dataContext = formatDataForPrompt(appContextData);

  const systemInstruction = `Você é um assistente de IA chamado "Gestor IA" para o sistema BIG.
  Sua função é ajudar o usuário a gerenciar jobs, clientes, contratos e criar roteiros criativos.
  
  Você tem permissão para realizar ações reais no sistema usando as ferramentas disponíveis (Function Calling).
  
  REGRAS:
  1. Se o usuário pedir para criar algo (cliente, job, contrato, roteiro), USE A FERRAMENTA apropriada. Não apenas diga que vai fazer.
  2. Seja conciso e direto.
  3. Responda em Português do Brasil.
  4. Para datas, hoje é ${new Date().toLocaleDateString('pt-BR')} (${new Date().toISOString().split('T')[0]}).
  5. Se precisar de mais informações para executar uma ação (ex: falta o email do cliente), pergunte ao usuário.
  6. Para roteiros: Seja criativo, detalhista nas descrições visuais e sugira durações realistas.
  `;

  const prompt = `${dataContext}\nSolicitação do Usuário: ${userQuery}`;
  
  try {
    // Wait for rate limit before making request
    await waitForRateLimit();
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: appTools }],
      }
    });
    
    return response;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    let errorMessage = "Ocorreu um erro ao contatar o assistente de IA.";
    if (error instanceof Error) {
        errorMessage += ` Detalhes: ${error.message}`;
    }
     const mockErrorResponse: GenerateContentResponse = {
        text: errorMessage,
        candidates: [],
      } as unknown as GenerateContentResponse;
     return Promise.resolve(mockErrorResponse);
  }
};

/**
 * Specifically generates a contract draft based on Job and Client data.
 */
export const generateProposalContent = async (job: Job, client: Client): Promise<ProposalContent> => {
    if (!ai) throw new Error("Não foi possível gerar a proposta. Verifique a configuração da API.");

    const prompt = `
Você é um especialista em propostas comerciais para freelancers e pequenas empresas. Crie uma proposta profissional baseada no site bigprodutora.com/proposta/ com as seguintes informações:

CONTEXTO DO CLIENTE:
- Nome: ${client.name}
- Empresa: ${client.company || 'Não informado'}
- Email: ${client.email}
- Telefone: ${client.phone || 'Não informado'}

DETALHES DO PROJETO:
- Tipo de Serviço: ${job.serviceType}
- Descrição: ${job.notes || 'Serviço profissional de ' + job.serviceType}
- Valor: R$ ${job.value.toLocaleString('pt-BR')}
- Prazo: ${new Date(job.deadline).toLocaleDateString('pt-BR')}
- Data de Gravação: ${job.recordingDate ? new Date(job.recordingDate).toLocaleDateString('pt-BR') : 'A definir'}

REGRAS:
1. Baseie-se na estrutura do site bigprodutora.com/proposta/ (6 etapas)
2. Adapte o conteúdo para o tipo de serviço: ${job.serviceType}
3. Seja profissional mas acessível
4. Inclua condições de pagamento claras
5. Adapte as etapas conforme o serviço

ESTRUTURA OBRIGATÓRIA (6 etapas):
1. Fechamento - Pagamento, contrato, briefing
2. Alinhamento - Esclarecimento de dúvidas, roteiro
3. Produção - Pesquisa, criação, edição
4. Apresentação - Envio para aprovação
5. Alterações - Revisões gratuitas (limitadas)
6. Entrega Final - Entrega em alta qualidade

RETORNE APENAS JSON válido:
{
  "steps": [
    {
      "id": "1",
      "number": 1,
      "title": "Fechamento",
      "description": "Descrição detalhada...",
      "duration": "X dias",
      "deliverables": ["item1", "item2"]
    }
  ],
  "clientInfo": {
    "name": "${client.name}",
    "company": "${client.company || ''}",
    "email": "${client.email}",
    "phone": "${client.phone || ''}"
  },
  "companyInfo": {
    "name": "BIG SOLUÇÕES",
    "email": "sac@msolucoescriativas.com",
    "phone": "(46) 98404-4021",
    "instagram": "@bigsolucoes"
  },
  "terms": {
    "paymentMethod": "50% na contratação, 50% na entrega",
    "revisions": 3,
    "warranty": "30 dias",
    "deliveryFormat": "Digital em nuvem"
  }
}
`;

    try {
        await waitForRateLimit();
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        
        const text = response.text || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Não foi possível parsear o JSON da proposta");
        }
    } catch (error) {
        console.error("Error generating proposal", error);
        throw new Error("Erro ao gerar proposta via IA.");
    }
};

export const generateContractContent = async (job: Job, client: Client): Promise<string> => {
    if (!ai) return "Erro: API Key não configurada.";

    const prompt = `
    Aja como um advogado especializado e crie uma minuta de contrato de prestação de serviços.
    
    DADOS DO CLIENTE:
    Nome: ${client.name}
    Empresa: ${client.company || 'N/A'}
    CPF/CNPJ: ${client.cpf || '__________________'}
    Email: ${client.email}
    
    DADOS DO SERVIÇO:
    Tipo: ${job.serviceType}
    Descrição: ${job.notes || 'Serviços profissionais de ' + job.serviceType}
    Valor: R$ ${job.value.toLocaleString('pt-BR')}
    Prazo: ${new Date(job.deadline).toLocaleDateString('pt-BR')}
    
    INSTRUÇÕES:
    - Crie um contrato formal e completo.
    - Inclua cláusulas de objeto, preço, forma de pagamento, prazo, obrigações das partes e rescisão.
    - Adapte as cláusulas especificamente para o tipo de serviço "${job.serviceType}". Por exemplo, se for "Vídeo", mencione direitos de uso de imagem e revisões. Se for "Design", mencione entrega de arquivos abertos ou fechados.
    - Use marcadores [Preencher] onde faltarem dados essenciais (como endereço).
    - Não use markdown excessivo (como negrito em tudo), formate para ser colado em um editor de texto simples.
    `;

    try {
        // Wait for rate limit before making request
        await waitForRateLimit();
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "Não foi possível gerar o contrato.";
    } catch (error) {
        console.error("Error generating contract", error);
        return "Erro ao gerar contrato via IA.";
    }
};
