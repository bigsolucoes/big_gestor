// Script para importar dados do backup antigo
// Execute este script no console do navegador após fazer login

async function importBackup() {
    try {
        // Carregar o arquivo de backup
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
                    }
                    // ... adicione mais jobs conforme necessário
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
                    }
                    // ... adicione mais clientes conforme necessário
                ]
            }
        };

        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Você precisa estar logado!');
            return;
        }

        // Importar clientes
        console.log('Importando clientes...');
        await supabase
            .from('user_data')
            .upsert({
                user_id: user.id,
                data_key: 'clients',
                data: backupData.data.clients
            });

        // Importar jobs
        console.log('Importando jobs...');
        await supabase
            .from('user_data')
            .upsert({
                user_id: user.id,
                data_key: 'jobs',
                data: backupData.data.jobs
            });

        console.log('Importação concluída com sucesso!');
        alert('Dados importados com sucesso! Recarregue a página para ver os dados.');

    } catch (error) {
        console.error('Erro na importação:', error);
        alert('Erro ao importar dados. Verifique o console para detalhes.');
    }
}

// Executar a função
importBackup();
