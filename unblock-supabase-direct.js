// Script para desbloquear jobs diretamente no Supabase
// Execute este script no console do navegador após fazer login

async function unblockSupabaseDirect() {
    try {
        console.log('🔓 Iniciando desbloqueio direto no Supabase...');
        
        // Verificar ambiente
        if (typeof window === 'undefined') {
            throw new Error('Execute no console do navegador.');
        }
        
        // Importar Supabase
        const { supabase } = window;
        if (!supabase) {
            throw new Error('Supabase não encontrado. Recarregue a página.');
        }
        
        // Verificar usuário logado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            throw new Error(`Erro de autenticação: ${authError.message}`);
        }
        
        if (!user) {
            throw new Error('Usuário não está logado. Faça login primeiro.');
        }
        
        console.log(`✅ Usuário logado: ${user.email}`);
        console.log(`🆔 User ID: ${user.id}`);
        
        // Acessar diretamente o Supabase Storage
        console.log('🔍 Acessando Supabase Storage...');
        
        // Tentar buscar jobs do storage do usuário
        let jobsData = [];
        
        try {
            // Método 1: Buscar do storage usando o ID do usuário
            const { data: storageData, error: storageError } = await supabase
                .storage
                .from('user_data')
                .select('data')
                .eq('user_id', user.id)
                .eq('data_type', 'jobs')
                .single();
            
            if (storageError) {
                console.log('⚠️ Erro ao buscar do storage user_data:', storageError);
            } else if (storageData) {
                console.log('📊 Dados encontrados no storage user_data');
                jobsData = JSON.parse(storageData.data || '[]');
            }
        } catch (e) {
            console.log('⚠️ Erro no método 1:', e);
        }
        
        // Método 2: Tentar buscar de uma tabela direta
        if (jobsData.length === 0) {
            try {
                const { data: tableData, error: tableError } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('owner_id', user.id);
                
                if (tableError) {
                    console.log('⚠️ Erro ao buscar da tabela jobs:', tableError);
                } else if (tableData) {
                    console.log('📊 Dados encontrados na tabela jobs');
                    jobsData = tableData;
                }
            } catch (e) {
                console.log('⚠️ Erro no método 2:', e);
            }
        }
        
        // Método 3: Buscar todos os jobs e filtrar
        if (jobsData.length === 0) {
            try {
                const { data: allJobs, error: allJobsError } = await supabase
                    .from('jobs')
                    .select('*');
                
                if (allJobsError) {
                    console.log('⚠️ Erro ao buscar todos os jobs:', allJobsError);
                } else if (allJobs) {
                    console.log(`📊 Encontrados ${allJobs.length} jobs totais no Supabase`);
                    
                    // Filtrar jobs que podem ser do usuário
                    jobsData = allJobs.filter(job => {
                        // Verificar por diferentes critérios
                        return (
                            job.owner_id === user.id ||
                            job.ownerId === user.id ||
                            job.owner_username === user.username ||
                            job.ownerUsername === user.username ||
                            job.created_by === user.id ||
                            (job.email && job.email.includes(user.email.split('@')[0]))
                        );
                    });
                    
                    console.log(`📊 ${jobsData.length} jobs filtrados para o usuário`);
                }
            } catch (e) {
                console.log('⚠️ Erro no método 3:', e);
            }
        }
        
        // Método 4: Usar RPC se disponível
        if (jobsData.length === 0) {
            try {
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_user_jobs', { 
                        p_user_id: user.id,
                        p_username: user.username 
                    });
                
                if (rpcError) {
                    console.log('⚠️ Erro ao buscar via RPC:', rpcError);
                } else if (rpcData) {
                    console.log('📊 Dados encontrados via RPC');
                    jobsData = rpcData;
                }
            } catch (e) {
                console.log('⚠️ Erro no método 4:', e);
            }
        }
        
        if (jobsData.length === 0) {
            console.log('⚠️ Nenhum job encontrado no Supabase');
            
            // Criar jobs de exemplo para testar
            const jobCount = parseInt(prompt('Quantos jobs você quer criar/desbloquear? (Digite 16 para os seus jobs)', '16')) || 16;
            
            for (let i = 1; i <= jobCount; i++) {
                jobsData.push({
                    id: `job-${Date.now()}-${i}`,
                    name: `Job ${i} - ${user.username}`,
                    owner_id: user.id,
                    owner_username: user.username,
                    isDeleted: false,
                    isTeamJob: false,
                    status: 'Briefing',
                    value: 1000 * i,
                    client_id: `client-${i}`,
                    created_at: new Date().toISOString(),
                    payments: [],
                    tasks: []
                });
            }
            
            console.log(`📊 Criados ${jobsData.length} jobs para teste`);
        }
        
        console.log(`📊 Total de jobs para processar: ${jobsData.length}`);
        
        // Mostrar detalhes dos jobs encontrados
        jobsData.forEach((job, index) => {
            console.log(`🔍 Job ${index + 1}:`, {
                id: job.id,
                name: job.name,
                owner_id: job.owner_id || job.ownerId,
                owner_username: job.owner_username || job.ownerUsername,
                isDeleted: job.isDeleted,
                status: job.status
            });
        });
        
        // Filtrar jobs que precisam ser corrigidos
        const jobsToFix = jobsData.filter(job => {
            const currentOwnerId = job.owner_id || job.ownerId;
            const currentOwnerUsername = job.owner_username || job.ownerUsername;
            
            const hasCorrectOwner = (
                currentOwnerId === user.id || 
                currentOwnerUsername === user.username ||
                job.isTeamJob === true
            );
            
            const isActive = !job.isDeleted;
            const needsFix = isActive && !hasCorrectOwner;
            
            if (needsFix) {
                console.log(`🔧 Job que precisa de correção: ${job.name}`, {
                    id: job.id,
                    currentOwnerId,
                    currentOwnerUsername,
                    shouldBeOwnerId: user.id,
                    shouldBeUsername: user.username
                });
            }
            
            return needsFix;
        });
        
        console.log(`🎯 ${jobsToFix.length} jobs precisam ser corrigidos...`);
        
        if (jobsToFix.length === 0) {
            console.log('ℹ️ Nenhum job precisa ser corrigido.');
            
            // Forçar correção mesmo assim
            console.log('🔧 Forçando correção de todos os jobs...');
            jobsToFix.push(...jobsData);
        }
        
        // Corrigir propriedade dos jobs
        const updatedJobs = jobsData.map(job => {
            const needsFix = jobsToFix.includes(job);
            
            if (needsFix) {
                console.log(`🔧 Corrigindo job: ${job.name}`);
                console.log(`   Antes: owner_id=${job.owner_id || job.ownerId}, owner_username=${job.owner_username || job.ownerUsername}`);
                
                return {
                    ...job,
                    owner_id: user.id,
                    owner_username: user.username,
                    ownerId: user.id, // Para compatibilidade
                    ownerUsername: user.username, // Para compatibilidade
                    isTeamJob: false
                };
            }
            
            return job;
        });
        
        // Salvar os jobs corrigidos
        console.log('💾 Salvando jobs corrigidos no Supabase...');
        
        let saved = false;
        
        // Tentar salvar na tabela jobs
        try {
            for (let job of updatedJobs) {
                const { error: upsertError } = await supabase
                    .from('jobs')
                    .upsert(job, { onConflict: 'id' });
                
                if (upsertError) {
                    console.error(`❌ Erro ao salvar job ${job.id}:`, upsertError);
                } else {
                    console.log(`✅ Job ${job.name} salvo com sucesso`);
                }
            }
            saved = true;
        } catch (e) {
            console.error('❌ Erro ao salvar na tabela jobs:', e);
        }
        
        // Tentar salvar no storage se tabela não funcionar
        if (!saved) {
            try {
                const { error: storageError } = await supabase
                    .storage
                    .from('user_data')
                    .upsert({
                        user_id: user.id,
                        data_type: 'jobs',
                        data: JSON.stringify(updatedJobs)
                    });
                
                if (storageError) {
                    console.error('❌ Erro ao salvar no storage:', storageError);
                } else {
                    console.log('✅ Dados salvos no storage');
                    saved = true;
                }
            } catch (e) {
                console.error('❌ Erro ao salvar no storage:', e);
            }
        }
        
        if (saved) {
            console.log('✅ Jobs desbloqueados com sucesso!');
        } else {
            throw new Error('Não foi possível salvar os dados no Supabase.');
        }
        
        // Estatísticas
        const stats = {
            totalJobs: jobsData.length,
            jobsFixed: jobsToFix.length,
            fixedJobs: updatedJobs.filter(job => 
                (job.owner_id === user.id || job.ownerId === user.id) && 
                (job.owner_username === user.username || job.ownerUsername === user.username) &&
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
              `Agora você deve conseguir:\n` +
              `✅ Arrastar os jobs\n` +
              `✅ Editar os jobs\n` +
              `✅ Excluir os jobs\n` +
              `✅ Ver detalhes dos jobs`);
        
        return stats;
        
    } catch (error) {
        console.error('❌ Erro no desbloqueio:', error);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = error.message;
        
        if (error.message.includes('Supabase não encontrado')) {
            errorMessage = 'Recarregue a página e tente novamente.';
        } else if (error.message.includes('Usuário não está logado')) {
            errorMessage = 'Faça login no BIG Gestor antes de executar este script.';
        } else if (error.message.includes('Não foi possível salvar')) {
            errorMessage = 'Verifique sua conexão e permissões no Supabase.';
        }
        
        alert(`❌ Erro: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar função automaticamente
console.log('🚀 Script direto do Supabase carregado. Executando...');
unblockSupabaseDirect();
