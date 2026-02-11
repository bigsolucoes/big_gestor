
import React, { useState, useMemo } from 'react';
import { Job, Client, JobStatus, User } from '../types';
import { PencilIcon, TrashIcon } from '../constants';
import { formatCurrency, formatDate } from '../utils/formatters';

interface JobListTableViewProps {
  jobs: Job[];
  clients: Client[];
  currentUser: User;
  onEditJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
  privacyModeEnabled: boolean;
}

type SortKey = 'createdAt' | 'deadline' | 'recordingDate';

const getStatusClass = (status: JobStatus) => {
  switch (status) {
    case JobStatus.PAID: return 'bg-green-100 text-green-700';
    case JobStatus.FINALIZED: return 'bg-blue-100 text-blue-700';
    case JobStatus.REVIEW: return 'bg-yellow-100 text-yellow-700';
    case JobStatus.PRODUCTION: return 'bg-indigo-100 text-indigo-700';
    case JobStatus.BRIEFING: return 'bg-slate-100 text-slate-700';
    case JobStatus.OTHER: return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const JobListTableView: React.FC<JobListTableViewProps> = ({ jobs, clients, currentUser, onEditJob, onDeleteJob, privacyModeEnabled }) => {
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      try {
        if (sortBy === 'recordingDate') {
            const dateA = a.recordingDate ? new Date(a.recordingDate).getTime() : 0;
            const dateB = b.recordingDate ? new Date(b.recordingDate).getTime() : 0;
            if (dateA === 0 && dateB === 0) return 0;
            if (dateA === 0) return 1; // Put jobs without recording date at the end
            if (dateB === 0) return -1;
            return dateB - dateA; // Most recent first
        }
        // For 'createdAt' and 'deadline'
        const dateA = new Date(a[sortBy]!).getTime();
        const dateB = new Date(b[sortBy]!).getTime();
        return dateB - dateA; // Most recent first for both
      } catch {
        return 0;
      }
    });
  }, [jobs, sortBy]);
  
  return (
    <div className="bg-card-bg shadow-lg rounded-xl overflow-hidden border border-border-color">
      <div className="p-4 bg-slate-50/50 flex justify-end">
        <div className="flex items-center space-x-2">
            <label htmlFor="sort-jobs" className="text-sm font-medium text-text-secondary">Ordenar por:</label>
            <select
                id="sort-jobs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary outline-none transition-shadow bg-card-bg text-sm"
            >
                <option value="createdAt">Data de Criação</option>
                <option value="deadline">Prazo de Entrega</option>
                <option value="recordingDate">Data de Gravação</option>
            </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nome do Job</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Proprietário</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Gravação</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Entrega</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-card-bg divide-y divide-border-color">
            {sortedJobs.length > 0 ? sortedJobs.map((job) => {
              const client = clients.find(c => c.id === job.clientId);
              const isOwner = job.ownerId && currentUser.id && job.ownerId === currentUser.id;
              const isOwnerByUsername = job.ownerUsername === currentUser.username;
              const isTeamMember = job.isTeamJob === true;
              const canEdit = isOwner || isOwnerByUsername || isTeamMember;
              
              // Debug para verificar propriedade
              console.log(`🔍 Debug Job "${job.name}":`, {
                jobOwnerId: job.ownerId,
                currentUserId: currentUser.id,
                jobOwnerUsername: job.ownerUsername,
                currentUserUsername: currentUser.username,
                isOwner,
                isOwnerByUsername,
                isTeamMember,
                canEdit
              });
              const today = new Date(); today.setHours(0,0,0,0);
              let deadlineDate: Date | null = null;
              try {
                deadlineDate = new Date(job.deadline);
                deadlineDate.setHours(0,0,0,0);
              } catch {}
              const isOverdue = deadlineDate && deadlineDate < today && job.status !== JobStatus.PAID && job.status !== JobStatus.FINALIZED;

              return (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {job.name}
                    {job.customServiceType && <span className="block text-xs text-text-secondary italic">{job.customServiceType}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{client?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{job.ownerUsername || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {job.recordingDate ? formatDate(job.recordingDate, {dateStyle: 'short', timeStyle: 'short'}) : '---'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-text-secondary'}`}>
                    {formatDate(job.deadline)} {isOverdue && '(Atrasado)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {formatCurrency(job.value, privacyModeEnabled)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => onEditJob(job)} className="text-slate-500 hover:text-accent p-1 disabled:opacity-30 disabled:cursor-not-allowed" title="Editar Job" disabled={!canEdit}><PencilIcon /></button>
                    <button onClick={() => onDeleteJob(job.id)} className="text-slate-500 hover:text-red-500 p-1 disabled:opacity-30 disabled:cursor-not-allowed" title="Excluir Job" disabled={!canEdit}><TrashIcon /></button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-text-secondary">
                  Nenhum job para exibir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobListTableView;
