import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Check } from 'lucide-react';

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Evolution() {
    const { checkins, setCurrentPage, isPremium, togglePriority } = useApp();
    const [showAllTasks, setShowAllTasks] = useState(false);

    const handleCompletePastTask = (taskText: string) => {
        // Find the most recent checkin where this task is pending
        const checkin = [...checkins].reverse().find(c =>
            c.prioridades.some(p => p.text.toLowerCase().trim() === taskText.toLowerCase().trim() && !p.completed)
        );
        if (checkin) {
            const pendingPriority = checkin.prioridades.find(p => p.text.toLowerCase().trim() === taskText.toLowerCase().trim() && !p.completed);
            if (pendingPriority) {
                togglePriority(checkin.id, pendingPriority.id);
            }
        }
    };

    // Get last 7 days of data
    const chartData = useMemo(() => {
        const days: { date: string; label: string; energia: number; tarefas: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const checkin = checkins.find(c => c.date === dateStr);
            const avg = checkin
                ? Math.round(((checkin.energiaFisica + checkin.energiaMental + checkin.energiaEmocional) / 3) * 10) / 10
                : 0;
            days.push({
                date: dateStr,
                label: WEEKDAYS_SHORT[d.getDay()],
                energia: avg,
                tarefas: checkin?.tarefasCompletadas || 0,
            });
        }
        return days;
    }, [checkins]);

    // Check for burnout trend (energy declining 3+ days)
    const burnoutAlert = useMemo(() => {
        const valid = chartData.filter(d => d.energia > 0);
        if (valid.length < 3) return false;
        let declining = 0;
        for (let i = 1; i < valid.length; i++) {
            if (valid[i].energia < valid[i - 1].energia) declining++;
            else declining = 0;
        }
        return declining >= 2;
    }, [chartData]);

    // 80/20 analysis: count task completions and attempt to rank priorities
    const impactAnalysis = useMemo(() => {
        const taskMap = new Map<string, { text: string; completions: number; total: number; firstTimestamp: number }>();
        checkins.forEach(c => {
            c.prioridades.forEach(p => {
                const key = p.text.toLowerCase().trim();
                const ts = parseInt(p.id.substring(0, p.id.length - 9), 36);
                const timestamp = isNaN(ts) ? new Date(`${c.date}T08:00:00`).getTime() : ts;

                const existing = taskMap.get(key) || { text: p.text, completions: 0, total: 0, firstTimestamp: timestamp };
                existing.total++;
                if (p.completed) {
                    existing.completions++;
                }

                if (timestamp < existing.firstTimestamp) {
                    existing.firstTimestamp = timestamp;
                }

                taskMap.set(key, existing);
            });
        });
        return Array.from(taskMap.values())
            .sort((a, b) => {
                const aCompleted = a.completions >= a.total && a.total > 0;
                const bCompleted = b.completions >= b.total && b.total > 0;

                if (aCompleted && !bCompleted) return 1;
                if (!aCompleted && bCompleted) return -1;

                return b.completions - a.completions;
            });
    }, [checkins]);

    // Chaos vs Tasks correlation
    const chaosCorrelation = useMemo(() => {
        const highChaos = checkins.filter(c => c.nivelCaos === 'alto');
        const lowMediumChaos = checkins.filter(c => c.nivelCaos !== 'alto');

        const avgTasksHigh = highChaos.length ? highChaos.reduce((sum, c) => sum + c.tarefasCompletadas, 0) / highChaos.length : 0;
        const avgTasksLow = lowMediumChaos.length ? lowMediumChaos.reduce((sum, c) => sum + c.tarefasCompletadas, 0) / lowMediumChaos.length : 0;

        if (avgTasksHigh === 0 || avgTasksLow === 0 || avgTasksLow <= avgTasksHigh) return null;

        const diffPercentage = Math.round(((avgTasksLow - avgTasksHigh) / avgTasksLow) * 100);
        return diffPercentage > 0 ? diffPercentage : null;
    }, [checkins]);

    // 28-day Productivity Heatmap
    const heatmapData = useMemo(() => {
        const days = [];
        for (let i = 27; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const checkin = checkins.find(c => c.date === dateStr);
            days.push({
                date: dateStr,
                label: `${d.getDate()}/${d.getMonth() + 1}`,
                tasks: checkin?.tarefasCompletadas || 0
            });
        }
        return days;
    }, [checkins]);

    const totalCheckins = checkins.length;
    const totalTasks = checkins.reduce((sum, c) => sum + c.tarefasCompletadas, 0);
    const avgEnergy = chartData.filter(d => d.energia > 0).length > 0
        ? (chartData.filter(d => d.energia > 0).reduce((s, d) => s + d.energia, 0) / chartData.filter(d => d.energia > 0).length).toFixed(1)
        : '—';

    const recentReflections = useMemo(() => {
        return [...checkins]
            .filter(c => c.reflexaoNoturna && c.reflexaoNoturna.trim().length > 0)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [checkins]);

    return (
        <div className="app-container">
            <header className="app-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('dashboard')}>
                    ← Voltar
                </button>
                <span className="text-sm font-semibold">📊 Sua Evolução</span>
                <div style={{ width: 60 }} />
            </header>

            <div className="app-content">
                {/* Stats Row */}
                <div className="flex gap-3 mb-6 animate-fadeIn">
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
                        <div className="text-xl font-bold text-accent">{totalCheckins}</div>
                        <div className="text-xs text-muted">Check-ins</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
                        <div className="text-xl font-bold text-accent">{totalTasks}</div>
                        <div className="text-xs text-muted">Tarefas feitas</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', padding: '14px 8px' }}>
                        <div className="text-xl font-bold text-accent">{avgEnergy}</div>
                        <div className="text-xs text-muted">Energia média</div>
                    </div>
                </div>

                {/* Energy Chart */}
                <div className="animate-slideUp">
                    <div className="section-header">
                        <span className="section-icon">⚡</span>
                        <span className="section-title">Energia Média Diária (7 dias)</span>
                    </div>
                    <div className="card" style={{ padding: '16px 8px 8px' }}>
                        {chartData.some(d => d.energia > 0) ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 5]}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={24}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1f2937',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8,
                                            color: '#f1f5f9',
                                            fontSize: 13,
                                        }}
                                        formatter={(value: any) => [`${value}`, 'Energia']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="energia"
                                        stroke="#fbbf24"
                                        strokeWidth={2.5}
                                        fill="url(#energyGradient)"
                                        dot={{ fill: '#fbbf24', strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 6, fill: '#fbbf24' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted text-sm" style={{ padding: '40px 0' }}>
                                Faça check-ins para ver seu gráfico de energia
                            </div>
                        )}
                    </div>
                </div>

                {/* Burnout Alert */}
                {burnoutAlert && (
                    <div className="alert alert-warning mt-4 animate-fadeIn">
                        ⚠️ <strong>ALERTA:</strong> Energia em queda constante. Considere aplicar seu Ritual de Ancoragem hoje.
                    </div>
                )}

                {/* Chaos Correlation */}
                {chaosCorrelation !== null && (
                    <div className="card mt-4 animate-fadeIn" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', padding: '16px' }}>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">🧠</span>
                            <div>
                                <h4 className="font-semibold text-sm mb-1" style={{ color: '#60a5fa' }}>Correlação Identificada</h4>
                                <p className="text-sm">
                                    Quando o seu nível de caos está <strong>ALTO</strong>, você completa <strong className="text-danger">{chaosCorrelation}% menos tarefas</strong> em média.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Heatmap de Produtividade */}
                <div className="mt-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
                    <div className="section-header">
                        <span className="section-icon">🔥</span>
                        <span className="section-title">Heatmap de Produtividade (28 dias)</span>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                            {heatmapData.map((d, i) => {
                                let opacity = 0.05;
                                if (d.tasks > 0) opacity = 0.3;
                                if (d.tasks > 1) opacity = 0.6;
                                if (d.tasks > 2) opacity = 1;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            aspectRatio: '1/1',
                                            backgroundColor: `rgba(34, 197, 94, ${opacity})`,
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                        title={`${d.label}: ${d.tasks} tarefas`}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-3 text-xs text-muted">
                            <span>Menos foco</span>
                            <div className="flex gap-1">
                                <div style={{ width: 12, height: 12, backgroundColor: 'rgba(34, 197, 94, 0.05)', borderRadius: 2 }} />
                                <div style={{ width: 12, height: 12, backgroundColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 2 }} />
                                <div style={{ width: 12, height: 12, backgroundColor: 'rgba(34, 197, 94, 0.6)', borderRadius: 2 }} />
                                <div style={{ width: 12, height: 12, backgroundColor: 'rgba(34, 197, 94, 1)', borderRadius: 2 }} />
                            </div>
                            <span>Mais foco</span>
                        </div>
                    </div>
                </div>

                {/* 80/20 Impact */}
                <div className="mt-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
                    <div className="section-header">
                        <span className="section-icon">🎯</span>
                        <span className="section-title">Impacto 80/20</span>
                    </div>
                    {impactAnalysis.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {(showAllTasks ? impactAnalysis : impactAnalysis.slice(0, 3)).map((task, i) => {
                                const isCompleted = task.completions >= task.total && task.total > 0;
                                return (
                                    <div
                                        key={i}
                                        className="card"
                                        style={{
                                            padding: '12px 16px',
                                            opacity: isCompleted ? 0.5 : 1,
                                            transition: 'opacity 0.3s ease',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <span className="text-sm font-semibold">
                                                    {i + 1}. "{task.text}"
                                                </span>
                                                {task.total > task.completions && (
                                                    <span className="text-xs text-secondary mt-1">
                                                        {(() => {
                                                            const d = new Date(task.firstTimestamp);
                                                            const day = d.getDate().toString().padStart(2, '0');
                                                            const month = (d.getMonth() + 1).toString().padStart(2, '0');
                                                            const hours = d.getHours().toString().padStart(2, '0');
                                                            const minutes = d.getMinutes().toString().padStart(2, '0');
                                                            return `Criada em ${day}/${month} às ${hours}h${minutes}`;
                                                        })()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {task.total > task.completions ? (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        style={{ padding: '4px 8px', fontSize: '0.7rem', height: 24, display: 'flex', alignItems: 'center' }}
                                                        onClick={() => handleCompletePastTask(task.text)}
                                                        title="Finalizar ocorrência mais recente desta tarefa"
                                                    >
                                                        <Check size={12} style={{ marginRight: 4 }} /> Finalizar
                                                    </button>
                                                ) : (
                                                    <Check
                                                        size={72}
                                                        color="#22c55e"
                                                        style={{
                                                            position: 'absolute',
                                                            right: -12,
                                                            bottom: -16,
                                                            opacity: 0.25,
                                                            strokeWidth: 2.5,
                                                            pointerEvents: 'none',
                                                            transform: 'rotate(-5deg)'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {impactAnalysis.length > 3 && (
                                <button
                                    className="btn btn-ghost btn-sm text-muted mt-2 mx-auto"
                                    onClick={() => setShowAllTasks(!showAllTasks)}
                                >
                                    {showAllTasks ? 'Ocultar tarefas anteriores' : `Ver tarefas anteriores (${impactAnalysis.length - 3})`}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="card text-center text-muted text-sm" style={{ padding: 24 }}>
                            Complete tarefas para ver sua análise 80/20
                        </div>
                    )}
                </div>

                {/* Reflexões Noturnas */}
                <div className="mt-6 animate-slideUp" style={{ animationDelay: '300ms' }}>
                    <div className="section-header">
                        <span className="section-icon">🌙</span>
                        <span className="section-title">REFLEXÕES NOTURNAS</span>
                    </div>
                    {recentReflections.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {recentReflections.map((r, i) => (
                                <div key={i} className="card" style={{ padding: '16px' }}>
                                    <div className="text-xs text-secondary mb-2 flex items-center justify-between">
                                        <span>{(() => {
                                            const parts = r.date.split('-');
                                            if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                                            return r.date;
                                        })()}</span>
                                    </div>
                                    <p className="text-sm italic text-primary" style={{ lineHeight: 1.6 }}>"{r.reflexaoNoturna}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center text-muted text-sm flex flex-col items-center gap-2" style={{ padding: 32 }}>
                            <span style={{ fontSize: '2rem' }}>💭</span>
                            Esvazie sua mente hoje no check-in noturno para revisar aqui.
                        </div>
                    )}
                </div>

                {/* Premium gate for 30-day analysis */}
                {!isPremium() && (
                    <div className="premium-gate mt-6">
                        <div className="card flex flex-col justify-center items-center" style={{ padding: 24, opacity: 0.3, filter: 'blur(3px)', minHeight: 180 }}>
                            <p className="text-sm">Análise de 30 dias com padrões detalhados...</p>
                        </div>
                        <div className="premium-gate-overlay">
                            <span style={{ fontSize: '1.5rem' }}>🔒</span>
                            <p className="text-sm font-semibold">Gráfico 80/20 Completo</p>
                            <p className="text-xs text-secondary" style={{ maxWidth: 280 }}>
                                Analise TODAS suas tarefas dos últimos 30 dias e identifique o que gera mais resultado.
                            </p>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setCurrentPage('settings')}
                            >
                                Desbloquear com Premium
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="app-nav">
                <button className="nav-item" onClick={() => setCurrentPage('dashboard')}>
                    <span className="nav-icon">🧭</span><span>Bússola</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('checkin')}>
                    <span className="nav-icon">✏️</span><span>Check-in</span>
                </button>
                <button className="nav-item active" onClick={() => setCurrentPage('evolution')}>
                    <span className="nav-icon">📊</span><span>Evolução</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('experiments')}>
                    <span className="nav-icon">🔬</span><span>TAE</span>
                </button>
                <button className="nav-item" onClick={() => setCurrentPage('settings')}>
                    <span className="nav-icon">⚙️</span><span>Config</span>
                </button>
            </nav>
        </div>
    );
}
