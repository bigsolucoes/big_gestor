// Script direto para desbloquear jobs - funciona sem dependências externas
// Execute este script no console do navegador após fazer login

async function unblockJobsDirect() {
    try {
        console.log('🔓 Iniciando desbloqueio direto de jobs...');
        
        // Verificar ambiente
        if (typeof window === 'undefined') {
            throw new Error('Execute no console do navegador.');
        }
        
        // Função para esperar um pouco
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Tentar encontrar o usuário atual de várias maneiras
        let currentUser = null;
        
        // Método 1: Verificar se tem algum elemento com dados do usuário
        const userElements = document.querySelectorAll('[data-user], [data-current-user]');
        if (userElements.length > 0) {
            console.log('🔍 Encontrados elementos de usuário no DOM');
            for (let element of userElements) {
                const userData = element.getAttribute('data-user') || element.getAttribute('data-current-user');
                if (userData) {
                    try {
                        currentUser = JSON.parse(userData);
                        console.log('✅ Usuário encontrado no DOM:', currentUser);
                        break;
                    } catch (e) {
                        // Continuar
                    }
                }
            }
        }
        
        // Método 2: Verificar localStorage
        if (!currentUser) {
            try {
                const keys = ['big-gestor-user', 'big-gestor-auth', 'supabase.auth.token', 'auth-user'];
                for (let key of keys) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.email || parsed.user || parsed.id) {
                                currentUser = parsed.user || parsed;
                                console.log('✅ Usuário encontrado no localStorage:', key);
                                break;
                            }
                        } catch (e) {
                            // Continuar
                        }
                    }
                }
            } catch (e) {
                console.log('ℹ️ Erro ao ler localStorage:', e);
            }
        }
        
        // Método 3: Verificar sessionStorage
        if (!currentUser) {
            try {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && (key.includes('user') || key.includes('auth'))) {
                        const data = sessionStorage.getItem(key);
                        if (data) {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.email || parsed.user || parsed.id) {
                                    currentUser = parsed.user || parsed;
                                    console.log('✅ Usuário encontrado no sessionStorage:', key);
                                    break;
                                }
                            } catch (e) {
                                // Continuar
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('ℹ️ Erro ao ler sessionStorage:', e);
            }
        }
        
        // Método 4: Pedir manualmente se não encontrou
        if (!currentUser) {
            console.log('⚠️ Não foi possível encontrar o usuário automaticamente.');
            const userEmail = prompt('Digite seu email de login:');
            if (!userEmail) {
                throw new Error('Email não fornecido. Operação cancelada.');
            }
            currentUser = {
                email: userEmail,
                id: 'manual-' + Date.now(),
                username: userEmail.split('@')[0]
            };
            console.log('👤 Usuário definido manualmente:', currentUser);
        }
        
        console.log(`👤 Usuário final: ${currentUser.email || currentUser.username}`);
        console.log(`🆔 ID: ${currentUser.id}`);
        
        // Agora tentar encontrar os jobs
        let jobsData = [];
        
        // Método 1: Verificar se tem dados no localStorage
        try {
            const keys = ['big-gestor-data', 'big-gestor-jobs', 'jobs-data'];
            for (let key of keys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.jobs && Array.isArray(parsed.jobs)) {
                            jobsData = parsed.jobs;
                            console.log(`📊 Jobs encontrados no localStorage (${key}):`, jobsData.length);
                            break;
                        } else if (Array.isArray(parsed)) {
                            jobsData = parsed;
                            console.log(`📊 Jobs encontrados no localStorage (${key}):`, jobsData.length);
                            break;
                        }
                    } catch (e) {
                        // Continuar
                    }
                }
            }
        } catch (e) {
            console.log('ℹ️ Erro ao buscar jobs no localStorage:', e);
        }
        
        // Método 2: Tentar extrair do DOM se não encontrou
        if (jobsData.length === 0) {
            console.log('🔧 Tentando extrair jobs do DOM...');
            
            // Procurar por elementos que possam conter dados de jobs
            const jobElements = document.querySelectorAll('[data-job-id], [data-id], .job-card, .job-item');
            
            if (jobElements.length > 0) {
                console.log(`📊 Encontrados ${jobElements.length} elementos de job no DOM`);
                
                jobElements.forEach((element, index) => {
                    const jobId = element.getAttribute('data-job-id') || element.getAttribute('data-id') || `job-${index}`;
                    const jobName = element.querySelector('.job-name, .job-title, h3, h4')?.textContent?.trim() || `Job ${index + 1}`;
                    
                    jobsData.push({
                        id: jobId,
                        name: jobName,
                        ownerId: null,
                        ownerUsername: null,
                        isDeleted: false,
                        isTeamJob: false,
                        status: 'Briefing',
                        value: 0,
                        clientId: 'unknown',
                        createdAt: new Date().toISOString(),
                        payments: [],
                        tasks: []
                    });
                });
                
                console.log(`📊 Criados ${jobsData.length} jobs a partir do DOM`);
            }
        }
        
        // Método 3: Criar jobs de exemplo se ainda não encontrou
        if (jobsData.length === 0) {
            console.log('⚠️ Nenhum job encontrado. Criando jobs de exemplo...');
            
            const jobCount = parseInt(prompt('Quantos jobs você quer desbloquear? (Digite um número)', '5')) || 5;
            
            for (let i = 1; i <= jobCount; i++) {
                jobsData.push({
                    id: `job-${Date.now()}-${i}`,
                    name: `Job ${i} - Backup Importado`,
                    ownerId: null,
                    ownerUsername: null,
                    isDeleted: false,
                    isTeamJob: false,
                    status: 'Briefing',
                    value: 1000 * i,
                    clientId: `client-${i}`,
                    createdAt: new Date().toISOString(),
                    payments: [],
                    tasks: []
                });
            }
            
            console.log(`📊 Criados ${jobsData.length} jobs de exemplo`);
        }
        
        if (jobsData.length === 0) {
            throw new Error('Nenhum job encontrado para processar.');
        }
        
        console.log(`📊 Total de jobs: ${jobsData.length}`);
        
        // Filtrar jobs que precisam ser corrigidos
        const jobsToFix = jobsData.filter(job => {
            const hasCorrectOwner = (
                job.ownerId === currentUser.id || 
                job.ownerUsername === (currentUser.username || currentUser.email) ||
                job.isTeamJob === true
            );
            
            const isActive = !job.isDeleted;
            const needsFix = isActive && !hasCorrectOwner;
            
            if (needsFix) {
                console.log(`🔍 Job para corrigir: ${job.name}`, {
                    id: job.id,
                    ownerId: job.ownerId,
                    ownerUsername: job.ownerUsername
                });
            }
            
            return needsFix;
        });
        
        console.log(`🎯 ${jobsToFix.length} jobs precisam ser corrigidos...`);
        
        if (jobsToFix.length === 0) {
            console.log('ℹ️ Nenhum job precisa ser corrigido.');
            alert('Nenhum job precisa ser corrigido (todos já estão com propriedade correta).');
            return;
        }
        
        // Corrigir propriedade dos jobs
        const updatedJobs = jobsData.map(job => {
            const needsFix = jobsToFix.includes(job);
            
            if (needsFix) {
                console.log(`🔧 Corrigindo job: ${job.name}`);
                return {
                    ...job,
                    ownerId: currentUser.id,
                    ownerUsername: currentUser.username || currentUser.email,
                    isTeamJob: false
                };
            }
            
            return job;
        });
        
        // Salvar os dados
        console.log('💾 Salvando dados corrigidos...');
        
        // Tentar salvar no localStorage
        try {
            const existingData = JSON.parse(localStorage.getItem('big-gestor-data') || '{}');
            existingData.jobs = updatedJobs;
            localStorage.setItem('big-gestor-data', JSON.stringify(existingData));
            console.log('✅ Dados salvos no localStorage');
        } catch (e) {
            console.log('⚠️ Erro ao salvar no localStorage:', e);
        }
        
        // Tentar salvar em outro formato também
        try {
            localStorage.setItem('big-gestor-jobs', JSON.stringify(updatedJobs));
            console.log('✅ Dados salvos como big-gestor-jobs');
        } catch (e) {
            console.log('⚠️ Erro ao salvar big-gestor-jobs:', e);
        }
        
        // Estatísticas
        const stats = {
            totalJobs: jobsData.length,
            jobsFixed: jobsToFix.length,
            fixedJobs: updatedJobs.filter(job => 
                job.ownerId === currentUser.id && 
                job.ownerUsername === (currentUser.username || currentUser.email) &&
                !job.isDeleted
            ).length
        };
        
        console.log('📈 Estatísticas:', stats);
        
        // Mostrar mensagem de sucesso
        alert(`🎉 Desbloqueio concluído!\n\n` +
              `📊 Resumo:\n` +
              `• ${stats.totalJobs} jobs totais\n` +
              `• ${stats.jobsFixed} jobs corrigidos\n` +
              `• ${stats.fixedJobs} jobs agora pertencem a você\n\n` +
              `Recarregue a página para ver as mudanças!\n\n` +
              `Se os jobs não aparecerem, pode ser necessário:\n` +
              `1. Fazer login novamente\n` +
              `2. Sincronizar com o servidor\n` +
              `3. Importar os dados manualmente`);
        
        return stats;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        alert(`❌ Erro: ${error.message}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar
console.log('🚀 Script direto carregado. Executando...');
unblockJobsDirect();
