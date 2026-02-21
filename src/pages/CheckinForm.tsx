import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Priority } from '../types';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export default function CheckinForm() {
    const { addCheckin, updateCheckin, getTodayCheckin, setCurrentPage } = useApp();
    const existingCheckin = getTodayCheckin();

    const [energiaFisica, setEnergiaFisica] = useState(existingCheckin?.energiaFisica || 3);
    const [energiaMental, setEnergiaMental] = useState(existingCheckin?.energiaMental || 3);
    const [energiaEmocional, setEnergiaEmocional] = useState(existingCheckin?.energiaEmocional || 3);
    const [nivelCaos, setNivelCaos] = useState<'baixo' | 'medio' | 'alto'>(existingCheckin?.nivelCaos || 'medio');
    const [priorities, setPriorities] = useState<string[]>(() => {
        if (existingCheckin) return existingCheckin.prioridades.map(p => p.text).concat(['', '', '']).slice(0, 3);
        return ['', '', ''];
    });

    // Evening check-in state
    const [showEvening, setShowEvening] = useState(false);
    const [tarefasCompletadas, setTarefasCompletadas] = useState(
        existingCheckin?.prioridades.filter(p => p.completed).length || 0
    );
    const [energiaFisicaNoturna, setEnergiaFisicaNoturna] = useState(existingCheckin?.energiaFisicaNoturna || 2);
    const [energiaMentalNoturna, setEnergiaMentalNoturna] = useState(existingCheckin?.energiaMentalNoturna || 2);
    const [energiaEmocionalNoturna, setEnergiaEmocionalNoturna] = useState(existingCheckin?.energiaEmocionalNoturna || 2);
    const [reflexao, setReflexao] = useState(existingCheckin?.reflexaoNoturna || '');

    const EnergyDots = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
        <div className="energy-slider mb-4">
            <div className="energy-slider-label">
                <span>{label}</span>
                <span className="text-xs text-muted">{value}/5</span>
            </div>
            <div className="energy-slider-dots">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        className={`energy-slider-dot ${value >= n ? 'active' : ''}`}
                        onClick={() => onChange(n)}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    );

    const handleMorningSubmit = () => {
        const validPriorities: Priority[] = priorities
            .filter(p => p.trim())
            .map(text => ({ id: generateId(), text, completed: false }));

        if (validPriorities.length === 0) return;

        if (existingCheckin) {
            updateCheckin(existingCheckin.id, {
                energiaFisica,
                energiaMental,
                energiaEmocional,
                nivelCaos,
                prioridades: validPriorities,
            });
        } else {
            addCheckin({
                date: new Date().toISOString().split('T')[0],
                energiaFisica,
                energiaMental,
                energiaEmocional,
                nivelCaos,
                prioridades: validPriorities,
                tarefasCompletadas: 0,
            });
        }

        setCurrentPage('dashboard');
    };

    const handleEveningSubmit = () => {
        if (existingCheckin) {
            updateCheckin(existingCheckin.id, {
                tarefasCompletadas,
                energiaFisicaNoturna,
                energiaMentalNoturna,
                energiaEmocionalNoturna,
                reflexaoNoturna: reflexao,
                eveningCompleted: true,
            });
        }
        setCurrentPage('evolution');
    };

    const totalPriorities = existingCheckin?.prioridades.length || 0;

    return (
        <div className="app-container">
            <header className="app-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('dashboard')}>
                    ← Voltar
                </button>
                <span className="text-sm font-semibold">
                    {showEvening ? '🌙 Check-in Noturno' : '☀️ Check-in Matinal'}
                </span>
                <div style={{ width: 60 }} />
            </header>

            <div className="app-content">
                {/* Tab toggle if there's already a morning check-in */}
                {existingCheckin && (
                    <div className="flex gap-2 mb-6" style={{ background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-md)', padding: 4 }}>
                        <button
                            className={`btn btn-sm ${!showEvening ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ flex: 1 }}
                            onClick={() => setShowEvening(false)}
                        >
                            ☀️ Manhã
                        </button>
                        <button
                            className={`btn btn-sm ${showEvening ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ flex: 1 }}
                            onClick={() => setShowEvening(true)}
                        >
                            🌙 Noite
                        </button>
                    </div>
                )}

                {!showEvening ? (
                    /* Morning Check-in */
                    <div className="animate-slideUp">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                            Como você está agora?
                        </h2>
                        <p className="text-secondary text-sm mb-6">Avalie sua energia de 1 a 5</p>

                        <EnergyDots label="🏃 Energia Física" value={energiaFisica} onChange={setEnergiaFisica} />
                        <EnergyDots label="🧠 Energia Mental" value={energiaMental} onChange={setEnergiaMental} />
                        <EnergyDots label="❤️ Energia Emocional" value={energiaEmocional} onChange={setEnergiaEmocional} />

                        {/* Chaos Level */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold mb-3" style={{ display: 'block' }}>
                                🌊 Nível de Caos
                            </label>
                            <div className="option-group">
                                {([
                                    { value: 'baixo' as const, emoji: '☀️', label: 'Baixo' },
                                    { value: 'medio' as const, emoji: '🌤️', label: 'Médio' },
                                    { value: 'alto' as const, emoji: '🌊', label: 'Alto' },
                                ]).map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`option-card ${nivelCaos === opt.value ? 'selected' : ''}`}
                                        onClick={() => setNivelCaos(opt.value)}
                                    >
                                        <span className="option-emoji">{opt.emoji}</span>
                                        <span className="option-label">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priorities */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold mb-3" style={{ display: 'block' }}>
                                🎯 Prioridades de Hoje (máx 3)
                            </label>
                            <div className="flex flex-col gap-2">
                                {priorities.map((p, i) => (
                                    <input
                                        key={i}
                                        className="input"
                                        placeholder={i === 0 ? 'Prioridade #1 (obrigatória)' : `Prioridade #${i + 1} (opcional)`}
                                        value={p}
                                        onChange={e => {
                                            const newP = [...priorities];
                                            newP[i] = e.target.value;
                                            setPriorities(newP);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-block btn-lg"
                            disabled={!priorities[0].trim()}
                            onClick={handleMorningSubmit}
                        >
                            {existingCheckin ? 'Atualizar check-in ✓' : 'Salvar check-in ✓'}
                        </button>
                    </div>
                ) : (
                    /* Evening Check-in */
                    <div className="animate-slideUp">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                            🌙 Como foi seu dia?
                        </h2>
                        <p className="text-secondary text-sm mb-6">Hora de refletir</p>

                        {/* Tasks completed */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold mb-3" style={{ display: 'block' }}>
                                Tarefas completadas
                            </label>
                            <div className="counter-input">
                                <button
                                    className="counter-btn"
                                    onClick={() => setTarefasCompletadas(Math.max(0, tarefasCompletadas - 1))}
                                >−</button>
                                <span className="counter-value">{tarefasCompletadas}</span>
                                <button
                                    className="counter-btn"
                                    onClick={() => setTarefasCompletadas(Math.min(totalPriorities || 3, tarefasCompletadas + 1))}
                                >+</button>
                                <span className="text-sm text-muted">de {totalPriorities || 3}</span>
                            </div>
                        </div>

                        {/* Evening energy */}
                        <p className="text-sm font-semibold mb-3">Energia agora vs manhã:</p>
                        <EnergyDots label={`🏃 Física (manhã: ${existingCheckin?.energiaFisica || '?'})`} value={energiaFisicaNoturna} onChange={setEnergiaFisicaNoturna} />
                        <EnergyDots label={`🧠 Mental (manhã: ${existingCheckin?.energiaMental || '?'})`} value={energiaMentalNoturna} onChange={setEnergiaMentalNoturna} />
                        <EnergyDots label={`❤️ Emocional (manhã: ${existingCheckin?.energiaEmocional || '?'})`} value={energiaEmocionalNoturna} onChange={setEnergiaEmocionalNoturna} />

                        {/* Reflection */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold mb-2" style={{ display: 'block' }}>
                                ❓ Reflexão rápida (opcional)
                            </label>
                            <p className="text-xs text-muted mb-2">O que aprendi hoje?</p>
                            <textarea
                                className="input"
                                placeholder="Escreva suas reflexões do dia..."
                                value={reflexao}
                                onChange={e => setReflexao(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <button className="btn btn-primary btn-block btn-lg" onClick={handleEveningSubmit}>
                            Salvar e ver evolução →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
