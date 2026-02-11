// Script para atualizar status de todos os jobs do luizmellol para "Briefing"
// Execute este script no console do navegador após fazer login

async function updateLuizmellolJobsToBriefing() {
    try {
        console.log('🔄 Iniciando atualização de jobs do luizmellol...');
        
        // Verificar se o usuário está logado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Você precisa estar logado!');
        }

        console.log(`✅ Usuário logado: ${user.email}`);

        // Carregar todos os jobs
        const { data: jobsData, error: jobsError } = await blobService.get(user.id, 'jobs');
        if (jobsError) {
            throw new Error('Erro ao carregar jobs: ' + jobsError.message);
        }

        if (!jobsData || jobsData.length === 0) {
            console.log('ℹ️ Nenhum job encontrado para atualizar.');
            alert('Nenhum job encontrado para atualizar.');
            return;
        }

        console.log(`📊 Encontrados ${jobsData.length} jobs para processar...`);

        // Filtrar apenas jobs do luizmellol e que não estão deletados
        const luizmellolJobs = jobsData.filter(job => 
            job.ownerUsername === 'luizmellol' && 
            !job.isDeleted &&
            job.status !== 'Briefing'  // Apenas os que não são Briefing ainda
        );

        console.log(`🎯 ${luizmellolJobs.length} jobs do luizmellol serão atualizados...`);

        if (luizmellolJobs.length === 0) {
            console.log('ℹ️ Nenhum job do luizmellol precisa ser atualizado.');
            alert('Nenhum job do luizmellol precisa ser atualizado (todos já são Briefing ou estão deletados).');
            return;
        }

        // Atualizar status para "Briefing"
        const updatedJobs = jobsData.map(job => {
            if (job.ownerUsername === 'luizmellol' && !job.isDeleted) {
                console.log(`📝 Atualizando job: ${job.name} - Status: ${job.status} → Briefing`);
                return {
                    ...job,
                    status: 'Briefing'
                };
            }
            return job;
        });

        // Salvar os jobs atualizados
        await blobService.set(user.id, 'jobs', updatedJobs);
        console.log('✅ Jobs atualizados com sucesso!');

        // Estatísticas
        const stats = {
            totalJobs: jobsData.length,
            luizmellolJobs: luizmellolJobs.length,
            updatedJobs: updatedJobs.filter(job => job.status === 'Briefing' && job.ownerUsername === 'luizmellol').length
        };

        console.log('📈 Estatísticas da atualização:', stats);

        // Mostrar mensagem de sucesso
        alert(`🎉 Atualização concluída!\n\n` +
              `📊 Resumo:\n` +
              `• ${stats.totalJobs} jobs totais\n` +
              `• ${stats.luizmellolJobs} jobs do luizmellol atualizados\n` +
              `• ${stats.updatedJobs} jobs agora com status "Briefing"\n\n` +
              `Recarregue a página para ver as mudanças!`);

        return stats;

    } catch (error) {
        console.error('❌ Erro na atualização:', error);
        alert(`❌ Erro na atualização: ${error.message}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar função automaticamente
console.log('🚀 Script de atualização carregado. Executando...');
updateLuizmellolJobsToBriefing();
