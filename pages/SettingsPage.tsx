
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { APP_NAME, SettingsIcon as PageIcon, LinkIcon, DownloadIcon, UploadIcon, UsersIcon, XIcon, ImageUpIcon, ImageOffIcon, LockIcon, KeyIcon, CopyIcon, PlusCircleIcon, CheckCircleIcon, TrashIcon } from '../constants'; 
import LoadingSpinner from '../components/LoadingSpinner'; 
import { User, License, BugReport } from '../types';
import { isPersistenceEnabled } from '../services/blobStorageService';
import { ShieldCheck, Bug, Check } from 'lucide-react';
import * as blobService from '../services/blobStorageService';

const LicenseManager: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
    const SYSTEM_USER_ID = 'system_data';

    const loadLicenses = async () => {
        setIsLoadingLicenses(true);
        const data = await blobService.get<License[]>(SYSTEM_USER_ID, 'licenses');
        setLicenses(data || []);
        setIsLoadingLicenses(false);
    };

    useEffect(() => {
        loadLicenses();
    }, []);

    const generateLicense = async () => {
        const randomString = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
                             Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                             Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const newLicense: License = {
            key: `BIG-${randomString}`,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.username
        };

        const updatedLicenses = [newLicense, ...licenses];
        await blobService.set(SYSTEM_USER_ID, 'licenses', updatedLicenses);
        setLicenses(updatedLicenses);
        toast.success("Nova licença gerada!");
    };

    const revokeLicense = async (key: string) => {
        if (!window.confirm("Tem certeza que deseja revogar esta licença? Se ela já estiver em uso, o usuário perderá o acesso imediatamente.")) return;

        const updatedLicenses = licenses.map(l => l.key === key ? { ...l, status: 'revoked' as const } : l);
        await blobService.set(SYSTEM_USER_ID, 'licenses', updatedLicenses);
        setLicenses(updatedLicenses);
        toast.success("Licença revogada. O acesso foi bloqueado.");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!");
    };

    return (
        <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color border-l-4 border-l-accent">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <LockIcon size={22} className="mr-2 text-accent"/> Administração de Licenças
            </h2>
            <p className="text-sm text-text-secondary mb-4">Gerencie quem pode criar conta no sistema gerando chaves de convite.</p>
            
            <button 
                onClick={generateLicense}
                className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center mb-6"
            >
                <PlusCircleIcon size={20} /> <span className="ml-2">Gerar Nova Licença</span>
            </button>

            <div className="overflow-x-auto border border-border-color rounded-lg">
                <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-subtle-bg">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Chave</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Usado Por</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Criado em</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card-bg divide-y divide-border-color">
                        {isLoadingLicenses ? (
                             <tr><td colSpan={5} className="p-4 text-center"><LoadingSpinner size="sm"/></td></tr>
                        ) : licenses.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-text-secondary">Nenhuma licença gerada.</td></tr>
                        ) : (
                            licenses.map(lic => (
                                <tr key={lic.key} className={lic.status === 'used' || lic.status === 'revoked' ? 'opacity-60 bg-slate-50' : ''}>
                                    <td className={`px-4 py-3 text-sm font-mono font-medium flex items-center ${lic.status === 'revoked' ? 'line-through text-red-400' : 'text-text-primary'}`}>
                                        {lic.key}
                                        <button onClick={() => copyToClipboard(lic.key)} className="ml-2 text-text-secondary hover:text-accent" title="Copiar">
                                            <CopyIcon size={14} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {lic.status === 'active' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">Ativa</span>}
                                        {lic.status === 'used' && <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">Usada</span>}
                                        {lic.status === 'revoked' && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">Revogada</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{lic.usedBy || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(lic.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {(lic.status === 'active' || lic.status === 'used') && (
                                            <button 
                                                onClick={() => revokeLicense(lic.key)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                title="Revogar Licença (Bloquear Acesso)"
                                            >
                                                <TrashIcon size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BugReportManager: React.FC = () => {
    const [reports, setReports] = useState<BugReport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const SYSTEM_USER_ID = 'system_data';

    const loadReports = async () => {
        setIsLoading(true);
        const data = await blobService.get<BugReport[]>(SYSTEM_USER_ID, 'bug_reports');
        setReports(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        loadReports();
    }, []);

    const markAsResolved = async (id: string) => {
        const updatedReports = reports.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r);
        setReports(updatedReports);
        await blobService.set(SYSTEM_USER_ID, 'bug_reports', updatedReports);
        toast.success("Bug marcado como resolvido.");
    };

    const deleteReport = async (id: string) => {
        if(!window.confirm("Apagar este reporte?")) return;
        const updatedReports = reports.filter(r => r.id !== id);
        setReports(updatedReports);
        await blobService.set(SYSTEM_USER_ID, 'bug_reports', updatedReports);
    };

    return (
        <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color border-l-4 border-l-red-500 mt-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                <Bug size={22} className="mr-2 text-red-500"/> Central de Bugs e Relatos
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {isLoading ? (
                    <LoadingSpinner />
                ) : reports.length === 0 ? (
                    <p className="text-text-secondary text-center py-4">Nenhum bug reportado.</p>
                ) : (
                    reports.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(report => (
                        <div key={report.id} className={`p-4 rounded-lg border ${report.status === 'resolved' ? 'bg-subtle-bg border-border-color opacity-70' : 'bg-white border-red-200 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-text-primary text-sm">{report.reporter}</span>
                                    <span className="text-xs text-text-secondary ml-2">{new Date(report.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="flex space-x-2">
                                    {report.status === 'open' && (
                                        <button onClick={() => markAsResolved(report.id)} className="text-green-600 hover:bg-green-100 p-1 rounded" title="Marcar Resolvido">
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteReport(report.id)} className="text-red-500 hover:bg-red-100 p-1 rounded" title="Excluir">
                                        <TrashIcon size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-text-primary whitespace-pre-wrap">{report.description}</p>
                            <p className="text-xs font-semibold mt-2 uppercase tracking-wide text-text-secondary">Status: {report.status === 'open' ? <span className="text-red-500">Aberto</span> : <span className="text-green-600">Resolvido</span>}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    loading, 
    exportData,
    importData,
    allUsers,
  } = useAppData();
  const { currentUser, changePassword } = useAuth();
  
  const [asaasUrlInput, setAsaasUrlInput] = useState(settings.asaasUrl || '');
  const [customLinkTitleInput, setCustomLinkTitleInput] = useState(settings.customLinkTitle || 'Acessar Asaas');
  const [userNameInput, setUserNameInput] = useState(settings.userName || '');
  const [teamMemberInput, setTeamMemberInput] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamInputRef = useRef<HTMLInputElement>(null);
  
  // State for password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  useEffect(() => {
    if (!loading) {
      setAsaasUrlInput(settings.asaasUrl || 'https://www.asaas.com/login');
      setCustomLinkTitleInput(settings.customLinkTitle || 'Acessar Asaas');
      setUserNameInput(settings.userName || '');
    }
  }, [settings, loading]);

  const handleSaveChanges = () => {
    try {
        if (asaasUrlInput && !isValidHttpUrl(asaasUrlInput)) {
            toast.error('URL inválida. Deve começar com http:// ou https://');
            return;
        }
    } catch(e) {
        toast.error('Formato de URL inválido.');
        return;
    }

    updateSettings({
      asaasUrl: asaasUrlInput || undefined,
      customLinkTitle: customLinkTitleInput || 'Acessar Link', 
      userName: userNameInput || undefined,
    });
    toast.success('Configurações salvas com sucesso!');
  };

  const isValidHttpUrl = (string: string) => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/json') {
          toast.error("Por favor, selecione um arquivo .json válido.");
          return;
      }
      
      if (!window.confirm("Atenção: A importação de dados substituirá TODOS os dados atuais (jobs, clientes, configurações, etc.). Esta ação não pode ser desfeita. Deseja continuar?")) {
          if (event.target) event.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result;
          if (typeof text === 'string') {
              await importData(text);
          }
      };
      reader.onerror = () => {
          toast.error("Falha ao ler o arquivo.");
      };
      reader.readAsText(file);
      
      if (event.target) event.target.value = '';
  };

  const handleTeamMemberInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTeamMemberInput(input);
    if (input.length > 1) {
        const filtered = allUsers.filter(user => 
            (user.username.toLowerCase().includes(input.toLowerCase()) || 
             user.email.toLowerCase().includes(input.toLowerCase())) &&
            user.id !== currentUser?.id &&
            !settings.teamMembers?.includes(user.username)
        );
        setSuggestions(filtered);
    } else {
        setSuggestions([]);
    }
  };

  const addMember = (username: string) => {
    const updatedMembers = [...(settings.teamMembers || []), username];
    updateSettings({ teamMembers: updatedMembers });
    toast.success(`${username} foi adicionado à equipe.`);
    setTeamMemberInput('');
    setSuggestions([]);
  };

  const handleRemoveTeamMember = (usernameToRemove: string) => {
    const updatedMembers = (settings.teamMembers || []).filter(member => member !== usernameToRemove);
    updateSettings({ teamMembers: updatedMembers });
    toast.success(`${usernameToRemove} foi removido da equipe.`);
  };
  
  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateSettings({ theme });
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setIsChangingPassword(true);
    const error = await changePassword(oldPassword, newPassword);
    setIsChangingPassword(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Senha alterada com sucesso!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamInputRef.current && !teamInputRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const commonInputClass = "w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary outline-none transition-shadow bg-card-bg";
  const sectionCardClass = "bg-card-bg p-6 rounded-xl shadow-lg border border-border-color";

  if (loading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;

  const isAdmin = currentUser?.username.toLowerCase() === 'luizmellol';

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <PageIcon size={32} className="text-accent mr-3" />
        <h1 className="text-3xl font-bold text-text-primary">Configurações</h1>
      </div>
      
      {/* Admin Panel - Only visible to luizmellol */}
      {isAdmin && currentUser && (
          <>
            <LicenseManager currentUser={currentUser} />
            <BugReportManager />
          </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Dados do Usuário</h2>
            <div>
                <label htmlFor="userName" className="block text-sm font-medium text-text-secondary mb-1">Seu Nome (para saudação no Dashboard)</label>
                <input 
                  type="text" 
                  id="userName" 
                  value={userNameInput} 
                  onChange={(e) => setUserNameInput(e.target.value)} 
                  className={commonInputClass}
                  placeholder="Ex: João Silva"
                />
              </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center"><UsersIcon size={22} className="mr-2 text-accent"/>Gerenciamento de Equipe</h2>
            <p className="text-sm text-text-secondary mb-3">Adicione membros para visualizar seus jobs e calendários.</p>
            <div className="relative" ref={teamInputRef}>
                <input
                    type="text"
                    value={teamMemberInput}
                    onChange={handleTeamMemberInputChange}
                    className={commonInputClass}
                    placeholder="Buscar usuário por nome ou email..."
                />
                {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-card-bg border border-border-color rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.map(user => (
                            <li key={user.id} onClick={() => addMember(user.username)} className="p-2 hover:bg-hover-bg cursor-pointer">
                                <span className="font-semibold">{user.username}</span> <span className="text-sm text-text-secondary">- {user.email}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-base font-medium text-text-primary mb-2">Membros Atuais:</h3>
                <div className="flex flex-wrap gap-2">
                    {(settings.teamMembers || []).length > 0 ? (
                        (settings.teamMembers || []).map(member => (
                            <div key={member} className="flex items-center p-2 bg-highlight-bg rounded-full">
                                <span className="text-text-primary font-medium text-sm ml-2">{member}</span>
                                <button onClick={() => handleRemoveTeamMember(member)} className="p-1 text-red-500 hover:bg-red-100 rounded-full ml-2">
                                    <XIcon size={14} />
                                </button>
                            </div>
                        ))
                    ) : <p className="text-sm text-text-secondary">Nenhum membro na equipe ainda.</p>}
                </div>
            </div>
          </div>
          
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center"><LinkIcon size={22} className="mr-2 text-accent"/>Botão Personalizado (Menu)</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="customLinkTitle" className="block text-sm font-medium text-text-secondary mb-1">Título do Botão</label>
                    <input type="text" id="customLinkTitle" value={customLinkTitleInput} onChange={(e) => setCustomLinkTitleInput(e.target.value)} className={commonInputClass} placeholder="Ex: Acessar Asaas" />
                </div>
                <div>
                    <label htmlFor="asaasUrl" className="block text-sm font-medium text-text-secondary mb-1">URL de Destino</label>
                    <input type="url" id="asaasUrl" value={asaasUrlInput} onChange={(e) => setAsaasUrlInput(e.target.value)} className={commonInputClass} placeholder="Ex: https://www.asaas.com/login" />
                </div>
            </div>
          </div>
          
          {isPersistenceEnabled && (
            <div className={sectionCardClass}>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center"><ShieldCheck size={22} className="mr-2 text-accent"/>Alterar Senha</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-text-secondary mb-1">Senha Antiga</label>
                  <input type="password" id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={commonInputClass} required disabled={isChangingPassword} />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary mb-1">Nova Senha (mín. 6 caracteres)</label>
                  <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={commonInputClass} required disabled={isChangingPassword} />
                </div>
                 <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirmar Nova Senha</label>
                  <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={commonInputClass} required disabled={isChangingPassword} />
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all disabled:opacity-50" disabled={isChangingPassword}>
                        {isChangingPassword ? <LoadingSpinner size="sm" color="text-white"/> : 'Salvar Nova Senha'}
                    </button>
                </div>
              </form>
            </div>
          )}

        </div>

        <div className="space-y-8">

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Aparência</h2>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Tema da Interface</label>
              <div className="flex space-x-4">
                <button onClick={() => handleThemeChange('light')} className={`w-1/2 p-2 rounded-lg border-2 ${settings.theme !== 'dark' ? 'border-accent ring-2 ring-accent' : 'border-border-color'}`}>
                  <div className="w-full h-20 bg-white border border-slate-200 rounded-md flex items-center justify-center">
                    <span className="font-semibold text-black">Claro</span>
                  </div>
                </button>
                <button onClick={() => handleThemeChange('dark')} className={`w-1/2 p-2 rounded-lg border-2 ${settings.theme === 'dark' ? 'border-accent ring-2 ring-accent' : 'border-border-color'}`}>
                  <div className="w-full h-20 bg-[#1E1E1E] border border-gray-700 rounded-md flex items-center justify-center">
                    <span className="font-semibold text-white">Escuro</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Backup e Restauração</h2>
            <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-text-primary">Exportar Dados</h3>
                  <p className="text-sm text-text-secondary mt-1 mb-2">Crie um backup de todos os seus dados. Salve este arquivo em um local seguro.</p>
                  <button onClick={exportData} className="w-full flex items-center justify-center gap-2 p-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors">
                      <DownloadIcon size={18} /> Exportar
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-medium text-text-primary">Importar Dados</h3>
                  <p className="text-sm text-text-secondary mt-1 mb-2"><span className="font-bold text-red-500">Atenção:</span> Isto substituirá todos os dados existentes.</p>
                  <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 p-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-500 hover:text-white transition-colors">
                      <UploadIcon size={18} /> Importar
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSaveChanges}
          className="bg-accent text-white px-6 py-3 rounded-lg shadow hover:brightness-90 transition-all text-lg font-semibold"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
