
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Schema, Type } from "@google/genai";
import { Job, Client } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getJobPaymentSummary } from '../utils/jobCalculations';

// The API key is read from the environment variable with the correct prefix.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI Assistant will not work. Please set it in your environment variables.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL_NAME = 'gemini-2.5-flash';

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
export const generateContractContent = async (job: Job, client: Client): Promise<string> => {
    if (!ai) return "Erro: API Key não configurada.";

    const prompt = `
    Aja como um advogado especializado e crie uma minuta de contrato de prestação de serviços.
    
    DADOS DO CLIENTE:
    Nome: ${client.name}
    Empresa: ${client.company || 'N/A'}
    CPF/CNPJ: ${client.cpf || '__________________'}
    Email: ${client.email}
    
    DADOS DO PROJETO (JOB):
    Título: ${job.name}
    Tipo de Serviço: ${job.serviceType}
    Valor Total: ${formatCurrency(job.value, false)}
    Prazo de Entrega: ${new Date(job.deadline).toLocaleDateString('pt-BR')}
    Detalhes/Observações: ${job.notes || 'N/A'}
    
    INSTRUÇÕES:
    - Crie um contrato formal e completo.
    - Inclua cláusulas de objeto, preço, forma de pagamento, prazo, obrigações das partes e rescisão.
    - Adapte as cláusulas especificamente para o tipo de serviço "${job.serviceType}". Por exemplo, se for "Vídeo", mencione direitos de uso de imagem e revisões. Se for "Design", mencione entrega de arquivos abertos ou fechados.
    - Use marcadores [Preencher] onde faltarem dados essenciais (como endereço).
    - Não use markdown excessivo (como negrito em tudo), formate para ser colado em um editor de texto simples.
    `;

    try {
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
