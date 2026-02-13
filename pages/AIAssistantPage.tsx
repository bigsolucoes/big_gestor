
import React, { useState, useRef, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { AIChatMessage as AIChatMessageType, GroundingChunk, ServiceType, JobStatus, ScriptLine } from '../types';
import AIChatMessageComponent from '../components/AIChatMessage';
import { SparklesIcon, BotIcon, CheckCircleIcon } from '../constants';
import { callGeminiApi } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from '../components/LoadingSpinner';
import { SendHorizonal, Lightbulb, TrendingUp, HeartHandshake } from 'lucide-react'; // Added icons
import toast from 'react-hot-toast';

const AIAssistantPage: React.FC = () => {
  const { jobs, clients, addJob, addClient, addContract, updateJob, addDraftNote, updateDraftNote, loading: appDataLoading } = useAppData();
  const [messages, setMessages] = useState<AIChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Em manutenção - desabilitado temporariamente
  const isUnderMaintenance = true;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if(messages.length === 0){
        setMessages([
            {
                id: uuidv4(),
                text: isUnderMaintenance 
                    ? "🔧 **Gestor AI em Manutenção**\n\nO assistente está temporariamente desabilitado para manutenção.\n\nEstamos trabalhando para melhorar o serviço.\n\nTente novamente em algumas horas.\n\nAgradecemos sua compreensão! 🙏"
                    : "Olá! Sou seu Gestor IA. Posso criar jobs, cadastrar clientes, redigir contratos e gerar roteiros para seus vídeos. Como posso ajudar?",
                sender: 'ai',
                timestamp: new Date().toISOString()
            }
        ]);
    }
  }, [messages.length, isUnderMaintenance]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    
    if (!textToSend.trim() || isLoading) return;

    // Bloquear envio durante manutenção
    if (isUnderMaintenance) {
      toast.error("Gestor AI em manutenção. Tente novamente mais tarde.");
      return;
    }

    const userMessageText = textToSend;
    const userMessage: AIChatMessageType = {
      id: uuidv4(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextData = { jobs, clients };
      
      const aiResponse = await callGeminiApi(userMessageText, contextData);
      const candidates = aiResponse.candidates;
      
      if (candidates && candidates.length > 0) {
          const candidate = candidates[0];
          
          // 1. Handle Function Calls
          const parts = candidate.content.parts;
          let functionCallExecuted = false;
          let executionResultText = "";

          for (const part of parts) {
              if (part.functionCall) {
                  const fc = part.functionCall;
                  console.log("Gemini requested function:", fc.name, fc.args);
                  
                  try {
                      if (fc.name === 'create_client') {
                          const args = fc.args as any;
                          addClient({
                              name: args.name,
                              email: args.email,
                              phone: args.phone,
                              company: args.company,
                              observations: "Criado via IA"
                          });
                          executionResultText = `✅ Cliente **${args.name}** cadastrado com sucesso!`;
                          functionCallExecuted = true;
                          toast.success(`Cliente ${args.name} criado!`);
                      }
                      
                      else if (fc.name === 'create_job') {
                          const args = fc.args as any;
                          // Find client ID via Fuzzy match roughly
                          const clientMatch = clients.find(c => 
                              c.name.toLowerCase().includes(args.clientName.toLowerCase()) || 
                              (c.company && c.company.toLowerCase().includes(args.clientName.toLowerCase()))
                          );

                          if (clientMatch) {
                              addJob({
                                  name: args.name,
                                  clientId: clientMatch.id,
                                  value: Number(args.value) || 0,
                                  deadline: args.deadline,
                                  serviceType: (args.serviceType as ServiceType) || ServiceType.OTHER,
                                  status: 'Briefing' as any
                              });
                              executionResultText = `✅ Job **${args.name}** criado para o cliente **${clientMatch.name}**!`;
                              functionCallExecuted = true;
                              toast.success(`Job ${args.name} criado!`);
                          } else {
                              executionResultText = `❌ Não consegui encontrar o cliente "${args.clientName}". Por favor, cadastre o cliente primeiro.`;
                              functionCallExecuted = true; 
                          }
                      }

                      else if (fc.name === 'create_contract') {
                         const args = fc.args as any;
                         const clientMatch = clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
                         
                         if(clientMatch) {
                             addContract({
                                 title: args.title,
                                 clientId: clientMatch.id,
                                 content: args.content,
                                 isSigned: false
                             });
                             executionResultText = `✅ Contrato **${args.title}** criado para **${clientMatch.name}**.`;
                             functionCallExecuted = true;
                             toast.success('Contrato criado!');
                         } else {
                             executionResultText = `❌ Cliente "${args.clientName}" não encontrado para criar o contrato.`;
                             functionCallExecuted = true;
                         }
                      }

                      else if (fc.name === 'update_job_status') {
                          const args = fc.args as any;
                          const jobMatch = jobs.find(j => j.name.toLowerCase().includes(args.jobName.toLowerCase()));
                          
                          if (jobMatch) {
                              updateJob({ ...jobMatch, status: args.newStatus as JobStatus });
                              executionResultText = `✅ Status do job **${jobMatch.name}** atualizado para **${args.newStatus}**.`;
                              functionCallExecuted = true;
                              toast.success('Status atualizado!');
                          } else {
                              executionResultText = `❌ Job "${args.jobName}" não encontrado.`;
                              functionCallExecuted = true;
                          }
                      }

                      else if (fc.name === 'create_script') {
                        const args = fc.args as any;
                        // 1. Create the basic draft note
                        const newDraft = addDraftNote({
                          title: args.title,
                          type: 'SCRIPT'
                        });

                        // 2. Format scenes for ScriptLine type
                        const scriptLines: ScriptLine[] = (args.scenes || []).map((scene: any) => ({
                          id: uuidv4(),
                          scene: scene.scene || 'Cena',
                          description: scene.description || '',
                          duration: Number(scene.duration) || 0
                        }));

                        // 3. Update the draft with lines
                        updateDraftNote({
                          ...newDraft,
                          scriptLines: scriptLines,
                          content: `Roteiro gerado via IA: ${args.title}`
                        });

                        executionResultText = `✅ Roteiro **${args.title}** criado com ${scriptLines.length} cenas! Você pode vê-lo na aba Rascunhos.`;
                        functionCallExecuted = true;
                        toast.success('Roteiro gerado!');
                      }

                  } catch (err) {
                      console.error("Error executing function", err);
                      executionResultText = "❌ Tive um problema técnico ao tentar executar essa ação no sistema.";
                      functionCallExecuted = true;
                  }
              }
          }

          // 2. Handle Text Response
          let responseText = aiResponse.text || "";
          
          // If a function was executed, append the result to the response (or replace if empty)
          if (functionCallExecuted) {
              responseText = responseText ? `${responseText}\n\n${executionResultText}` : executionResultText;
          }

          // 3. Handle Grounding (Search Results)
          const groundingMetadata = candidate.groundingMetadata;
          if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
            responseText += "\n\nFontes:\n";
            groundingMetadata.groundingChunks.forEach((chunk: GroundingChunk, index: number) => {
              const sourceUri = chunk.web?.uri || chunk.retrievedContext?.uri;
              const sourceTitle = chunk.web?.title || chunk.retrievedContext?.title || sourceUri;
              if (sourceUri) {
                responseText += `${index + 1}. [${sourceTitle}](${sourceUri})\n`;
              }
            });
          }

          if (responseText) {
              const aiMessage: AIChatMessageType = {
                id: uuidv4(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date().toISOString(),
              };
              setMessages(prev => [...prev, aiMessage]);
          }
      }

    } catch (error) {
      console.error("Error calling AI API:", error);
      const errorMessage: AIChatMessageType = {
        id: uuidv4(),
        text: "Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQuestions = [
    "Crie um roteiro de 30s para Reels sobre Café",
    "Crie um cliente 'Tech Soluções', email contato@tech.com",
    "Quanto eu faturei este mês?",
    "Quais jobs estão atrasados?",
  ];

  const handleExampleQuestionClick = (question: string) => {
    setInput(question);
  };
  
  const guruActions = [
      { 
          icon: TrendingUp, 
          label: "Dicas de Lucro", 
          prompt: "Analise meus jobs, serviços mais vendidos e ticket médio. Me dê 3 dicas práticas e não óbvias para aumentar meu lucro nos próximos 30 dias baseadas no meu histórico." 
      },
      { 
          icon: Lightbulb, 
          label: "Ideias de Negócios", 
          prompt: "Com base no tipo de clientes que eu atendo e os serviços que presto, sugira 2 novos produtos ou serviços complementares que eu poderia oferecer para aumentar minha receita recorrente." 
      },
      { 
          icon: HeartHandshake, 
          label: "Relacionamento", 
          prompt: "Olhe para meus clientes. Como posso melhorar meu relacionamento com eles? Sugira uma ação de pós-venda ou fidelização que eu possa aplicar hoje para os clientes que não compram há algum tempo." 
      }
  ];


  if (appDataLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-full bg-card-bg shadow-xl rounded-xl overflow-hidden border border-border-color">
      {/* Banner de Manutenção */}
      {isUnderMaintenance && (
        <div className="bg-yellow-100 border-b-2 border-yellow-500 text-yellow-800 p-4 text-center">
          <div className="flex items-center justify-center">
            <SparklesIcon size={20} className="mr-2 animate-pulse" />
            <span className="font-semibold">🔧 Gestor AI em Manutenção</span>
          </div>
          <p className="text-sm mt-2">
            O assistente está temporariamente desabilitado para melhorias. 
            Estamos trabalhando para otimizar o serviço e trazer uma experiência ainda melhor.
          </p>
          <p className="text-xs mt-1 text-yellow-600">
            Tente novamente em algumas horas. Agradecemos sua compreensão! 🙏
          </p>
        </div>
      )}
      <header className="p-4 border-b border-border-color bg-subtle-bg flex justify-between items-center">
        <h1 className="text-xl font-semibold text-text-primary flex items-center">
          <SparklesIcon size={22} className="text-accent" /> <span className="ml-2">Gestor IA</span>
        </h1>
        <div className="flex gap-2">
            {guruActions.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, action.prompt)}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-full transition-colors border border-purple-200"
                    title={action.label}
                >
                    <action.icon size={14} /> <span className="hidden sm:inline">{action.label}</span>
                </button>
            ))}
        </div>
      </header>

      <div className="flex-grow p-4 overflow-y-auto space-y-4 no-scrollbar">
        {messages.map(msg => (
          <AIChatMessageComponent key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
        {isLoading && (
            <div className="flex justify-start mb-4">
                <div className="bg-slate-200 text-text-primary p-3 rounded-lg shadow rounded-tl-none flex items-center">
                    <BotIcon size={18} className="mr-2 animate-bounce"/>
                    <span className="text-sm">Pensando e executando...</span>
                </div>
            </div>
        )}
      </div>

      <div className="p-2 border-t border-border-color bg-subtle-bg">
         <div className="mb-2 px-2 flex flex-wrap gap-2">
            {exampleQuestions.map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleExampleQuestionClick(q)}
                className="text-xs bg-highlight-bg hover:bg-hover-bg text-text-secondary px-2 py-1 rounded-full transition-colors border border-border-color"
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center space-x-2 p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isUnderMaintenance ? "Em manutenção..." : "Ex: Crie um roteiro..."}
            className="flex-grow p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow bg-card-bg"
            disabled={isLoading || isUnderMaintenance}
          />
          <button
            type="submit"
            className="bg-accent text-white p-3 rounded-lg shadow hover:bg-opacity-90 transition-colors disabled:opacity-50"
            disabled={isLoading || !input.trim() || isUnderMaintenance}
          >
            <SendHorizonal size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantPage;
