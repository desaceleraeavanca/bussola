import { useApp } from '../context/AppContext';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
    const { user, getTrialDaysLeft, setCurrentPage, updateUser } = useApp();
    const [showConfirm, setShowConfirm] = useState(false);
    const trialDays = getTrialDaysLeft();

    const handleReset = () => {
        localStorage.removeItem('bussola_do_caos_state');
        window.location.reload();
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('dashboard')}>
                    ← Voltar
                </button>
                <span className="text-sm font-semibold">⚙️ Configurações</span>
                <div style={{ width: 60 }} />
            </header>

            <div className="app-content">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 24 }}>Configurações</h2>

                {/* Account Info */}
                <div className="card mb-4">
                    <div className="section-header mb-3">
                        <span className="section-icon">👤</span>
                        <span className="section-title">Conta</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-secondary">Plano</span>
                            <span className={`badge ${user.subscription === 'premium' ? 'badge-gold' : 'badge-info'}`}>
                                {user.subscription === 'premium' ? '💎 Premium' : '🆓 Gratuito'}
                            </span>
                        </div>
                        {user.subscription === 'free' && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-secondary">Trial restante</span>
                                <span className={`text-sm font-semibold ${trialDays <= 2 ? 'text-danger' : 'text-accent'}`}>
                                    {trialDays} dias
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-secondary">Membro desde</span>
                            <span className="text-sm">
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* DEV CONTROLS */}
                <div className="card mb-4" style={{ borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(168,85,247,0.05)' }}>
                    <div className="section-header mb-3">
                        <span className="section-icon">🛠️</span>
                        <span className="section-title text-accent">DEV CONTROLS</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem' }}
                            onClick={() => {
                                const past = new Date();
                                past.setDate(past.getDate() - 10);
                                updateUser({ subscription: 'free', trialEndsAt: past.toISOString() });
                            }}
                        >
                            Gratuito (expirado)
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem' }}
                            onClick={() => {
                                const future = new Date();
                                future.setDate(future.getDate() + 7);
                                updateUser({ subscription: 'free', trialEndsAt: future.toISOString() });
                            }}
                        >
                            Gratuito (7 dias)
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem', background: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}
                            onClick={() => {
                                updateUser({ subscription: 'premium' });
                            }}
                        >
                            Premium Ativo
                        </button>
                    </div>
                </div>

                {/* Limites da Conta */}
                {user.subscription === 'free' && (
                    <div className="card mb-4" style={{ backgroundColor: 'rgba(17, 24, 39, 0.4)' }}>
                        <div className="section-header mb-3">
                            <span className="section-icon">🆓</span>
                            <span className="section-title">VERSÃO GRATUITA (7 dias)</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <span className="text-success">✅</span> Check-in matinal e noturno
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <span className="text-success">✅</span> Dashboard de prioridades
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <span className="text-success">✅</span> Gráfico de energia (7 dias)
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <span className="text-success">✅</span> 1 experimento TAE ativo
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary">
                                <span className="text-success">✅</span> Insights básicos
                            </div>
                        </div>
                    </div>
                )}

                {/* Upgrade */}
                {user.subscription === 'free' && (
                    <div className="card card-glow mb-4" style={{ textAlign: 'center', padding: 24 }}>
                        <span style={{ fontSize: '2rem' }}>💎</span>
                        <h3 style={{ fontSize: '1.063rem', fontWeight: 700, marginTop: 8 }}>
                            Assine o Premium
                        </h3>
                        <p className="text-sm text-secondary mt-2 mb-4" style={{ lineHeight: 1.6 }}>
                            Desbloqueie todo o poder da bússola: gráfico 80/20 completo com 30 dias de histórico, infinitos experimentos TAE, predição de burnout avançada e mais.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button className="btn btn-primary btn-block">
                                R$ 19,90/mês
                            </button>
                            <button className="btn btn-secondary btn-block">
                                R$ 197/ano (2 meses grátis)
                            </button>
                        </div>
                    </div>
                )}

                {/* About the Method */}
                <div className="card mb-4">
                    <div className="section-header mb-3">
                        <span className="section-icon">📚</span>
                        <span className="section-title">Sobre o Método</span>
                    </div>
                    <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
                        A Bússola do Caos é baseada no livro de produtividade caótica.
                        O método combina o Ritual da Bússola (priorização diária),
                        análise 80/20 e o ciclo TAE (Teste-Ajuste-Escale) para
                        navegação produtiva no caos.
                    </p>
                    <button className="btn btn-secondary btn-sm btn-block mt-3">
                        Comprar ebook — R$ 47
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                    <div className="section-header mb-3">
                        <span className="section-icon">⚠️</span>
                        <span className="section-title">Zona de Perigo</span>
                    </div>
                    {!showConfirm ? (
                        <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(true)}>
                            <Trash2 size={14} /> Resetar todos os dados
                        </button>
                    ) : (
                        <div className="animate-slideUp">
                            <p className="text-sm text-danger mb-3">
                                Tem certeza? Isso apagará TODOS os seus dados permanentemente.
                            </p>
                            <div className="flex gap-2">
                                <button className="btn btn-danger btn-sm" onClick={handleReset}>
                                    <Trash2 size={14} /> Sim, resetar tudo
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>
                                    Cancelar
                                </button>
                            </div>
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
                <button className="nav-item" onClick={() => setCurrentPage('experiments')}>
                    <span className="nav-icon">🔬</span><span>TAE</span>
                </button>
                <button className="nav-item active" onClick={() => setCurrentPage('settings')}>
                    <span className="nav-icon">⚙️</span><span>Config</span>
                </button>
            </nav>
        </div>
    );
}
