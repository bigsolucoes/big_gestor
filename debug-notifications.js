// Script para diagnosticar problemas de notificações
// Execute no console do navegador

async function debugNotifications() {
    console.log('🔔 Diagnosticando sistema de notificações...');
    
    try {
        // 1. Verificar se hook está disponível
        console.log('🪝 1. Verificando hook de notificações...');
        const notificationsElement = document.querySelector('[data-notifications]');
        console.log('Elemento de notificações:', notificationsElement);
        
        // 2. Verificar localStorage
        console.log('💾 2. Verificando localStorage...');
        const readNotifications = localStorage.getItem('big_read_notifications');
        console.log('Notificações lidas:', readNotifications);
        
        // 3. Verificar dados dos jobs
        console.log('📊 3. Verificando dados dos jobs...');
        if (window.blobService && window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                const jobs = await window.blobService.get(user.id, 'jobs');
                const clients = await window.blobService.get(user.id, 'clients');
                
                console.log(`Jobs encontrados: ${jobs?.length || 0}`);
                console.log(`Clients encontrados: ${clients?.length || 0}`);
                
                // 4. Verificar deadlines
                if (jobs && jobs.length > 0) {
                    console.log('📅 4. Verificando deadlines...');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const oneDay = 1000 * 60 * 60 * 24;
                    
                    const overdueJobs = jobs.filter(job => {
                        if (job.isDeleted || job.status === 'PAID') return false;
                        
                        try {
                            const deadline = new Date(job.deadline);
                            deadline.setHours(0,0,0,0);
                            const diffTime = deadline.getTime() - today.getTime();
                            return diffTime < 0; // Atrasado
                        } catch (e) {
                            return false;
                        }
                    });
                    
                    console.log(`Jobs atrasados: ${overdueJobs.length}`);
                    overdueJobs.forEach(job => {
                        console.log(`  - ${job.name} (deadline: ${job.deadline})`);
                    });
                    
                    const upcomingJobs = jobs.filter(job => {
                        if (job.isDeleted || job.status === 'PAID') return false;
                        
                        try {
                            const deadline = new Date(job.deadline);
                            deadline.setHours(0,0,0,0);
                            const diffTime = deadline.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / oneDay);
                            return diffDays >= 0 && diffDays <= 2; // Próximos 2 dias
                        } catch (e) {
                            return false;
                        }
                    });
                    
                    console.log(`Jobs com prazo próximo: ${upcomingJobs.length}`);
                    upcomingJobs.forEach(job => {
                        console.log(`  - ${job.name} (deadline: ${job.deadline})`);
                    });
                }
                
                // 5. Verificar aniversários
                if (clients && clients.length > 0) {
                    console.log('🎂 5. Verificando aniversários...');
                    const today = new Date();
                    const birthdayClients = clients.filter(client => {
                        if (!client.birthday) return false;
                        
                        try {
                            const [bYear, bMonth, bDay] = client.birthday.split('-').map(Number);
                            return today.getDate() === bDay && today.getMonth() === (bMonth - 1);
                        } catch (e) {
                            return false;
                        }
                    });
                    
                    console.log(`Aniversariantes hoje: ${birthdayClients.length}`);
                    birthdayClients.forEach(client => {
                        console.log(`  - ${client.name} (${client.birthday})`);
                    });
                }
                
                // 6. Limpar localStorage de notificações lidas
                console.log('🧹 6. Limpando localStorage de notificações lidas...');
                localStorage.removeItem('big_read_notifications');
                console.log('✅ localStorage limpo');
                
                // 7. Forçar reload das notificações
                console.log('🔄 7. Forçando reload das notificações...');
                window.dispatchEvent(new Event('storage'));
                
                console.log('\n🎯 Diagnóstico concluído!');
                console.log('Tente clicar no sino de notificações novamente.');
                
            } else {
                console.log('❌ Usuário não autenticado');
            }
        } else {
            console.log('❌ Serviços não disponíveis');
        }
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
}

// Executar diagnóstico
debugNotifications();
