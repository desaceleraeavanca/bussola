import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Evolution() {
    const { checkins, setCurrentPage, isPremium } = useApp();

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
        const taskMap = new Map<string, { text: string; completions: number; total: number }>();
        checkins.forEach(c => {
            c.prioridades.forEach(p => {
                const key = p.text.toLowerCase().trim();
                const existing = taskMap.get(key) || { text: p.text, completions: 0, total: 0 };
                existing.total++;
                if (p.completed) existing.completions++;
                taskMap.set(key, existing);
            });
        });
        return Array.from(taskMap.values())
            .sort((a, b) => b.completions - a.completions)
            .slice(0, 5);
    }, [checkins]);

    const totalCheckins = checkins.length;
    const totalTasks = checkins.reduce((sum, c) => sum + c.tarefasCompletadas, 0);
    const avgEnergy = chartData.filter(d => d.energia > 0).length > 0
        ? (chartData.filter(d => d.energia > 0).reduce((s, d) => s + d.energia, 0) / chartData.filter(d => d.energia > 0).length).toFixed(1)
        : '—';

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

                {/* 80/20 Impact */}
                <div className="mt-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
                    <div className="section-header">
                        <span className="section-icon">🎯</span>
                        <span className="section-title">Impacto 80/20</span>
                    </div>
                    {impactAnalysis.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {impactAnalysis.map((task, i) => (
                                <div key={i} className="card" style={{ padding: '12px 16px' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold" style={{ flex: 1 }}>
                                            {i + 1}. "{task.text}"
                                        </span>
                                        <span className="badge badge-gold text-xs">
                                            {task.completions}/{task.total}
                                        </span>
                                    </div>
                                    {/* Completion bar */}
                                    <div className="progress-bar mt-2">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${(task.completions / Math.max(task.total, 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center text-muted text-sm" style={{ padding: 24 }}>
                            Complete tarefas para ver sua análise 80/20
                        </div>
                    )}
                </div>

                {/* Premium gate for 30-day analysis */}
                {!isPremium() && (
                    <div className="premium-gate mt-6">
                        <div className="card" style={{ padding: 24, opacity: 0.3, filter: 'blur(2px)' }}>
                            <p className="text-sm">Análise de 30 dias com padrões detalhados...</p>
                        </div>
                        <div className="premium-gate-overlay">
                            <span style={{ fontSize: '1.5rem' }}>🔒</span>
                            <p className="text-sm font-semibold">Gráfico 80/20 Completo</p>
                            <p className="text-xs text-secondary" style={{ maxWidth: 280 }}>
                                Analise TODAS suas tarefas dos últimos 30 dias e identifique o que gera mais resultado.
                            </p>
                            <button className="btn btn-primary btn-sm">Desbloquear com Premium</button>
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
