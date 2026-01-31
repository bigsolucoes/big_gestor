import React, { useState } from 'react';
import { Proposal, ProposalContent, ProposalStep } from '../types';
import { PencilIcon, SaveIcon, XIcon, PlusIcon, TrashIcon, DownloadIcon } from '../constants';
import toast from 'react-hot-toast';

interface ProposalEditorProps {
  proposal: Proposal;
  onUpdate: (proposal: Proposal) => void;
  onClose: () => void;
}

const ProposalEditor: React.FC<ProposalEditorProps> = ({ proposal, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<ProposalContent>(proposal.content);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const handleSave = () => {
    const updatedProposal = { ...proposal, content: editedContent };
    onUpdate(updatedProposal);
    setIsEditing(false);
    toast.success('Proposta atualizada!');
  };

  const handleAddStep = () => {
    const newStep: ProposalStep = {
      id: Date.now().toString(),
      number: editedContent.steps.length + 1,
      title: 'Nova Etapa',
      description: 'Descrição da nova etapa',
      duration: 'X dias',
      deliverables: ['Entregável 1', 'Entregável 2']
    };
    
    setEditedContent({
      ...editedContent,
      steps: [...editedContent.steps, newStep]
    });
  };

  const handleUpdateStep = (stepId: string, field: keyof ProposalStep, value: any) => {
    setEditedContent({
      ...editedContent,
      steps: editedContent.steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta etapa?')) return;
    
    const updatedSteps = editedContent.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, number: index + 1 }));
    
    setEditedContent({
      ...editedContent,
      steps: updatedSteps
    });
  };

  const handleAddDeliverable = (stepId: string) => {
    const newDeliverable = 'Novo entregável';
    handleUpdateStep(stepId, 'deliverables', [
      ...(editedContent.steps.find(s => s.id === stepId)?.deliverables || []),
      newDeliverable
    ]);
  };

  const handleUpdateDeliverable = (stepId: string, index: number, value: string) => {
    const step = editedContent.steps.find(s => s.id === stepId);
    if (step && step.deliverables) {
      const updatedDeliverables = [...step.deliverables];
      updatedDeliverables[index] = value;
      handleUpdateStep(stepId, 'deliverables', updatedDeliverables);
    }
  };

  const handleDeleteDeliverable = (stepId: string, index: number) => {
    const step = editedContent.steps.find(s => s.id === stepId);
    if (step && step.deliverables) {
      const updatedDeliverables = step.deliverables.filter((_, i) => i !== index);
      handleUpdateStep(stepId, 'deliverables', updatedDeliverables);
    }
  };

  const handleExportPDF = () => {
    // This would generate PDF - for now just show a message
    toast.success('Função de exportação PDF em desenvolvimento!');
  };

  const renderStep = (step: ProposalStep) => {
    const isStepEditing = editingStep === step.id;

    return (
      <div key={step.id} className="border border-border-color rounded-lg p-4 mb-4 bg-card-bg">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-semibold mr-3">
              {step.number}
            </div>
            {isStepEditing ? (
              <input
                type="text"
                value={step.title}
                onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                className="text-lg font-semibold text-text-primary bg-transparent border-b border-border-color focus:border-accent outline-none"
              />
            ) : (
              <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <>
                <button
                  onClick={() => setEditingStep(isStepEditing ? null : step.id)}
                  className="p-1 text-text-secondary hover:text-accent transition-colors"
                  title={isStepEditing ? "Salvar" : "Editar"}
                >
                  {isStepEditing ? <SaveIcon size={16} /> : <PencilIcon size={16} />}
                </button>
                <button
                  onClick={() => handleDeleteStep(step.id)}
                  className="p-1 text-text-secondary hover:text-red-600 transition-colors"
                  title="Excluir"
                >
                  <TrashIcon size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {isStepEditing ? (
          <textarea
            value={step.description}
            onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
            className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary mb-3"
            rows={3}
          />
        ) : (
          <p className="text-text-secondary mb-3">{step.description}</p>
        )}

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">Duração:</span>
            {isStepEditing ? (
              <input
                type="text"
                value={step.duration}
                onChange={(e) => handleUpdateStep(step.id, 'duration', e.target.value)}
                className="text-sm text-text-primary bg-transparent border-b border-border-color focus:border-accent outline-none"
              />
            ) : (
              <span className="text-sm text-text-primary">{step.duration}</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Entregáveis:</span>
            {isEditing && (
              <button
                onClick={() => handleAddDeliverable(step.id)}
                className="p-1 text-text-secondary hover:text-accent transition-colors"
                title="Adicionar entregável"
              >
                <PlusIcon size={14} />
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {(step.deliverables || []).map((deliverable, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                {isStepEditing ? (
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleUpdateDeliverable(step.id, index, e.target.value)}
                    className="flex-1 text-sm text-text-primary bg-transparent border-b border-border-color focus:border-accent outline-none"
                  />
                ) : (
                  <span className="text-sm text-text-primary">{deliverable}</span>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleDeleteDeliverable(step.id, index)}
                    className="p-1 text-text-secondary hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-color">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{proposal.title}</h2>
              <p className="text-text-secondary">
                Cliente: {proposal.content.clientInfo.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="p-2 text-text-secondary hover:text-accent transition-colors"
                title="Exportar PDF"
              >
                <DownloadIcon size={20} />
              </button>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:brightness-90 transition-colors flex items-center"
                >
                  <PencilIcon size={16} className="mr-2" />
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingStep(null);
                      setEditedContent(proposal.content);
                    }}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <SaveIcon size={16} className="mr-2" />
                    Salvar
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Client Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Informações do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-text-secondary">Nome:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedContent.clientInfo.name}
                    onChange={(e) => setEditedContent({
                      ...editedContent,
                      clientInfo: { ...editedContent.clientInfo, name: e.target.value }
                    })}
                    className="w-full mt-1 p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                  />
                ) : (
                  <p className="text-text-primary">{editedContent.clientInfo.name}</p>
                )}
              </div>
              <div>
                <span className="text-sm text-text-secondary">Empresa:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedContent.clientInfo.company || ''}
                    onChange={(e) => setEditedContent({
                      ...editedContent,
                      clientInfo: { ...editedContent.clientInfo, company: e.target.value }
                    })}
                    className="w-full mt-1 p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                  />
                ) : (
                  <p className="text-text-primary">{editedContent.clientInfo.company || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-text-primary">Etapas do Projeto</h3>
              {isEditing && (
                <button
                  onClick={handleAddStep}
                  className="px-3 py-1 bg-accent text-white rounded-lg hover:brightness-90 transition-colors flex items-center text-sm"
                >
                  <PlusIcon size={14} className="mr-1" />
                  Adicionar Etapa
                </button>
              )}
            </div>
            {editedContent.steps.map(renderStep)}
          </div>

          {/* Terms */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Condições Comerciais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-text-secondary">Forma de Pagamento:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedContent.terms.paymentMethod}
                    onChange={(e) => setEditedContent({
                      ...editedContent,
                      terms: { ...editedContent.terms, paymentMethod: e.target.value }
                    })}
                    className="w-full mt-1 p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                  />
                ) : (
                  <p className="text-text-primary">{editedContent.terms.paymentMethod}</p>
                )}
              </div>
              <div>
                <span className="text-sm text-text-secondary">Revisões:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedContent.terms.revisions}
                    onChange={(e) => setEditedContent({
                      ...editedContent,
                      terms: { ...editedContent.terms, revisions: parseInt(e.target.value) }
                    })}
                    className="w-full mt-1 p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent bg-card-bg text-text-primary"
                  />
                ) : (
                  <p className="text-text-primary">{editedContent.terms.revisions} revisões</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalEditor;
