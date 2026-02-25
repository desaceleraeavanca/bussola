import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, ChevronRight, CheckCircle, MessageSquare, Trash2 } from 'lucide-react';
import type { ExperimentNote } from '../types';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export default function Experiments() {
    const { experiments, addExperiment, updateExperiment, removeExperiment, setCurrentPage, isPremium } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [nome, setNome] = useState('');
    const [hipotese, setHipotese] = useState('');
    const [duracao, setDuracao] = useState(7);

    // Note (annotation) state
    const [noteId, setNoteId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    // Finalize state
    const [finalizeId, setFinalizeId] = useState<string | null>(null);
    const [resultado, setResultado] = useState('');
    const [proximosPassos, setProximosPassos] = useState('');

    // Expanded notes
    const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

    // Deletion modal
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Edit modal state
    const [editId, setEditId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState('');
    const [editHipotese, setEditHipotese] = useState('');
    const [editDuracao, setEditDuracao] = useState(7);

    const inProgress = experiments.filter(e => !e.completedAt);
    const completed = experiments.filter(e => e.completedAt);

    const canAddMore = isPremium() || inProgress.length < 1;

    const handleCreate = () => {
        if (!nome.trim() || !hipotese.trim()) return;
        addExperiment({ nome, hipotese, duracao, fase: 'teste' });
        setNome('');
        setHipotese('');
        setDuracao(7);
        setShowForm(false);
    };

    const handleAdvancePhase = (id: string, currentPhase: string) => {
        if (currentPhase === 'teste') {
            updateExperiment(id, { fase: 'ajuste' });
        } else if (currentPhase === 'ajuste') {
            updateExperiment(id, { fase: 'escala' });
        }
    };

    const handleSaveNote = (id: string) => {
        if (!noteText.trim()) return;
        const exp = experiments.find(e => e.id === id);
        if (!exp) return;
        const newNote: ExperimentNote = {
            id: generateId(),
            date: new Date().toISOString(),
            texto: noteText.trim(),
            fase: exp.fase,
        };
        updateExperiment(id, {
            anotacoes: [...(exp.anotacoes || []), newNote],
        });
        setNoteId(null);
        setNoteText('');
    };

    const handleFinalize = (id: string) => {
        updateExperiment(id, {
            resultado: resultado.trim() || undefined,
            proximosPassos: proximosPassos.trim() || undefined,
            completedAt: new Date().toISOString(),
        });
        setFinalizeId(null);
        setResultado('');
        setProximosPassos('');
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            removeExperiment(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const handleEdit = (exp: any) => {
        setEditId(exp.id);
        setEditNome(exp.nome);
        setEditHipotese(exp.hipotese);
        setEditDuracao(exp.duracao);
    };

    const handleSaveEdit = () => {
        if (!editId || !editNome.trim() || !editHipotese.trim()) return;
        updateExperiment(editId, {
            nome: editNome.trim(),
            hipotese: editHipotese.trim(),
            duracao: editDuracao,
        });
        setEditId(null);
    };

    const getPhaseBadge = (fase: string) => {
        const map: Record<string, { label: string; className: string; color: string }> = {
            teste: { label: 'Teste', className: 'badge-warning', color: 'rgba(245,158,11,0.18)' },
            ajuste: { label: 'Ajuste', className: 'badge-info', color: 'rgba(59,130,246,0.18)' },
            escala: { label: 'Escale', className: 'badge-success', color: 'rgba(34,197,94,0.18)' },
        };
        return map[fase] || { label: fase, className: 'badge-gold', color: 'transparent' };
    };

    const getNoteFaseStyle = (fase?: string): { label: string; color: string; textColor: string } => {
        const map: Record<string, { label: string; color: string; textColor: string }> = {
            teste: { label: 'Teste', color: 'rgba(245,158,11,0.15)', textColor: '#f59e0b' },
            ajuste: { label: 'Ajuste', color: 'rgba(59,130,246,0.15)', textColor: '#60a5fa' },
            escala: { label: 'Escale', color: 'rgba(34,197,94,0.15)', textColor: '#4ade80' },
        };
        return map[fase || ''] || { label: '', color: 'transparent', textColor: 'var(--text-muted)' };
    };

    const getDaysRunning = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        return Math.floor((now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000));
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${date} ${time}`;
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('dashboard')}>
                    ← Voltar
                </button>
                <span className="text-sm font-semibold">🔬 Experimentos TAE</span>
                <div style={{ width: 60 }} />
            </header>

            <div className="app-content">
                {/* Header + New button */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Seus Experimentos</h2>
                        <p className="text-secondary text-xs mt-1">Método TAE: Teste → Ajuste → Escale</p>
                    </div>
                    {canAddMore && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                            <Plus size={16} /> Novo
                        </button>
                    )}
                </div>

                {/* New Experiment Form */}
                {showForm && (
                    <div className="card card-glow mb-6 animate-slideUp">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Novo Experimento</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-muted mb-1" style={{ display: 'block' }}>Nome do experimento</label>
                                <input
                                    className="input"
                                    placeholder="Ex: Postar Stories às 8h da manhã"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted mb-1" style={{ display: 'block' }}>Hipótese</label>
                                <input
                                    className="input"
                                    placeholder="Ex: Mais engajamento no período da manhã"
                                    value={hipotese}
                                    onChange={e => setHipotese(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted mb-1" style={{ display: 'block' }}>Duração (dias)</label>
                                <div className="flex gap-2">
                                    {[3, 5, 7, 14, 30].map(d => (
                                        <button
                                            key={d}
                                            className={`option-card ${duracao === d ? 'selected' : ''}`}
                                            style={{ padding: '8px 12px', minWidth: 'auto', flex: 'none' }}
                                            onClick={() => setDuracao(d)}
                                        >
                                            <span className="option-label">{d}d</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary btn-block"
                                disabled={!nome.trim() || !hipotese.trim()}
                                onClick={handleCreate}
                            >
                                Iniciar Experimento 🧪
                            </button>
                        </div>
                    </div>
                )}

                {/* In Progress */}
                <div className="mb-6">
                    <div className="section-header">
                        <span className="section-icon">🧪</span>
                        <span className="section-title">Em Andamento</span>
                    </div>
                    {inProgress.length > 0 ? (
                        <div className="flex flex-col gap-3 stagger">
                            {inProgress.map(exp => {
                                const daysRunning = getDaysRunning(exp.createdAt);
                                const phase = getPhaseBadge(exp.fase);
                                const notes = exp.anotacoes || [];
                                return (
                                    <div key={exp.id} className="card experiment-card animate-slideInRight" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                                        onClick={() => { if (noteId !== exp.id && finalizeId !== exp.id) handleEdit(exp); }}
                                    >
                                        {/* Card Header: name + phase badge */}
                                        <div style={{ padding: '14px 16px 0' }}>
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <span className="experiment-name" style={{ lineHeight: 1.3 }}>{exp.nome}</span>
                                                <span className={`badge ${phase.className}`} style={{ flexShrink: 0 }}>{phase.label}</span>
                                            </div>
                                            <p className="text-xs text-muted" style={{ lineHeight: 1.4, marginBottom: 12 }}>
                                                {exp.hipotese}
                                            </p>

                                            {/* Progress bar + days */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="progress-bar" style={{ flex: 1, margin: 0 }}>
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{ width: `${Math.min(100, ((daysRunning + 1) / exp.duracao) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    Dia {daysRunning + 1}/{exp.duracao}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Notes list */}
                                        {notes.length > 0 && (
                                            <div style={{ padding: '0 16px 12px' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm text-secondary"
                                                    style={{ padding: '2px 0', fontSize: '0.75rem', gap: 4 }}
                                                    onClick={e => { e.stopPropagation(); setExpandedNotes(expandedNotes === exp.id ? null : exp.id); }}
                                                >
                                                    <MessageSquare size={12} />
                                                    {notes.length} {notes.length === 1 ? 'anotação' : 'anotações'} {expandedNotes === exp.id ? '▲' : '▼'}
                                                </button>
                                                {expandedNotes === exp.id && (
                                                    <div className="flex flex-col gap-2 mt-2 animate-fadeIn">
                                                        {notes.map(note => {
                                                            const nf = getNoteFaseStyle(note.fase);
                                                            return (
                                                                <div
                                                                    key={note.id}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        background: 'rgba(255,255,255,0.03)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        borderLeft: `2px solid ${nf.textColor}`,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs text-muted">{formatDate(note.date)}</span>
                                                                    </div>
                                                                    <p className="text-sm" style={{ lineHeight: 1.5 }}>{note.texto}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Add note form */}
                                        {noteId === exp.id && (
                                            <div className="flex flex-col gap-2 animate-fadeIn" style={{ padding: '0 16px 12px' }}>
                                                <textarea
                                                    className="input"
                                                    placeholder="Como está indo o experimento? O que observou?"
                                                    value={noteText}
                                                    onChange={e => setNoteText(e.target.value)}
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        style={{ flex: 1 }}
                                                        onClick={() => handleSaveNote(exp.id)}
                                                        disabled={!noteText.trim()}
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => { setNoteId(null); setNoteText(''); }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Finalize form */}
                                        {finalizeId === exp.id && (
                                            <div className="flex flex-col gap-2 animate-fadeIn" style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.05)', borderTop: '1px solid rgba(34,197,94,0.15)' }}>
                                                <p className="text-xs font-semibold text-success" style={{ marginBottom: 4 }}>Registrar conclusão</p>
                                                <input
                                                    className="input"
                                                    placeholder="Resultado final (opcional)"
                                                    value={resultado}
                                                    onChange={e => setResultado(e.target.value)}
                                                    autoFocus
                                                />
                                                <input
                                                    className="input"
                                                    placeholder="Próximos passos (opcional)"
                                                    value={proximosPassos}
                                                    onChange={e => setProximosPassos(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        style={{ flex: 1 }}
                                                        onClick={() => handleFinalize(exp.id)}
                                                    >
                                                        ✅ Confirmar
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => { setFinalizeId(null); setResultado(''); setProximosPassos(''); }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action footer — workflow actions only, no edit/delete */}
                                        {noteId !== exp.id && finalizeId !== exp.id && (
                                            <div
                                                className="flex items-center gap-1"
                                                style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                    onClick={() => { setNoteId(exp.id); setNoteText(''); setFinalizeId(null); }}
                                                >
                                                    <MessageSquare size={13} /> Anotar
                                                </button>
                                                {exp.fase !== 'escala' && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                        onClick={() => handleAdvancePhase(exp.id, exp.fase)}
                                                    >
                                                        Avançar <ChevronRight size={13} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost btn-sm text-success"
                                                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                    onClick={() => { setFinalizeId(exp.id); setNoteId(null); }}
                                                >
                                                    <CheckCircle size={13} /> Concluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card text-center text-muted text-sm" style={{ padding: 24 }}>
                            {canAddMore
                                ? 'Nenhum experimento em andamento. Crie seu primeiro!'
                                : 'Você já possui 1 experimento ativo. Foco total nela agora!'}
                        </div>
                    )}
                </div>

                {/* Premium upsell if at limit */}
                {!canAddMore && (
                    <div className="premium-gate mb-6">
                        <div className="card experiment-card flex flex-col justify-center" style={{ padding: '16px', opacity: 0.3, filter: 'blur(3px)', pointerEvents: 'none', minHeight: 170 }}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="experiment-name" style={{ lineHeight: 1.3 }}>Estratégia Oculta #X</span>
                                <span className="badge badge-gold">Bloqueado</span>
                            </div>
                            <p className="text-xs text-muted" style={{ lineHeight: 1.4, marginBottom: 12 }}>
                                Conduza múltiplos experimentos simultâneos para entender as variáveis do seu caos.
                            </p>
                            <div className="progress-bar" style={{ margin: 0 }}>
                                <div className="progress-bar-fill" style={{ width: '40%' }} />
                            </div>
                        </div>
                        <div className="premium-gate-overlay">
                            <p className="text-sm font-semibold flex items-center gap-2">
                                🔒 LIMITE ATINGIDO
                            </p>
                            <p className="text-xs text-secondary mt-1 mb-3" style={{ maxWidth: 280, textAlign: 'center', lineHeight: 1.4 }}>
                                Empreendedores Premium rodam <strong>múltiplos experimentos</strong> ao mesmo tempo. Desbloqueie TAEs simultâneos e ilimitados.
                            </p>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setCurrentPage('settings')}
                            >
                                Desbloquear Ilimitados 💎
                            </button>
                        </div>
                    </div>
                )}

                {/* Completed */}
                <div>
                    <div className="section-header">
                        <span className="section-icon">✅</span>
                        <span className="section-title">Concluídos</span>
                    </div>
                    {completed.length > 0 ? (
                        <div className="flex flex-col gap-3 stagger">
                            {completed.map(exp => {
                                const phase = getPhaseBadge(exp.fase);
                                const notes = exp.anotacoes || [];
                                return (
                                    <div
                                        key={exp.id}
                                        className="card experiment-card animate-slideInRight"
                                        style={{ padding: 0, overflow: 'hidden', opacity: 0.9, cursor: 'pointer' }}
                                        onClick={() => handleEdit(exp)}
                                    >
                                        {/* Header */}
                                        <div style={{ padding: '14px 16px 12px' }}>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="experiment-name" style={{ lineHeight: 1.3 }}>{exp.nome}</span>
                                                <span className="badge badge-success" style={{ flexShrink: 0 }}>CONCLUÍDO</span>
                                            </div>

                                            {/* Meta chips */}
                                            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                                                <span className="text-xs text-muted" style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                                                    {phase.label}
                                                </span>
                                                <span className="text-xs text-muted" style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                                                    {exp.duracao} dias
                                                </span>
                                                {notes.length > 0 && (
                                                    <span className="text-xs text-muted" style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                                                        {notes.length} {notes.length === 1 ? 'anotação' : 'anotações'}
                                                    </span>
                                                )}
                                            </div>

                                            {(exp.resultado || exp.proximosPassos) && (
                                                <div className="mt-3 flex flex-col gap-1">
                                                    {exp.resultado && (
                                                        <p className="text-xs" style={{ lineHeight: 1.4 }}>
                                                            <span className="text-muted">Resultado: </span>{exp.resultado}
                                                        </p>
                                                    )}
                                                    {exp.proximosPassos && (
                                                        <p className="text-xs" style={{ lineHeight: 1.4 }}>
                                                            <span className="text-muted">Próximos passos: </span>{exp.proximosPassos}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {notes.length > 0 && (
                                            <div style={{ padding: '0 16px 12px' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm text-secondary"
                                                    style={{ padding: '2px 0', fontSize: '0.75rem', gap: 4 }}
                                                    onClick={e => { e.stopPropagation(); setExpandedNotes(expandedNotes === exp.id ? null : exp.id); }}
                                                >
                                                    <MessageSquare size={12} /> Ver anotações {expandedNotes === exp.id ? '▲' : '▼'}
                                                </button>
                                                {expandedNotes === exp.id && (
                                                    <div className="flex flex-col gap-2 mt-2 animate-fadeIn">
                                                        {notes.map(note => {
                                                            const nf = getNoteFaseStyle(note.fase);
                                                            return (
                                                                <div
                                                                    key={note.id}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        background: 'rgba(255,255,255,0.03)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        borderLeft: `2px solid ${nf.textColor}`,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs text-muted">{formatDate(note.date)}</span>
                                                                    </div>
                                                                    <p className="text-sm" style={{ lineHeight: 1.5 }}>{note.texto}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}


                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card text-center text-muted text-sm" style={{ padding: 24 }}>
                            Nenhum experimento concluído ainda
                        </div>
                    )}
                </div>
            </div>

            {/* Nav */}
            <nav className="app-nav">
                <button className="nav-item" onClick={() => setCurrentPage('dashboard')}>
                    <span className="nav-icon">🧭</span><span>Bússola</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('checkin')}>
                    <span className="nav-icon">✏️</span><span>Check-in</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('evolution')}>
                    <span className="nav-icon">📊</span><span>Evolução</span>
                </button>
                <button className="nav-item active" onClick={() => setCurrentPage('experiments')}>
                    <span className="nav-icon">🔬</span><span>TAE</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('settings')}>
                    <span className="nav-icon">⚙️</span><span>Config</span>
                </button>
            </nav>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
                    <div className="modal-content text-center animate-slideUp" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🗑️</div>
                        <h3 className="text-lg font-bold mb-2">Excluir Experimento?</h3>
                        <p className="text-secondary text-sm mb-6">
                            Esta ação não pode ser desfeita. Todas as anotações deste experimento serão perdidas.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button className="btn btn-danger btn-block" onClick={confirmDelete}>
                                Sim, excluir
                            </button>
                            <button className="btn btn-ghost btn-block" onClick={() => setDeleteConfirmId(null)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editId && (
                <div className="modal-overlay" onClick={() => setEditId(null)}>
                    <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Editar Experimento</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-muted mb-1" style={{ display: 'block' }}>Nome do experimento</label>
                                <input
                                    className="input"
                                    value={editNome}
                                    onChange={e => setEditNome(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted mb-1" style={{ display: 'block' }}>Hipótese</label>
                                <input
                                    className="input"
                                    value={editHipotese}
                                    onChange={e => setEditHipotese(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted mb-1" style={{ display: 'block' }}>Duração (dias)</label>
                                <div className="flex gap-2">
                                    {[3, 5, 7, 14, 30].map(d => (
                                        <button
                                            key={d}
                                            className={`option-card ${editDuracao === d ? 'selected' : ''}`}
                                            style={{ padding: '8px 12px', minWidth: 'auto', flex: 'none' }}
                                            onClick={() => setEditDuracao(d)}
                                        >
                                            <span className="option-label">{d}d</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary btn-block mt-2"
                                disabled={!editNome.trim() || !editHipotese.trim()}
                                onClick={handleSaveEdit}
                            >
                                Salvar Alterações
                            </button>
                            <button
                                className="btn btn-block"
                                style={{
                                    marginTop: 2,
                                    background: '#dc2626',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    fontWeight: 600,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}
                                onClick={() => { setEditId(null); handleDelete(editId!); }}
                            >
                                <Trash2 size={15} />
                                Excluir experimento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
