// Script para desbloquear jobs do backup que estão com propriedade incorreta
// Execute este script no console do navegador após fazer login

async function unblockBackupJobs() {
    try {
        console.log('🔓 Iniciando desbloqueio de jobs do backup...');
        
        // Importar Supabase do contexto global da aplicação
        const { supabase } = window;
        if (!supabase) {
            throw new Error('Supabase não encontrado. Certifique-se de estar na página da aplicação.');
        }
        
        // Verificar se o usuário está logado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Você precisa estar logado!');
        }

        console.log(`✅ Usuário logado: ${user.email}`);

        // Importar blobService do contexto global
        const { blobService } = window;
        if (!blobService) {
            throw new Error('blobService não encontrado. Certifique-se de estar na página da aplicação.');
        }

        // Carregar todos os jobs
        const jobsData = await blobService.get(user.id, 'jobs');

        if (!jobsData || jobsData.length === 0) {
            console.log('ℹ️ Nenhum job encontrado para desbloquear.');
            alert('Nenhum job encontrado para desbloquear.');
            return;
        }

        console.log(`📊 Encontrados ${jobsData.length} jobs para processar...`);

        // Filtrar jobs que precisam ser corrigidos
        const jobsToFix = jobsData.filter(job => {
            // Jobs que não pertencem ao usuário atual por ID ou username
            const hasCorrectOwner = (
                job.ownerId === user.id || 
                job.ownerUsername === user.username ||
                job.isTeamJob === true
            );
            
            // Jobs que não estão deletados
            const isActive = !job.isDeleted;
            
            return isActive && !hasCorrectOwner;
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
                    ownerId: user.id,
                    ownerUsername: user.username,
                    isTeamJob: false
                };
            }
            
            return job;
        });

        // Salvar os jobs corrigidos
        await blobService.set(user.id, 'jobs', updatedJobs);
        console.log('✅ Jobs desbloqueados com sucesso!');

        // Estatísticas
        const stats = {
            totalJobs: jobsData.length,
            jobsFixed: jobsToFix.length,
            fixedJobs: updatedJobs.filter(job => 
                job.ownerId === user.id && 
                job.ownerUsername === user.username &&
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
        alert(`❌ Erro no desbloqueio: ${error.message}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar função automaticamente
console.log('🚀 Script de desbloqueio carregado. Executando...');
unblockBackupJobs();
