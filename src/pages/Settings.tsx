import { useApp } from '../context/AppContext';
import { Trash2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
    const { user, getTrialDaysLeft, setCurrentPage } = useApp();
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

                {/* Upgrade */}
                {user.subscription === 'free' && (
                    <div className="card card-glow mb-4" style={{ textAlign: 'center', padding: 24 }}>
                        <span style={{ fontSize: '2rem' }}>💎</span>
                        <h3 style={{ fontSize: '1.063rem', fontWeight: 700, marginTop: 8 }}>
                            Assine o Premium
                        </h3>
                        <p className="text-sm text-secondary mt-2 mb-4" style={{ lineHeight: 1.6 }}>
                            Histórico ilimitado, experimentos ilimitados, alertas de burnout, e muito mais.
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
                        análise 80/20 e o ciclo TAE (Teste-Ajuste-Escala) para
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
