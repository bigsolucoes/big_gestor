
import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, Client, ServiceType, JobStatus } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PrinterIcon, ChevronLeftIcon, ChevronRightIcon } from '../constants';

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-card-bg p-6 rounded-xl shadow-lg border border-border-color printable-area ${className}`}>
    <h2 className="text-xl font-semibold text-text-primary mb-4">{title}</h2>
    <div className="h-72 md:h-80"> 
      {children}
    </div>
  </div>
);

const KPICard: React.FC<{ title: string; value: string | number; unit?: string; isCurrency?: boolean; privacyModeEnabled?: boolean }> = 
  ({ title, value, unit, isCurrency = false, privacyModeEnabled = false }) => (
  <div className="bg-card-bg p-6 rounded-xl shadow-lg text-center border border-border-color printable-area">
    <h3 className="text-md font-medium text-text-secondary mb-1">{title}</h3>
    <p className="text-3xl font-bold text-accent">
      {isCurrency 
        ? formatCurrency(typeof value === 'number' ? value : parseFloat(value.toString()), privacyModeEnabled) 
        : (typeof value === 'number' ? value.toLocaleString('pt-BR', {minimumFractionDigits: (value % 1 === 0) ? 0 : 2 , maximumFractionDigits: 2}) : value)
      }
      {!isCurrency && unit && <span className="text-lg ml-1">{unit}</span>}
    </p>
  </div>
);

const NoData: React.FC<{ message?: string }> = ({ message = "Dados insuficientes para exibir o gráfico." }) => (
  <div className="flex items-center justify-center h-full text-text-secondary">
    <p>{message}</p>
  </div>
);

// --- Page Components ---

const PageOne: React.FC = () => {
    const { jobs, settings } = useAppData();
    const privacyMode = settings.privacyModeEnabled || false;

    const monthlyMetricsMap = useMemo(() => {
        const acc = jobs
        .filter(j => !j.isDeleted)
        .reduce((accumulator, job) => {
            // Track new jobs by creation date
            const creationDate = new Date(job.createdAt);
            const creationKey = `${creationDate.getFullYear()}-${(creationDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!accumulator[creationKey]) accumulator[creationKey] = { revenue: 0, cost: 0, newJobs: 0, completedJobs: 0 };
            accumulator[creationKey].newJobs += 1;

            // Track revenue and completed jobs based on FINALIZED/PAID status date (last payment date)
            if (job.status === JobStatus.PAID || job.status === JobStatus.FINALIZED) {
                const paymentDates = job.payments.map(p => new Date(p.date).getTime());
                if(paymentDates.length > 0) {
                    const lastPaymentDate = new Date(Math.max(...paymentDates));
                    const paymentKey = `${lastPaymentDate.getFullYear()}-${(lastPaymentDate.getMonth() + 1).toString().padStart(2, '0')}`;

                    if (!accumulator[paymentKey]) accumulator[paymentKey] = { revenue: 0, cost: 0, newJobs: 0, completedJobs: 0 };
                    
                    const paymentSummaryInMonth = job.payments
                        .filter(p => new Date(p.date).toISOString().startsWith(paymentKey))
                        .reduce((sum, p) => sum + p.amount, 0);

                    accumulator[paymentKey].revenue += paymentSummaryInMonth;
                    accumulator[paymentKey].cost += job.cost || 0;
                    accumulator[paymentKey].completedJobs += 1;
                }
            }
            return accumulator;
        }, {} as { [key: string]: { revenue: number, cost: number, newJobs: number, completedJobs: number } });
        
        // Ensure all months between first and last job have an entry
        if (jobs.length > 0) {
            const allDates = jobs.map(j => new Date(j.createdAt));
            const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
            const maxDate = new Date(); // up to today
            let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

            while (currentDate <= maxDate) {
                const key = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!acc[key]) {
                    acc[key] = { revenue: 0, cost: 0, newJobs: 0, completedJobs: 0 };
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }
        return acc;

    }, [jobs]);

    // FIX: Swapped map and sort, and sorting by the 'YYYY-MM' key to ensure chronological order.
    // The previous implementation had a compile error and incorrect alphabetical sorting logic.
    const metricsData = useMemo(() => Object.entries(monthlyMetricsMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([yearMonthKey, data]: [string, { revenue: number, cost: number, newJobs: number, completedJobs: number }]) => ({
        name: new Date(yearMonthKey + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        Receita: data.revenue,
        Custo: data.cost,
        Lucro: data.revenue - data.cost,
        'Ticket Médio': data.completedJobs > 0 ? data.revenue / data.completedJobs : 0,
        'Novos Jobs': data.newJobs,
        'Jobs Concluídos': data.completedJobs
    })), [monthlyMetricsMap]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Receita, Custo e Lucro Mensal">
                {metricsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => privacyMode ? 'R$ •••' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number)} />
                            <Tooltip formatter={(value) => formatCurrency(value as number, privacyMode)} />
                            <Legend />
                            <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="Custo" stroke="#f43f5e" strokeWidth={2} />
                            <Line type="monotone" dataKey="Lucro" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>
            <ChartCard title="Ticket Médio Mensal">
                 {metricsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => privacyMode ? 'R$ •••' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)} />
                            <Tooltip formatter={(value) => formatCurrency(value as number, privacyMode)} />
                            <Legend />
                            <Line type="monotone" dataKey="Ticket Médio" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>
            <ChartCard title="Novos Jobs vs. Concluídos">
                {metricsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metricsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Novos Jobs" fill="#38bdf8" />
                            <Bar dataKey="Jobs Concluídos" fill="#4ade80" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>
        </div>
    );
};

