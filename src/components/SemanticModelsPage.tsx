import React, { useState, useMemo } from 'react';
import { useModels } from '../context/SemanticModelContext';
import { useProjects } from '../context/ProjectContext';
import type { SemanticModel } from '../types';
import { Database, LayoutTemplate, PlusCircle, Trash2, X, Save, Search } from 'lucide-react';

const capitalizeFirst = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

type FilterType = 'all' | 'active' | 'inactive';

export const SemanticModelsPage: React.FC = () => {
  const { models, addModel, updateModel, deleteModel } = useModels();
  const { projects } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<SemanticModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });

  const activeCount = models.filter(m => m.isActive !== false).length;
  const inactiveCount = models.filter(m => m.isActive === false).length;

  const sortedFiltered = useMemo(() => {
    return models
      .filter(m => {
        const isActive = m.isActive !== false;
        if (filter === 'active' && !isActive) return false;
        if (filter === 'inactive' && isActive) return false;
        return m.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [models, filter, searchQuery]);

  const handleOpenForm = (model?: SemanticModel) => {
    if (model) {
      setEditingModel(model);
      setFormData({ name: model.name, description: model.description || '', isActive: model.isActive !== false });
    } else {
      setEditingModel(null);
      setFormData({ name: '', description: '', isActive: true });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModel) {
      updateModel(editingModel.id, formData);
    } else {
      addModel(formData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este modelo semántico?')) {
      deleteModel(id);
      setIsFormOpen(false);
    }
  };

  return (
    <section className="projects-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Gestor de Modelos Semánticos</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Activos: {activeCount}</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Inactivos: {inactiveCount}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <PlusCircle size={20} /> Nuevo Modelo
        </button>
      </div>

      <div className="filters-container" style={{ padding: '0.75rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="filter-input" style={{ paddingLeft: '2rem', width: '100%', margin: 0, border: 'none', backgroundColor: 'transparent' }} placeholder="Buscar modelo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
        <div style={{ display: 'flex', gap: '0.25rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {(['all', 'active', 'inactive'] as FilterType[]).map(f => (
            <button key={f} className={filter === f ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: filter === f ? 'none' : '1px solid transparent', backgroundColor: filter === f ? 'var(--primary-color)' : 'transparent', color: filter === f ? 'white' : 'var(--text-secondary)' }} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      <div className="projects-grid">
        {sortedFiltered.map(model => {
          const modelProjects = projects.filter(p => p.semanticModelId === model.id);
          const isActive = model.isActive !== false;
          return (
            <div key={model.id} className="project-card" style={{ opacity: isActive ? 1 : 0.6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 className="project-title" style={{ margin: 0 }}>{model.name}</h3>
                    {!isActive && <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '99px', fontWeight: 700 }}>INACTIVO</span>}
                  </div>
                  <div className="project-workspace" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Database size={12} /> {capitalizeFirst(model.description || 'sin descripción')}
                  </div>
                </div>
                <div>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => handleOpenForm(model)}>Editar Modelo</button>
                </div>
              </div>
              
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', minHeight: '100%' }}>
                <div className="detail-row" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  <LayoutTemplate size={14} /> Proyectos que lo usan ({modelProjects.length})
                </div>
                {modelProjects.length > 0 ? (
                  <ul style={{ listStyle: 'none', paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {modelProjects.map(p => <li key={p.id} style={{ marginBottom: '0.25rem' }}>• {p.projectName}</li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>No hay proyectos vinculados.</p>
                )}
              </div>
            </div>
          );
        })}
        {sortedFiltered.length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No se encontraron modelos.</p>}
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingModel ? 'Editar Modelo' : 'Nuevo Modelo Semántico'}</h2>
              <button className="btn-close" onClick={() => setIsFormOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Modelo</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Empleo SIPA PBI00" />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Breve descripción del origen de datos o propósito..." rows={3} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: formData.isActive ? '#dcfce7' : '#fee2e2', color: formData.isActive ? '#16a34a' : '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                    {formData.isActive ? '✓ Activo' : '✗ Inactivo'}
                  </button>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editingModel && (
                  <button type="button" onClick={() => handleDelete(editingModel.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary"><Save size={18} /> {editingModel ? 'Guardar Cambios' : 'Crear Modelo'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
