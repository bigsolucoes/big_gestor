// Script completo de migração do backup antigo para o novo sistema
// Execute este script no console do navegador após fazer login como luizmellol

async function migrateAllData() {
    try {
        console.log('🚀 Iniciando migração completa dos dados...');
        
        // Dados completos do backup
        const backupData = {
            "version": "2.5-contracts-owned",
            "exportedAt": "2026-01-31T06:20:23.864Z",
            "data": {
                "jobs": [
                    {
                        "name": "Drone KODE",
                        "clientId": "16fa5935-5da2-419b-8eee-711bb0ced8f3",
                        "serviceType": "Vídeo",
                        "value": 0,
                        "deadline": "2025-09-20T23:59:59.000Z",
                        "recordingDate": "2025-09-19T13:00:00.000Z",
                        "status": "Revisão",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "9fc68c7c-9b34-4680-ae75-5475fdecb5f7",
                        "createdAt": "2025-09-19T00:53:20.322Z",
                        "isDeleted": true,
                        "observationsLog": [],
                        "payments": [],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Gravações Audição Harmonica",
                        "clientId": "36082783-769c-44ee-92b6-eba15a70b08c",
                        "serviceType": "Vídeo",
                        "value": 800,
                        "deadline": "2025-10-03T23:59:59.000Z",
                        "recordingDate": "2025-09-30T23:00:00.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "notes": "GRAVAR DIA 30  -  1   -   2",
                        "createCalendarEvent": true,
                        "isRecurring": false,
                        "isTeamJob": true,
                        "id": "a96c9742-d7e2-4126-af7c-0b538d8ee3a4",
                        "createdAt": "2025-09-19T20:36:42.842Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [
                            {
                                "id": "0b8a6377-a0e6-4687-8b6d-23fd5b762c00",
                                "amount": 240,
                                "date": "2025-09-19T12:00:00.000Z",
                                "method": "PIX CPF"
                            },
                            {
                                "id": "559f28e2-afa7-495e-9659-a36992bf1ee5",
                                "amount": 710,
                                "date": "2025-10-23T12:00:00.000Z"
                            }
                        ],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Fotos Aniver ZAZEN",
                        "clientId": "8eb6a100-9b6a-4789-9649-e40af9c6874a",
                        "serviceType": "Fotografia",
                        "value": 250,
                        "deadline": "2025-09-20T23:59:59.000Z",
                        "recordingDate": "2025-09-19T23:00:00.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "createCalendarEvent": true,
                        "isRecurring": false,
                        "isTeamJob": true,
                        "id": "b9c7cc65-2d88-478a-a279-4b9ed0b27956",
                        "createdAt": "2025-09-19T20:45:19.711Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [
                            {
                                "id": "7a1188c5-ccbd-4ba9-9399-f1d2f9ae88f1",
                                "amount": 250,
                                "date": "2025-09-16T12:00:00.000Z",
                                "method": "PIX CPF"
                            }
                        ],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Fotos FACES",
                        "clientId": "8eb6a100-9b6a-4789-9649-e40af9c6874a",
                        "serviceType": "Vídeo",
                        "value": 250,
                        "deadline": "2025-09-22T23:59:59.000Z",
                        "recordingDate": "2025-09-17T12:00:00.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "7e60ca0b-371e-416a-9be5-feac04282fc1",
                        "createdAt": "2025-09-19T20:48:47.035Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [
                            {
                                "id": "498bbe68-d8bb-4078-88ee-d3c03c12f6af",
                                "amount": 300,
                                "date": "2025-09-11T12:00:00.000Z"
                            }
                        ],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Set B2B HellFex e Madline",
                        "clientId": "19d88a84-0b11-440b-9483-8db525d2d360",
                        "serviceType": "Set",
                        "value": 800,
                        "deadline": "2025-10-01T23:59:59.000Z",
                        "status": "Finalizado",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "45108e62-dcb6-4cdc-abfb-ade60844dc0b",
                        "createdAt": "2025-09-19T21:57:08.089Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Cobertura Festival\"Harmonica\"",
                        "clientId": "36082783-769c-44ee-92b6-eba15a70b08c",
                        "serviceType": "Set",
                        "value": 800,
                        "deadline": "2025-10-03T23:59:59.000Z",
                        "recordingDate": "2025-09-30T23:00:00.000Z",
                        "status": "Briefing",
                        "cloudLinks": [],
                        "notes": "3 dias. varias cameras e 1 movel.",
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "d0c68983-a5a8-424c-8f48-ffc14399a060",
                        "createdAt": "2025-09-19T21:58:38.732Z",
                        "isDeleted": true,
                        "observationsLog": [],
                        "payments": [],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Fotos formandos e VT Estacio ",
                        "clientId": "688382e8-ad03-4ee0-bce0-f12b52b57b67",
                        "serviceType": "Fotografia",
                        "value": 300,
                        "deadline": "2025-09-29T23:59:59.000Z",
                        "recordingDate": "2025-09-09T16:00:00.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "ed699ad9-5ce3-48f8-b63f-79da20c45c3a",
                        "createdAt": "2025-09-19T21:59:55.446Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [
                            {
                                "id": "360c1f08-8c1f-445a-85c5-b1b3b2ef72af",
                                "amount": 300,
                                "date": "2025-10-16T12:00:00.000Z"
                            }
                        ],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Frelas Foto Du",
                        "clientId": "36082783-769c-44ee-92b6-eba15a70b08c",
                        "serviceType": "Vídeo",
                        "value": 100,
                        "deadline": "2025-09-06T23:59:59.000Z",
                        "recordingDate": "2025-09-08T00:00:00.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "35f2fb57-2616-48fc-9115-30eee2277705",
                        "createdAt": "2025-09-19T22:01:06.612Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [
                            {
                                "id": "dfdf028f-64c7-4abb-9d6c-442671885d81",
                                "amount": 100,
                                "date": "2025-09-19T12:00:00.000Z"
                            }
                        ],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Casamento Jackson & ",
                        "clientId": "9e2cea7c-a7b7-45d7-b3fc-920e6c7cfa7b",
                        "serviceType": "Vídeo",
                        "value": 1500,
                        "deadline": "2024-01-01T23:59:59.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "f53fe233-c10e-4789-8cb2-283f21944afe",
                        "createdAt": "2025-09-19T22:02:57.503Z",
                        "isDeleted": false,
                        "observationsLog": [
                            {
                                "id": "199df35c-4b5e-4d07-ab19-150e013aa2eb",
                                "text": "FALTA EDICAO DE VIDEO COMPLETO, VT JA FOI ENTREGUE",
                                "timestamp": "2025-09-19T22:03:26.977Z"
                            }
                        ],
                        "payments": [],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Diaria Fronter",
                        "clientId": "10ab0338-5257-495d-b883-e95c2aa83822",
                        "serviceType": "Vídeo",
                        "value": 300,
                        "deadline": "2025-09-30T23:59:59.000Z",
                        "recordingDate": "2025-09-22T00:00:00.000Z",
                        "status": "Pago",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "c6a5b8f0-1e2d-4a3b-9c8d-7e6f5a4b3c2d",
                        "createdAt": "2025-09-19T22:04:45.123Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [
                            {
                                "id": "abc12345-def6-7890-ghij-klmnopqrstuv",
                                "amount": 300,
                                "date": "2025-09-22T12:00:00.000Z"
                            }
                        ],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    },
                    {
                        "name": "Set Madline",
                        "clientId": "71487c90-d3ae-4350-9f08-8fc0808eaf3b",
                        "serviceType": "Set",
                        "value": 800,
                        "cost": 100,
                        "deadline": "2025-11-21T23:59:59.000Z",
                        "recordingDate": "2025-11-08T08:51:00.000Z",
                        "status": "Briefing",
                        "cloudLinks": [],
                        "createCalendarEvent": false,
                        "isRecurring": false,
                        "isTeamJob": false,
                        "id": "69cee510-aef4-46ef-bd40-03d27c00ee95",
                        "createdAt": "2025-11-07T23:52:01.105Z",
                        "isDeleted": false,
                        "observationsLog": [],
                        "payments": [],
                        "tasks": [],
                        "linkedDraftIds": [],
                        "ownerId": "8aa49b52-d216-47bd-a02e-9f7dae5aa6db",
                        "ownerUsername": "luizmellol"
                    }
                ],
                "clients": [
                    {
                        "name": "Adelar Henrique",
                        "email": "TEST@asa.com",
                        "id": "71487c90-d3ae-4350-9f08-8fc0808eaf3b",
                        "createdAt": "2025-09-19T22:07:47.124Z"
                    },
                    {
                        "name": "Alessandro (HellFex)",
                        "email": "TEST@asa.com",
                        "id": "19d88a84-0b11-440b-9483-8db525d2d360",
                        "createdAt": "2025-09-19T21:50:21.446Z"
                    },
                    {
                        "name": "Anderson Santos",
                        "email": "upfilmescuritiba@gmail.com",
                        "id": "511a0f97-2908-494d-bf73-e5fb4bb1e6e9",
                        "createdAt": "2025-09-30T02:30:23.290Z"
                    },
                    {
                        "name": "Andiara ",
                        "email": "TEST@asa.com",
                        "observations": "Amiga Karina",
                        "id": "bbd6e614-7b89-4700-8048-df11b95e074e",
                        "createdAt": "2025-09-19T21:48:01.578Z"
                    },
                    {
                        "name": "Chris Andrew",
                        "email": "TEST@asa.com",
                        "id": "2ac933e1-1a98-4fb1-b3c9-3c8c88e657a2",
                        "createdAt": "2025-09-19T22:11:37.373Z"
                    },
                    {
                        "name": "Dandara Zanelatto",
                        "email": "TEST@asa.com",
                        "id": "0e22da05-6654-4c43-b68e-17426f48e742",
                        "createdAt": "2025-09-19T21:51:47.399Z"
                    },
                    {
                        "name": "Dariva Fogos",
                        "email": "test@test.com",
                        "id": "e98c379a-8272-4006-8c30-775ae5b8e07d",
                        "createdAt": "2025-11-05T01:04:10.847Z"
                    },
                    {
                        "name": "Dj Bruno França",
                        "email": "TEST@asa.com",
                        "id": "82951c67-1c46-4c44-9673-bc34be916800",
                        "createdAt": "2025-09-20T10:38:18.280Z"
                    },
                    {
                        "name": "Dj Zique",
                        "email": "test@test.com",
                        "id": "d24d911a-94c7-40f5-b789-9b348b77fd06",
                        "createdAt": "2025-11-07T23:46:47.902Z"
                    },
                    {
                        "name": "Du Mazetto (DOOMA)",
                        "email": "TEST@asa.com",
                        "id": "f1a3da57-61b5-4da9-910e-e319a03fecd8",
                        "createdAt": "2025-09-19T21:49:52.081Z"
                    },
                    {
                        "name": "Eduardo Zanetti",
                        "email": "TEST@asa.com",
                        "id": "36082783-769c-44ee-92b6-eba15a70b08c",
                        "createdAt": "2025-09-19T20:34:21.260Z"
                    },
                    {
                        "name": "Estacio",
                        "email": "TEST@asa.com",
                        "id": "688382e8-ad03-4ee0-bce0-f12b52b57b67",
                        "createdAt": "2025-09-19T21:58:51.985Z"
                    },
                    {
                        "name": "Fronter",
                        "email": "test@test.com",
                        "id": "10ab0338-5257-495d-b883-e95c2aa83822",
                        "createdAt": "2025-09-19T22:04:20.147Z"
                    },
                    {
                        "name": "Jackson & ",
                        "email": "TEST@asa.com",
                        "id": "9e2cea7c-a7b7-45d7-b3fc-920e6c7cfa7b",
                        "createdAt": "2025-09-19T22:02:35.678Z"
                    },
                    {
                        "name": "Karina Zanelatto",
                        "email": "TEST@asa.com",
                        "id": "16fa5935-5da2-419b-8eee-711bb0ced8f3",
                        "createdAt": "2025-09-19T00:53:00.123Z"
                    },
                    {
                        "name": "ZAZEN",
                        "email": "TEST@asa.com",
                        "id": "8eb6a100-9b6a-4789-9649-e40af9c6874a",
                        "createdAt": "2025-09-19T20:45:00.456Z"
                    }
                ]
            }
        };

        // Verificar se o usuário está logado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Você precisa estar logado! Faça login como luizmellol.');
        }

        console.log(`✅ Usuário logado: ${user.email}`);

        // Normalizar os dados para o novo formato
        const normalizedJobs = backupData.data.jobs.map(job => ({
            ...job,
            // Garantir campos obrigatórios que podem faltar
            cloudLinks: job.cloudLinks || [],
            cost: job.cost || 0,
            isRecurring: job.isRecurring || false,
            createCalendarEvent: job.createCalendarEvent || false,
            isTeamJob: job.isTeamJob || false,
            customServiceType: job.customServiceType || undefined,
            financialTasks: job.financialTasks || [],
            linkedContractId: job.linkedContractId || undefined,
            // Atualizar ownerId para o usuário atual
            ownerId: user.id,
            ownerUsername: user.user_metadata?.username || 'luizmellol'
        }));

        const normalizedClients = backupData.data.clients.map(client => ({
            ...client,
            // Garantir campos obrigatórios
            cpf: client.cpf || '',
            observations: client.observations || ''
        }));

        console.log(`📊 Normalizando ${normalizedJobs.length} jobs e ${normalizedClients.length} clientes...`);

        // Importar para o Supabase usando o blobService
        console.log('💾 Salvando dados no Supabase...');
        
        // Importar clientes primeiro
        await blobService.set(user.id, 'clients', normalizedClients);
        console.log('✅ Clientes importados com sucesso!');

        // Importar jobs
        await blobService.set(user.id, 'jobs', normalizedJobs);
        console.log('✅ Jobs importados com sucesso!');

        // Estatísticas da migração
        const stats = {
            totalJobs: normalizedJobs.length,
            activeJobs: normalizedJobs.filter(job => !job.isDeleted).length,
            deletedJobs: normalizedJobs.filter(job => job.isDeleted).length,
            paidJobs: normalizedJobs.filter(job => job.status === 'Pago').length,
            totalClients: normalizedClients.length,
            totalValue: normalizedJobs.reduce((sum, job) => sum + (job.value || 0), 0),
            totalPaid: normalizedJobs.reduce((sum, job) => 
                sum + (job.payments || []).reduce((pSum, payment) => pSum + (payment.amount || 0), 0), 0
            )
        };

        console.log('📈 Estatísticas da migração:', stats);

        // Mostrar mensagem de sucesso
        alert(`🎉 Migração concluída com sucesso!\n\n` +
              `📊 Resumo:\n` +
              `• ${stats.totalJobs} jobs importados\n` +
              `• ${stats.activeJobs} jobs ativos\n` +
              `• ${stats.paidJobs} jobs pagos\n` +
              `• ${stats.totalClients} clientes\n` +
              `• ${formatCurrency(stats.totalValue)} valor total\n` +
              `• ${formatCurrency(stats.totalPaid)} já pago\n\n` +
              `Recarregue a página para ver os dados!`);

        return stats;

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        alert(`❌ Erro na migração: ${error.message}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Função auxiliar para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Executar migração automaticamente
console.log('🚀 Script de migração carregado. Execute migrateAllData() para iniciar.');
migrateAllData();
