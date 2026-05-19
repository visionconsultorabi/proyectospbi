import React, { useState, useEffect } from 'react';
import type { PBIProject, UpdateFrequency } from '../types';
import { useUsers } from '../context/UserContext';
import { useModels } from '../context/SemanticModelContext';
import { useApps } from '../context/ApplicationContext';
import { useWorkspaces } from '../context/WorkspaceContext';
import { X, Save } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<PBIProject, 'id' | 'updateHistory' | 'status' | 'isArchived' | 'tasks'>, id?: string) => void;
  initialData?: PBIProject | null;
}

const defaultFormData = {
  workspaceId: '',
  semanticModelId: '',
  projectName: '',
  applicationId: '',
  userIds: [] as string[],
  updateFrequency: 'diaria' as UpdateFrequency,
  nextUpdateDate: new Date().toISOString().split('T')[0],
  customUpdateDate: '',
  link: '',
  documentationLink: '',
  notes: ''
};

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const { users } = useUsers();
  const { models } = useModels();
  const { apps } = useApps();
  const { workspaces } = useWorkspaces();

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        workspaceId: initialData.workspaceId,
        semanticModelId: initialData.semanticModelId,
        projectName: initialData.projectName,
        applicationId: initialData.applicationId,
        userIds: initialData.userIds || [],
        updateFrequency: initialData.updateFrequency,
        nextUpdateDate: initialData.nextUpdateDate.split('T')[0],
        customUpdateDate: initialData.customUpdateDate || '',
        link: initialData.link,
        documentationLink: initialData.documentationLink || '',
        notes: initialData.notes || ''
      });
    } else if (!isOpen) {
      setFormData(defaultFormData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => {
      const isSelected = prev.userIds.includes(userId);
      return {
        ...prev,
        userIds: isSelected ? prev.userIds.filter(id => id !== userId) : [...prev.userIds, userId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, initialData?.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? 'Editar Proyecto' : 'Nuevo Proyecto Power BI'}</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Área de trabajo</label>
                <select required name="workspaceId" value={formData.workspaceId} onChange={handleChange}>
                  <option value="">Seleccionar Área...</option>
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nombre del proyecto (Informe)</label>
                <input required name="projectName" value={formData.projectName} onChange={handleChange} placeholder="Ej. Consulta empleador" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Modelo Semántico</label>
                <select required name="semanticModelId" value={formData.semanticModelId} onChange={handleChange}>
                  <option value="">Seleccionar Modelo...</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Aplicación Destino</label>
                <select required name="applicationId" value={formData.applicationId} onChange={handleChange}>
                  <option value="">Seleccionar Aplicación...</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>


            <div className="form-row">
              <div className="form-group">
                <label>Frecuencia de actualización</label>
                <select name="updateFrequency" value={formData.updateFrequency} onChange={handleChange}>
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="personalizada">Personalizada</option>
                </select>
              </div>
              {formData.updateFrequency !== 'personalizada' ? (
                <div className="form-group">
                  <label>Próxima fecha de actualización</label>
                  <input required type="date" name="nextUpdateDate" value={formData.nextUpdateDate} onChange={handleChange} />
                </div>
              ) : (
                <div className="form-group">
                  <label>Fecha personalizada (dejar vacío = no se actualiza)</label>
                  <input
                    type="date"
                    name="customUpdateDate"
                    value={formData.customUpdateDate}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Sin fecha = el proyecto no tiene actualización programada.
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Usuarios Vinculados</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '8px' }}>
                {users.map(user => (
                  <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.userIds.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      style={{ width: 'auto' }}
                    />
                    {user.firstName} {user.lastName} ({user.licenseType})
                  </label>
                ))}
                {users.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No hay usuarios creados.</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Link de acceso al proyecto</label>
                <input required type="url" name="link" value={formData.link} onChange={handleChange} placeholder="https://app.powerbi.com/..." />
              </div>
              <div className="form-group">
                <label>Documentación / Carpeta (Opcional)</label>
                <input type="url" name="documentationLink" value={formData.documentationLink} onChange={handleChange} placeholder="https://sharepoint.com/..." />
              </div>
            </div>

            <div className="form-group">
              <label>Notas adicionales</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Requerimientos, dependencias..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              <Save size={18} />
              {initialData ? 'Guardar Cambios' : 'Guardar Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

