import { useState } from 'react';
import type { DragEvent } from 'react';
import { useApp } from '../context/AppContext';
import { Check, BarChart3, FlaskConical, Clock, Settings, Plus, Pencil, Trash2, X, Save, Flame, Trophy, Zap, GripVertical } from 'lucide-react';

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
    const { checkins, getTodayCheckin, togglePriority, editPriority, addPriority, removePriority, reorderPriorities, setCurrentPage, getTrialDaysLeft } = useApp();
    const checkin = getTodayCheckin();
    const now = new Date();
    const dateStr = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
    const trialDays = getTrialDaysLeft();

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [newPriorityText, setNewPriorityText] = useState('');

    // Dnd state
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

    // Dismiss trial logic
    const todayKey = now.toISOString().split('T')[0];
    const [isTrialDismissed, setIsTrialDismissed] = useState(() => localStorage.getItem('dismissedTrial') === todayKey);

    const handleDismissTrial = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.setItem('dismissedTrial', todayKey);
        setIsTrialDismissed(true);
    };

    const avgEnergy = checkin
        ? Math.round((checkin.energiaFisica + checkin.energiaMental + checkin.energiaEmocional) / 3)
        : 3;

    const getInsight = () => {
        if (!checkin) return { icon: '💡', title: 'Insight do Dia', message: 'Faça seu check-in matinal para receber insights personalizados.' };

        let title = 'Energia Estável';
        let icon = '🔋';
        if (avgEnergy >= 4) { title = 'Energia Alta'; icon = '⚡'; }
        else if (avgEnergy <= 2) { title = 'Energia Baixa'; icon = '🪫'; }

        if (checkin.nivelCaos === 'alto' && avgEnergy <= 2) {
            return { icon, title, message: 'Caos alto + energia baixa. Foque APENAS na #1. Proteja sua energia.' };
        }
        if (checkin.nivelCaos === 'alto') {
            return { icon, title, message: 'Seu caos está alto hoje. Foque APENAS na #1. O resto é bônus.' };
        }
        if (avgEnergy >= 4) {
            return { icon, title, message: 'Aproveite para atacar as tarefas mais desafiadoras.' };
        }
        if (avgEnergy <= 2) {
            return { icon, title, message: 'Faça o mínimo essencial e descanse. Amanhã é outro dia.' };
        }
        return { icon, title, message: 'Mantenha o ritmo e não se sobrecarregue.' };
    };

    const insight = getInsight();

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

    // --- Gamification Logic ---
    const getStreak = () => {
        const dates = Array.from(new Set(checkins.map(c => c.date))).sort().reverse();
        if (dates.length === 0) return 0;

        let currentStreak = 0;
        const todayDate = new Date();
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);

        const todayStr = todayDate.toISOString().split('T')[0];
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

        let expectedDate = new Date(dates[0] + 'T12:00:00'); // Use mid-day to avoid timezone shifting
        for (const dStr of dates) {
            const dStrExpected = expectedDate.toISOString().split('T')[0];
            if (dStr === dStrExpected) {
                currentStreak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }
        return currentStreak;
    };

    const isEnergyConsistent = () => {
        if (checkins.length < 3) return false;
        const last3 = [...checkins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
        return last3.every(c => Math.round((c.energiaFisica + c.energiaMental + c.energiaEmocional) / 3) >= 3);
    };

    const streakCount = getStreak();
    const hasConsistentEnergy = isEnergyConsistent();
    const hasCalibratedCompass = streakCount >= 7;

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
                    {trialDays > 0 && trialDays <= 7 && !isTrialDismissed && (
                        <div
                            className="badge badge-warning mt-2"
                            style={{ cursor: 'pointer', transition: 'all 0.2s ease', paddingRight: 8 }}
                            onClick={() => setCurrentPage('settings')}
                            title="Fazer upgrade agora"
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            ⏳ {trialDays} dias restantes no trial <span style={{ textDecoration: 'underline', marginLeft: 4, fontWeight: 'bold' }}>Fazer Upgrade</span>
                            <div
                                onClick={handleDismissTrial}
                                style={{
                                    marginLeft: 8,
                                    padding: '2px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(245, 158, 11, 0.2)'
                                }}
                                title="Ocultar por hoje"
                            >
                                <X size={12} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Gamification Badges */}
                {(streakCount > 0 || hasConsistentEnergy || hasCalibratedCompass) && (
                    <div className="flex gap-2 mt-4 flex-wrap animate-fadeIn">
                        {streakCount > 0 && (
                            <div className="badge badge-gold" title={`${streakCount} dias seguidos!`}>
                                <Flame size={12} className="mr-1" /> {streakCount} {streakCount === 1 ? 'Dia' : 'Dias'}
                            </div>
                        )}
                        {hasCalibratedCompass && (
                            <div className="badge badge-success" title="7 dias de bússola calibrada!">
                                <Trophy size={12} className="mr-1" /> Bússola Calibrada
                            </div>
                        )}
                        {hasConsistentEnergy && (
                            <div className="badge badge-info" title="Energia alta por 3+ dias seguidos!">
                                <Zap size={12} className="mr-1" /> Energia Consistente
                            </div>
                        )}
                    </div>
                )}

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
                                            style={{
                                                cursor: editMode ? 'grab' : 'pointer',
                                                opacity: draggedItemIndex === i ? 0.4 : 1,
                                                borderColor: dragOverItemIndex === i ? 'var(--accent-gold)' : undefined,
                                                transform: dragOverItemIndex === i && draggedItemIndex !== null && draggedItemIndex > i ? 'translateY(4px)' :
                                                    dragOverItemIndex === i && draggedItemIndex !== null && draggedItemIndex < i ? 'translateY(-4px)' : 'none',
                                            }}
                                            draggable={editMode}
                                            onDragStart={(e) => {
                                                setDraggedItemIndex(i);
                                                e.dataTransfer.effectAllowed = 'move';
                                            }}
                                            onDragOver={(e: DragEvent) => {
                                                e.preventDefault();
                                                if (editMode && draggedItemIndex !== i) {
                                                    setDragOverItemIndex(i);
                                                }
                                            }}
                                            onDragLeave={() => setDragOverItemIndex(null)}
                                            onDrop={(e: DragEvent) => {
                                                e.preventDefault();
                                                setDragOverItemIndex(null);
                                                if (editMode && draggedItemIndex !== null && draggedItemIndex !== i) {
                                                    reorderPriorities(checkin.id, draggedItemIndex, i);
                                                }
                                                setDraggedItemIndex(null);
                                            }}
                                            onDragEnd={() => {
                                                setDraggedItemIndex(null);
                                                setDragOverItemIndex(null);
                                            }}
                                        >
                                            {editMode ? (
                                                <GripVertical size={18} className="text-muted" style={{ marginRight: 8, flexShrink: 0 }} />
                                            ) : (
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
                        <span className="section-icon">{insight.icon}</span>
                        <span className="section-title">{insight.title}</span>
                    </div>
                    <p className="text-sm" style={{ lineHeight: 1.6 }}>{insight.message}</p>
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