const PageTwo: React.FC = () => {
    const { jobs, clients, settings } = useAppData();
    const privacyMode = settings.privacyModeEnabled || false;

    const revenueByService = useMemo(() => {
        const serviceMap = jobs
            .filter(j => !j.isDeleted)
            .reduce((acc, job) => {
                const service = job.serviceType || 'Outro';
                const { totalPaid } = getJobPaymentSummary(job);
                acc[service] = (acc[service] || 0) + totalPaid;
                return acc;
            }, {} as { [key: string]: number });
        return Object.entries(serviceMap).map(([name, Receita]) => ({ name, Receita })).filter(item => item.Receita > 0).sort((a,b) => b.Receita - a.Receita);
    }, [jobs]);

    const topClientsByJobs = useMemo(() => {
        const clientJobCounts = jobs.filter(j => !j.isDeleted).reduce((acc, job) => {
            acc[job.clientId] = (acc[job.clientId] || 0) + 1;
            return acc;
        }, {} as {[key:string]: number});

        return Object.entries(clientJobCounts)
            .map(([clientId, count]) => ({
                name: clients.find(c => c.id === clientId)?.name || 'Desconhecido',
                'Nº de Jobs': count
            }))
            .sort((a, b) => b['Nº de Jobs'] - a['Nº de Jobs'])
            .slice(0, 5);
    }, [jobs, clients]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Receita por Serviço">
                {revenueByService.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueByService} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis type="number" tickFormatter={(value) => privacyMode ? 'R$ •••' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number)} />
                           <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                           <Tooltip formatter={(value) => formatCurrency(value as number, privacyMode)} />
                           <Bar dataKey="Receita" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>
            <ChartCard title="Top 5 Clientes por Nº de Jobs">
                {topClientsByJobs.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topClientsByJobs} >
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                           <YAxis allowDecimals={false} />
                           <Tooltip />
                           <Bar dataKey="Nº de Jobs" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>
        </div>
    );
};

const PageThree: React.FC = () => {
    const { jobs, settings } = useAppData();
    
    const completionTimeByService = useMemo(() => {
        const serviceTimes: { [key in ServiceType]?: number[] } = {};
        jobs.filter(j => j.status === JobStatus.PAID && j.payments.length > 0).forEach(job => {
            const creationDate = new Date(job.createdAt).getTime();
            const lastPaymentDate = Math.max(...job.payments.map(p => new Date(p.date).getTime()));
            const durationDays = (lastPaymentDate - creationDate) / (1000 * 60 * 60 * 24);
            
            if (!serviceTimes[job.serviceType]) serviceTimes[job.serviceType] = [];
            serviceTimes[job.serviceType]!.push(durationDays);
        });

        return Object.entries(serviceTimes).map(([service, times]) => ({
            name: service,
            'Dias': times.reduce((a, b) => a + b, 0) / times.length,
        })).sort((a,b) => b.Dias - a.Dias);
    }, [jobs]);

    const recurringJobsRate = useMemo(() => {
        const totalJobs = jobs.filter(j => !j.isDeleted).length;
        if (totalJobs === 0) return 0;
        const recurringJobs = jobs.filter(j => !j.isDeleted && j.isRecurring).length;
        return (recurringJobs / totalJobs) * 100;
    }, [jobs]);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Tempo Médio de Conclusão por Serviço">
                 {completionTimeByService.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={completionTimeByService} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => `${(value as number).toFixed(1)} dias`} />
                          <Bar dataKey="Dias" fill="#f97316" />
                       </BarChart>
                    </ResponsiveContainer>
                ) : <NoData />}
            </ChartCard>
            <KPICard title="Taxa de Jobs Recorrentes" value={recurringJobsRate.toFixed(1)} unit="%" />
        </div>
    );
};

const PerformancePage: React.FC = () => {
  const { jobs, loading } = useAppData();
  const [currentPage, setCurrentPage] = useState(0);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  
  const pages = [
      <PageOne key="page1"/>,
      <PageTwo key="page2"/>,
      <PageThree key="page3"/>
  ];
  
  const pageTitles = ["Visão Geral", "Serviços & Clientes", "Eficiência & Prazos"];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 printable-container">
      <div className="flex flex-wrap justify-between items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Desempenho: {pageTitles[currentPage]}</h1>
          <p className="text-text-secondary">Análise de métricas chave do seu negócio.</p>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={handlePrint} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg shadow transition-colors text-sm flex items-center">
              <PrinterIcon size={18} className="mr-2" />
              Imprimir Relatório
            </button>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-4 no-print">
          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 rounded-full bg-card-bg shadow disabled:opacity-50">
              <ChevronLeftIcon size={24} />
          </button>
          <span className="font-semibold text-text-primary">{currentPage + 1} / {pages.length}</span>
          <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} className="p-2 rounded-full bg-card-bg shadow disabled:opacity-50">
              <ChevronRightIcon size={24} />
          </button>
      </div>

      {jobs.length > 0 ? (
        <div className="transition-opacity duration-300">
            {pages[currentPage]}
        </div>
      ) : (
        <div className="text-center py-10 bg-card-bg rounded-xl shadow">
          <p className="text-xl text-text-secondary">Nenhum job encontrado para gerar relatórios.</p>
        </div>
      )}
    </div>
  );
};

export default PerformancePage;
