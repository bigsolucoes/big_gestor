import React, { useState, useEffect } from 'react';
import { Annotation, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from '../constants';
import { formatDate } from '../utils/formatters';

interface AnnotationsPanelProps {
  annotations: Annotation[];
  currentUser: User;
  parentId: string;
  type: 'job' | 'financial';
  onUpdateAnnotations: (annotations: Annotation[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({
  annotations,
  currentUser,
  parentId,
  type,
  onUpdateAnnotations,
  isOpen,
  onClose
}) => {
  const [newAnnotation, setNewAnnotation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddAnnotation = () => {
    if (!newAnnotation.trim()) return;

    const annotation: Annotation = {
      id: uuidv4(),
      text: newAnnotation.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
      type,
      parentId
    };

    onUpdateAnnotations([...annotations, annotation]);
    setNewAnnotation('');
  };

  const handleEditAnnotation = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = () => {
    if (!editingText.trim() || !editingId) return;

    const updatedAnnotations = annotations.map(annotation =>
      annotation.id === editingId
        ? { ...annotation, text: editingText.trim() }
        : annotation
    );

    onUpdateAnnotations(updatedAnnotations);
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteAnnotation = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta anotação?')) return;

    const updatedAnnotations = annotations.filter(annotation => annotation.id !== id);
    onUpdateAnnotations(updatedAnnotations);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h3 className="text-lg font-semibold text-text-primary">
            Anotações ({annotations.length})
          </h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add New Annotation */}
          <div className="mb-4 p-3 bg-subtle-bg rounded-lg">
            <div className="flex gap-2">
              <textarea
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                placeholder="Adicionar nova anotação..."
                className="flex-1 p-2 border border-border-color rounded-md resize-none focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary bg-card-bg"
                rows={2}
              />
              <button
                onClick={handleAddAnnotation}
                disabled={!newAnnotation.trim()}
                className="px-3 py-2 bg-accent text-white rounded-md hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>

          {/* Annotations List */}
          <div className="space-y-3">
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p>Nenhuma anotação ainda.</p>
                <p className="text-sm mt-1">Adicione sua primeira anotação acima.</p>
              </div>
            ) : (
              annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="p-3 bg-subtle-bg rounded-lg border border-border-color"
                >
                  {editingId === annotation.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 border border-border-color rounded-md resize-none focus:ring-2 focus:ring-accent focus:border-accent text-text-primary bg-card-bg"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm border border-border-color rounded-md hover:bg-hover-bg text-text-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editingText.trim()}
                          className="px-3 py-1 text-sm bg-accent text-white rounded-md hover:brightness-90 disabled:opacity-50"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-text-primary whitespace-pre-wrap">
                            {annotation.text}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEditAnnotation(annotation.id, annotation.text)}
                            className="text-text-secondary hover:text-accent transition-colors p-1"
                            title="Editar anotação"
                          >
                            <PencilIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnotation(annotation.id)}
                            className="text-text-secondary hover:text-red-500 transition-colors p-1"
                            title="Excluir anotação"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {annotation.createdBy} • {formatDate(annotation.createdAt)}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationsPanel;
