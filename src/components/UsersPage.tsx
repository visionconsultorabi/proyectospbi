import React, { useState, useMemo } from 'react';
import { useUsers } from '../context/UserContext';
import { useProjects } from '../context/ProjectContext';
import type { PBIUser, LicenseType } from '../types';
import { Mail, Key, Calendar, LayoutTemplate, PlusCircle, Trash2, X, Save, Search, UserCheck, UserX, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { format, parseISO, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';


const calcExpiration = (creationDate: string, validityDays: number): string => {
  if (!creationDate || !validityDays) return '';
  return format(addDays(parseISO(creationDate), validityDays), 'yyyy-MM-dd');
};

type FilterType = 'all' | 'active' | 'inactive';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const { projects } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PBIUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    licenseType: 'Pro' as LicenseType,
    creationDate: '',
    validityDays: '' as unknown as number | '',
    isActive: true,
  });

  const activeCount = users.filter(u => u.isActive !== false).length;
  const inactiveCount = users.filter(u => u.isActive === false).length;

  const sortedFilteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const isActive = u.isActive !== false;
        if (filter === 'active' && !isActive) return false;
        if (filter === 'inactive' && isActive) return false;
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [users, filter, searchQuery]);

  const handleOpenForm = (user?: PBIUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password || '',
        licenseType: user.licenseType,
        creationDate: user.creationDate || '',
        validityDays: user.validityDays ?? '',
        isActive: user.isActive !== false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        licenseType: 'Pro',
        creationDate: format(new Date(), 'yyyy-MM-dd'),
        validityDays: 365,
        isActive: true,
      });
    }
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vDays = Number(formData.validityDays) || 0;
    const expDate = formData.creationDate && vDays > 0
      ? calcExpiration(formData.creationDate, vDays)
      : '';

    const payload = {
      ...formData,
      validityDays: vDays,
      expirationDate: expDate,
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      addUser(payload);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario? Sus vínculos a proyectos se perderán.')) {
      deleteUser(id);
      setIsFormOpen(false);
    }
  };

  const getLicenseBadgeColor = (type: LicenseType) => {
    if (type === 'Premium') return '#8b5cf6';
    if (type === 'Pro') return 'var(--primary-color)';
    return '#64748b';
  };

  return (
    <section className="projects-section">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Gestor de Usuarios</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Activos: {activeCount}</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Inactivos: {inactiveCount}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <PlusCircle size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="filters-container" style={{ padding: '0.75rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="filter-input"
            style={{ paddingLeft: '2rem', width: '100%', margin: 0, border: 'none', backgroundColor: 'transparent' }}
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
        <div style={{ display: 'flex', gap: '0.25rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {(['all', 'active', 'inactive'] as FilterType[]).map(f => (
            <button
              key={f}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: filter === f ? 'none' : '1px solid transparent', backgroundColor: filter === f ? 'var(--primary-color)' : 'transparent', color: filter === f ? 'white' : 'var(--text-secondary)' }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="projects-grid">
        {sortedFilteredUsers.map(user => {
          const userProjects = projects.filter(p => p.userIds?.includes(user.id));
          const isActive = user.isActive !== false;
          const isExpiringSoon = user.expirationDate &&
            (isToday(parseISO(user.expirationDate)) || isTomorrow(parseISO(user.expirationDate)));

          return (
            <div
              key={user.id}
              className="project-card"
              style={{
                opacity: isActive ? 1 : 0.6,
                borderLeft: isExpiringSoon ? '4px solid #f59e0b' : undefined,
              }}
            >
              <div className="project-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 className="project-title" style={{ marginBottom: '0.2rem' }}>
                      {user.firstName} {user.lastName}
                    </h3>
                    {!isActive && (
                      <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '99px', fontWeight: 700 }}>
                        INACTIVO
                      </span>
                    )}
                    {isExpiringSoon && (
                      <span style={{ fontSize: '0.65rem', background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '99px', fontWeight: 700 }}>
                        ¡VENCE PRONTO!
                      </span>
                    )}
                  </div>
                  <div className="project-workspace" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', wordBreak: 'break-all', textTransform: 'lowercase', fontSize: '0.75rem' }}>
                    <Mail size={12} style={{ flexShrink: 0 }} /> {user.email.toLowerCase()}
                  </div>
                </div>
              </div>

              <div className="project-details">
                <div className="detail-row">
                  <Key size={14} />
                  <span>Licencia: <strong style={{ color: getLicenseBadgeColor(user.licenseType) }}>{user.licenseType}</strong></span>
                </div>
                {user.expirationDate && (
                  <div className="detail-row" style={{ color: isExpiringSoon ? '#f59e0b' : undefined }}>
                    <Calendar size={14} />
                    <span>Vence: <strong>{format(parseISO(user.expirationDate), 'dd MMM yyyy', { locale: es })}</strong></span>
                    {isExpiringSoon && <AlertTriangle size={14} />}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', flex: 1 }}>
                  <div className="detail-row" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    <LayoutTemplate size={14} />
                    Proyectos Vinculados ({userProjects.length})
                  </div>
                  {userProjects.length > 0 ? (
                    <ul style={{ listStyle: 'none', paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {userProjects.map(p => (
                        <li key={p.id} style={{ marginBottom: '0.25rem' }}>• {p.projectName} {p.isArchived ? '(Archivado)' : ''}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>No hay proyectos vinculados.</p>
                  )}
                </div>
              </div>

              <div className="project-actions">
                <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => handleOpenForm(user)}>
                  Editar Usuario
                </button>
              </div>
            </div>
          );
        })}
        {sortedFilteredUsers.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No se encontraron usuarios.</p>
        )}
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="btn-close" onClick={() => setIsFormOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="Ej. Juan" />
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Ej. Pérez" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Usuario (Email PBI)</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    placeholder="juan.perez@empresa.com"
                    style={{ textTransform: 'lowercase' }}
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Contraseña del usuario"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Licencia</label>
                    <select value={formData.licenseType} onChange={e => setFormData({ ...formData, licenseType: e.target.value as LicenseType })}>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                      <option value="Gratuita">Gratuita</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Activo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          background: formData.isActive ? '#dcfce7' : '#fee2e2',
                          color: formData.isActive ? '#16a34a' : '#ef4444',
                          fontWeight: 600, fontSize: '0.85rem',
                        }}
                      >
                        {formData.isActive ? <><UserCheck size={16} /> Activo</> : <><UserX size={16} /> Inactivo</>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Creación de Licencia</label>
                    <input
                      type="date"
                      value={formData.creationDate}
                      onChange={e => setFormData({ ...formData, creationDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Días de Vigencia</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.validityDays}
                      onChange={e => setFormData({ ...formData, validityDays: e.target.value === '' ? '' : Number(e.target.value) })}
                      placeholder="Ej. 365"
                    />
                  </div>
                </div>

                {formData.creationDate && Number(formData.validityDays) > 0 && (
                  <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Fecha de vencimiento calculada: <strong style={{ color: 'var(--text-primary)' }}>
                      {format(addDays(parseISO(formData.creationDate), Number(formData.validityDays)), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </strong>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editingUser && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingUser.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">
                    <Save size={18} />
                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
