import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, BarChart3, FlaskConical, Clock, Settings, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getEnergyLabel(level: number): string {
    if (level <= 2) return 'BAIXA';
    if (level <= 3) return 'MÉDIA';
    return 'ALTA';
}

function getChaosLabel(level: string): string {
    const map: Record<string, string> = { baixo: 'BAIXO', medio: 'MÉDIO', alto: 'ALTO' };
    return map[level] || level.toUpperCase();
}

function getChaosClass(level: string): string {
    const map: Record<string, string> = { baixo: 'text-success', medio: 'text-warning', alto: 'text-danger' };
    return map[level] || '';
}

export default function Dashboard() {
    const { getTodayCheckin, togglePriority, editPriority, addPriority, removePriority, setCurrentPage, getTrialDaysLeft } = useApp();
    const checkin = getTodayCheckin();
    const now = new Date();
    const dateStr = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
    const trialDays = getTrialDaysLeft();

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [newPriorityText, setNewPriorityText] = useState('');

    const avgEnergy = checkin
        ? Math.round((checkin.energiaFisica + checkin.energiaMental + checkin.energiaEmocional) / 3)
        : 3;

    const getInsight = () => {
        if (!checkin) return 'Faça seu check-in matinal para receber insights personalizados.';
        if (checkin.nivelCaos === 'alto' && avgEnergy <= 2) {
            return '⚠️ Caos alto + energia baixa. Foque APENAS na #1. Proteja sua energia.';
        }
        if (checkin.nivelCaos === 'alto') {
            return 'Seu caos está alto hoje. Foque APENAS na #1. O resto é bônus.';
        }
        if (avgEnergy >= 4) {
            return '⚡ Energia alta! Aproveite para atacar as tarefas mais desafiadoras.';
        }
        if (avgEnergy <= 2) {
            return '🔋 Energia baixa. Faça o mínimo essencial e descanse. Amanhã é outro dia.';
        }
        return '💡 Energia estável. Mantenha o ritmo e não se sobrecarregue.';
    };

    const startEditing = (id: string, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const saveEdit = () => {
        if (!checkin || !editingId || !editText.trim()) return;
        editPriority(checkin.id, editingId, editText.trim());
        setEditingId(null);
        setEditText('');
    };

    const handleAddPriority = () => {
        if (!checkin || !newPriorityText.trim()) return;
        addPriority(checkin.id, newPriorityText.trim());
        setNewPriorityText('');
    };

    const handleRemovePriority = (priorityId: string) => {
        if (!checkin) return;
        removePriority(checkin.id, priorityId);
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') action();
        if (e.key === 'Escape') { setEditingId(null); setNewPriorityText(''); }
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="app-header-title">
                    <span className="compass-icon">🧭</span>
                    <span>BÚSSOLA DO CAOS</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('settings')}>
                    <Settings size={18} />
                </button>
            </header>

            <div className="app-content">
                {/* Date & State */}
                <div className="animate-fadeIn">
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>📅 {dateStr}</p>
                    {checkin && (
                        <p className="mt-1" style={{ fontSize: '0.875rem' }}>
                            Seu estado hoje: Energia <strong className="text-accent">{getEnergyLabel(avgEnergy)}</strong>
                            {' '}• Caos <strong className={getChaosClass(checkin.nivelCaos)}>{getChaosLabel(checkin.nivelCaos)}</strong>
                        </p>
                    )}
                    {trialDays > 0 && trialDays <= 7 && (
                        <div className="badge badge-warning mt-2">
                            ⏳ {trialDays} dias restantes no trial
                        </div>
                    )}
                </div>

                {/* Priorities */}
                <div className="mt-6 animate-slideUp">
                    <div className="section-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="section-icon">🎯</span>
                            <span className="section-title">Suas Prioridades Essenciais</span>
                        </div>
                        {checkin && checkin.prioridades.length > 0 && (
                            <button
                                className={`btn btn-ghost btn-sm ${editMode ? 'text-accent' : ''}`}
                                onClick={() => { setEditMode(!editMode); setEditingId(null); setNewPriorityText(''); }}
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                                {editMode ? <><X size={14} /> Fechar</> : <><Pencil size={14} /> Editar</>}
                            </button>
                        )}
                    </div>

                    {checkin && checkin.prioridades.length > 0 ? (
                        <div className="flex flex-col gap-2 stagger">
                            {checkin.prioridades.map((p, i) => (
                                <div key={p.id}>
                                    {editingId === p.id ? (
                                        /* Inline edit input */
                                        <div className="priority-item animate-fadeIn" style={{ gap: 8 }}>
                                            <input
                                                className="input"
                                                value={editText}
                                                onChange={e => setEditText(e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, saveEdit)}
                                                autoFocus
                                                style={{ flex: 1, padding: '8px 12px' }}
                                            />
                                            <button
                                                className="btn btn-primary btn-sm"
                                                style={{ padding: '6px 10px' }}
                                                onClick={saveEdit}
                                                disabled={!editText.trim()}
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ padding: '6px 10px' }}
                                                onClick={() => setEditingId(null)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        /* Normal priority row */
                                        <div
                                            className={`priority-item animate-slideInRight ${p.completed ? 'completed' : ''}`}
                                            style={{ cursor: editMode ? 'default' : 'pointer' }}
                                        >
                                            {!editMode && (
                                                <div
                                                    className="priority-check"
                                                    onClick={() => togglePriority(checkin.id, p.id)}
                                                >
                                                    {p.completed && <Check size={14} />}
                                                </div>
                                            )}
                                            <span
                                                className="priority-text"
                                                style={{ flex: 1 }}
                                                onClick={() => !editMode && togglePriority(checkin.id, p.id)}
                                            >
                                                {i + 1}. {p.text}
                                            </span>
                                            {editMode && (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ padding: '4px 8px' }}
                                                        onClick={() => startEditing(p.id, p.text)}
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm text-danger"
                                                        style={{ padding: '4px 8px' }}
                                                        onClick={() => handleRemovePriority(p.id)}
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add new priority (in edit mode, max 3) */}
                            {editMode && checkin.prioridades.length < 3 && (
                                <div className="priority-item animate-fadeIn" style={{ gap: 8, borderStyle: 'dashed', borderColor: 'rgba(251,191,36,0.2)' }}>
                                    <Plus size={16} className="text-muted" style={{ flexShrink: 0 }} />
                                    <input
                                        className="input"
                                        placeholder="Adicionar prioridade..."
                                        value={newPriorityText}
                                        onChange={e => setNewPriorityText(e.target.value)}
                                        onKeyDown={e => handleKeyDown(e, handleAddPriority)}
                                        style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: 'none' }}
                                    />
                                    {newPriorityText.trim() && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ padding: '6px 10px' }}
                                            onClick={handleAddPriority}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                            <p className="text-secondary text-sm mb-3">Nenhuma prioridade definida para hoje.</p>
                            <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('checkin')}>
                                <Plus size={16} /> Fazer check-in
                            </button>
                        </div>
                    )}
                </div>

                {/* Insight */}
                <div className="card card-glow mt-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
                    <div className="section-header mb-2">
                        <span className="section-icon">💡</span>
                        <span className="section-title">Insight do Dia</span>
                    </div>
                    <p className="text-sm" style={{ lineHeight: 1.6 }}>{getInsight()}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 mt-6">
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('evolution')}>
                        <BarChart3 size={16} /> Ver Evolução
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentPage('experiments')}>
                        <FlaskConical size={16} /> Experimentos
                    </button>
                </div>

                {/* Evening reminder */}
                {checkin && !checkin.eveningCompleted && (
                    <div className="card mt-6 animate-fadeIn" style={{ padding: '14px 16px', borderColor: 'rgba(251,191,36,0.15)' }}>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-accent" />
                            <span className="text-sm">
                                <strong>LEMBRETE:</strong> Check-in noturno pendente
                            </span>
                        </div>
                    </div>
                )}

                {/* Bottom actions */}
                <div className="flex gap-3 mt-6" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setCurrentPage('checkin')}>
                        <Plus size={16} /> Novo check-in
                    </button>
                </div>
            </div>

            {/* Bottom Nav */}
            <nav className="app-nav">
                <button className="nav-item active" onClick={() => setCurrentPage('dashboard')}>
                    <span className="nav-icon">🧭</span>
                    <span>Bússola</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('checkin')}>
                    <span className="nav-icon">✏️</span>
                    <span>Check-in</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('evolution')}>
                    <span className="nav-icon">📊</span>
                    <span>Evolução</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('experiments')}>
                    <span className="nav-icon">🔬</span>
                    <span>TAE</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('settings')}>
                    <span className="nav-icon">⚙️</span>
                    <span>Config</span>
                </button>
            </nav>
        </div>
    );
}
