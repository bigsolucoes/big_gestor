// Script simplificado para desbloquear jobs do backup
// Execute este script no console do navegador após fazer login

async function unblockBackupJobsSimple() {
    try {
        console.log('🔓 Iniciando desbloqueio simplificado de jobs...');
        
        // Verificar se está no ambiente correto
        if (typeof window === 'undefined') {
            throw new Error('Ambiente de janela não encontrado. Execute no console do navegador.');
        }
        
        // Tentar diferentes maneiras de acessar os dados
        let currentUser = null;
        let jobsData = null;
        
        // Método 1: Verificar se tem React hooks disponíveis
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            console.log('🔍 React DevTools detectado, tentando extrair dados...');
        }
        
        // Método 2: Verificar se tem dados no localStorage
        try {
            const storedData = localStorage.getItem('big-gestor-data');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                console.log('📊 Dados encontrados no localStorage:', parsed);
                jobsData = parsed.jobs;
            }
        } catch (e) {
            console.log('ℹ️ Nenhum dado encontrado no localStorage');
        }
        
        // Método 3: Verificar se tem dados globais da aplicação
        if (window.appData) {
            console.log('📊 Dados encontrados em window.appData');
            jobsData = window.appData.jobs;
            currentUser = window.appData.currentUser;
        }
        
        // Método 4: Verificar se tem Supabase disponível
        if (window.supabase) {
            console.log('✅ Supabase encontrado, usando método principal...');
            
            const { data: { user }, error: authError } = await window.supabase.auth.getUser();
            if (authError) {
                console.error('Erro de autenticação:', authError);
                throw new Error(`Erro de autenticação: ${authError.message}`);
            }
            
            if (!user) {
                throw new Error('Usuário não está logado. Faça login primeiro.');
            }
            
            currentUser = user;
            console.log(`✅ Usuário logado: ${user.email}`);
            console.log(`🆔 User ID: ${user.id}`);
            
            // Tentar usar blobService
            if (window.blobService) {
                jobsData = await window.blobService.get(user.id, 'jobs');
                console.log('📊 Jobs carregados do blobService');
            }
        }
        
        // Método 5: Último recurso - pedir dados manualmente
        if (!jobsData || jobsData.length === 0) {
            console.log('⚠️ Nenhum dado encontrado automaticamente.');
            console.log('🔧 Tentando método alternativo...');
            
            // Verificar se estamos na página de jobs e extrair do DOM
            const jobElements = document.querySelectorAll('[data-job-id]');
            if (jobElements.length > 0) {
                console.log(`📊 Encontrados ${jobElements.length} jobs no DOM`);
                
                // Tentar extrair dados dos elementos React
                jobsData = [];
                jobElements.forEach((element, index) => {
                    const jobId = element.getAttribute('data-job-id');
                    if (jobId) {
                        jobsData.push({
                            id: jobId,
                            name: `Job ${index + 1}`,
                            ownerId: null,
                            ownerUsername: null,
                            isDeleted: false,
                            isTeamJob: false
                        });
                    }
                });
            }
        }
        
        if (!currentUser) {
            throw new Error('Não foi possível identificar o usuário atual. Tente fazer login novamente.');
        }
        
        if (!jobsData || jobsData.length === 0) {
            console.log('ℹ️ Nenhum job encontrado para processar.');
            alert('Nenhum job encontrado para desbloquear.\n\nTente:\n1. Fazer login novamente\n2. Ir para a página de Jobs\n3. Recarregar a página');
            return;
        }

        console.log(`📊 Encontrados ${jobsData.length} jobs para processar...`);
        console.log(`👤 Usuário atual: ${currentUser.email || currentUser.username}`);

        // Filtrar jobs que precisam ser corrigidos
        const jobsToFix = jobsData.filter(job => {
            try {
                // Jobs que não pertencem ao usuário atual por ID ou username
                const hasCorrectOwner = (
                    job.ownerId === currentUser.id || 
                    job.ownerUsername === (currentUser.username || currentUser.email) ||
                    job.isTeamJob === true
                );
                
                // Jobs que não estão deletados
                const isActive = !job.isDeleted;
                
                const needsFix = isActive && !hasCorrectOwner;
                
                if (needsFix) {
                    console.log(`🔍 Job que precisa de correção: ${job.name}`, {
                        jobId: job.id,
                        ownerId: job.ownerId,
                        ownerUsername: job.ownerUsername,
                        isTeamJob: job.isTeamJob,
                        isDeleted: job.isDeleted
                    });
                }
                
                return needsFix;
            } catch (error) {
                console.error(`Erro ao processar job:`, job, error);
                return false;
            }
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
                console.log(`   Antes: ownerId=${job.ownerId}, ownerUsername=${job.ownerUsername}`);
                
                return {
                    ...job,
                    ownerId: currentUser.id,
                    ownerUsername: currentUser.username || currentUser.email,
                    isTeamJob: false
                };
            }
            
            return job;
        });

        // Tentar salvar os dados
        let saved = false;
        
        if (window.blobService) {
            console.log('💾 Salvando via blobService...');
            await window.blobService.set(currentUser.id, 'jobs', updatedJobs);
            saved = true;
        } else if (window.appData) {
            console.log('💾 Salvando via appData...');
            window.appData.jobs = updatedJobs;
            saved = true;
        } else {
            console.log('💾 Salvando no localStorage...');
            const existingData = JSON.parse(localStorage.getItem('big-gestor-data') || '{}');
            existingData.jobs = updatedJobs;
            localStorage.setItem('big-gestor-data', JSON.stringify(existingData));
            saved = true;
        }
        
        if (saved) {
            console.log('✅ Jobs desbloqueados com sucesso!');
        } else {
            throw new Error('Não foi possível salvar os dados. Tente recarregar a página e executar novamente.');
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

        console.log('📈 Estatísticas da correção:', stats);

        // Mostrar mensagem de sucesso
        alert(`🎉 Desbloqueio concluído!\n\n` +
              `📊 Resumo:\n` +
              `• ${stats.totalJobs} jobs totais\n` +
              `• ${stats.jobsFixed} jobs corrigidos\n` +
              `• ${stats.fixedJobs} jobs agora pertencem a você\n\n` +
              `Recarregue a página para ver as mudanças!`);

        return stats;

    } catch (error) {
        console.error('❌ Erro no desbloqueio:', error);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = error.message;
        
        // Mensagens mais amigáveis
        if (error.message.includes('Supabase não encontrado')) {
            errorMessage = 'Tente executar este script na página de Jobs após fazer login.';
        } else if (error.message.includes('Usuário não está logado')) {
            errorMessage = 'Faça login no BIG Gestor antes de executar este script.';
        } else if (error.message.includes('Não foi possível salvar')) {
            errorMessage = 'Recarregue a página e tente novamente.';
        }
        
        alert(`❌ Erro no desbloqueio: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar função automaticamente
console.log('🚀 Script de desbloqueio simplificado carregado. Executando...');
unblockBackupJobsSimple();
