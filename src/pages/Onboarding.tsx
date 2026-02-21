import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check } from 'lucide-react';
import type { OnboardingData, Priority } from '../types';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export default function Onboarding() {
    const { completeOnboarding, addCheckin } = useApp();
    const [step, setStep] = useState(0);
    const [diagnosis, setDiagnosis] = useState<OnboardingData>({
        energia: 'ok',
        dia: 'meio_termo',
        problema: '',
    });
    const [priorities, setPriorities] = useState<string[]>(['', '', '']);

    const totalSteps = 4;

    const getRecommendation = () => {
        const energyMap = { esgotado: 'BAIXA', ok: 'MÉDIA', cheio: 'ALTA' };
        const chaosMap = { caotico: 'CAÓTICO', meio_termo: 'MEIO TERMO', tranquilo: 'TRANQUILO' };
        const energia = energyMap[diagnosis.energia];
        const dia = chaosMap[diagnosis.dia];

        let rec = '2 prioridades essenciais hoje';
        if (diagnosis.energia === 'esgotado' || diagnosis.dia === 'caotico') {
            rec = '1 prioridade essencial hoje';
        } else if (diagnosis.energia === 'cheio' && diagnosis.dia === 'tranquilo') {
            rec = '3 prioridades para aproveitar o dia';
        }

        return { energia, dia, rec };
    };

    const handleFinish = () => {
        const validPriorities: Priority[] = priorities
            .filter(p => p.trim())
            .map(text => ({ id: generateId(), text, completed: false }));

        if (validPriorities.length === 0) return;

        const energyMap = { esgotado: 1, ok: 3, cheio: 5 };
        const chaosMap = { caotico: 'alto' as const, meio_termo: 'medio' as const, tranquilo: 'baixo' as const };
        const energyLevel = energyMap[diagnosis.energia];

        addCheckin({
            date: new Date().toISOString().split('T')[0],
            energiaFisica: energyLevel,
            energiaMental: energyLevel,
            energiaEmocional: energyLevel,
            nivelCaos: chaosMap[diagnosis.dia],
            prioridades: validPriorities,
            tarefasCompletadas: 0,
        });

        setStep(3);
    };

    return (
        <div className="app-container" style={{ justifyContent: 'center' }}>
            {/* Progress bar */}
            <div style={{ padding: '20px 20px 0' }}>
                <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
                </div>
                <div className="text-xs text-muted mt-2 text-center">
                    Passo {step + 1} de {totalSteps}
                </div>
            </div>

            <div className="app-content animate-slideUp" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                {/* Step 0: Welcome */}
                {step === 0 && (
                    <div className="text-center" style={{ padding: '20px 0' }}>
                        <div className="animate-float" style={{ fontSize: '4rem', marginBottom: 16 }}>🧭</div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
                            Bem-vindo à <br />
                            <span className="text-accent">Bússola do Caos</span>
                        </h1>
                        <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: 1.7, maxWidth: 340, margin: '0 auto 32px' }}>
                            Sua ferramenta para navegar na produtividade caótica.
                            Não vamos prometer que você vai controlar tudo.
                            Mas vamos te ajudar a focar no que importa, <strong className="text-primary">APESAR do caos</strong>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button className="btn btn-primary btn-lg btn-block" onClick={() => setStep(1)}>
                                Começar minha bússola
                            </button>
                            <button className="btn btn-ghost" onClick={() => setStep(1)}>
                                Já tenho conta
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: Quick Diagnosis */}
                {step === 1 && (
                    <div className="animate-slideInRight">
                        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: 4 }}>
                            Para calibrar sua bússola
                        </h2>
                        <p className="text-secondary mb-6" style={{ fontSize: '0.938rem' }}>
                            Responda rápido — confie no instinto:
                        </p>

                        {/* Energy */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-secondary mb-3" style={{ display: 'block' }}>
                                1. Como está sua energia AGORA?
                            </label>
                            <div className="option-group">
                                {([
                                    { value: 'esgotado', emoji: '😫', label: 'Esgotado' },
                                    { value: 'ok', emoji: '😐', label: 'Ok' },
                                    { value: 'cheio', emoji: '⚡', label: 'Cheio' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`option-card ${diagnosis.energia === opt.value ? 'selected' : ''}`}
                                        onClick={() => setDiagnosis(d => ({ ...d, energia: opt.value }))}
                                    >
                                        <span className="option-emoji">{opt.emoji}</span>
                                        <span className="option-label">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Day */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-secondary mb-3" style={{ display: 'block' }}>
                                2. Como está seu dia HOJE?
                            </label>
                            <div className="option-group">
                                {([
                                    { value: 'caotico', emoji: '🌊', label: 'Caótico' },
                                    { value: 'meio_termo', emoji: '🌤️', label: 'Meio termo' },
                                    { value: 'tranquilo', emoji: '☀️', label: 'Tranquilo' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`option-card ${diagnosis.dia === opt.value ? 'selected' : ''}`}
                                        onClick={() => setDiagnosis(d => ({ ...d, dia: opt.value }))}
                                    >
                                        <span className="option-emoji">{opt.emoji}</span>
                                        <span className="option-label">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Problem */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-secondary mb-3" style={{ display: 'block' }}>
                                3. Principal problema atual?
                            </label>
                            <div className="checkbox-group">
                                {[
                                    'Muitas interrupções',
                                    'Não sei por onde começar',
                                    'Procrastinação',
                                    'Burnout/exaustão',
                                ].map(prob => (
                                    <button
                                        key={prob}
                                        className={`checkbox-item ${diagnosis.problema === prob ? 'selected' : ''}`}
                                        onClick={() => setDiagnosis(d => ({ ...d, problema: prob }))}
                                    >
                                        <span className="check-box">
                                            {diagnosis.problema === prob && <Check size={14} />}
                                        </span>
                                        {prob}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>
                            Próximo →
                        </button>
                    </div>
                )}

                {/* Step 2: First Ritual */}
                {step === 2 && (
                    <div className="animate-slideInRight">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: '1.5rem' }}>🎯</span>
                            <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Seu Ritual da Bússola</h2>
                        </div>
                        <p className="text-secondary mb-4" style={{ fontSize: '0.938rem' }}>
                            Com base no seu estado AGORA, vamos definir:
                        </p>

                        <div className="card card-glow mb-6" style={{ padding: 16 }}>
                            <p className="text-sm">
                                Sua energia está <strong className="text-accent">{getRecommendation().energia}</strong>{' '}
                                + dia <strong className="text-accent">{getRecommendation().dia}</strong>
                            </p>
                            <p className="text-sm mt-1">
                                → Recomendamos: <strong className="text-primary">{getRecommendation().rec}</strong>
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-secondary mb-2" style={{ display: 'block' }}>
                                    Sua prioridade #1 de hoje: <span className="text-danger">*</span>
                                </label>
                                <input
                                    className="input"
                                    placeholder='Ex: "Fechar proposta do cliente X"'
                                    value={priorities[0]}
                                    onChange={e => setPriorities(p => [e.target.value, p[1], p[2]])}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>
                                    Prioridade #2 (opcional):
                                </label>
                                <input
                                    className="input"
                                    placeholder="Opcional"
                                    value={priorities[1]}
                                    onChange={e => setPriorities(p => [p[0], e.target.value, p[2]])}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted mb-2" style={{ display: 'block' }}>
                                    Prioridade #3 (opcional):
                                </label>
                                <input
                                    className="input"
                                    placeholder="Opcional"
                                    value={priorities[2]}
                                    onChange={e => setPriorities(p => [p[0], p[1], e.target.value])}
                                />
                            </div>
                        </div>

                        <div className="card mb-6" style={{ padding: 12 }}>
                            <p className="text-sm text-secondary">
                                💡 <strong>Dica:</strong> No caos, menos é mais. Você sempre pode adicionar depois.
                            </p>
                        </div>

                        <button
                            className="btn btn-primary btn-block"
                            disabled={!priorities[0].trim()}
                            onClick={handleFinish}
                        >
                            Salvar e começar →
                        </button>
                    </div>
                )}

                {/* Step 3: Tour */}
                {step === 3 && (
                    <div className="text-center animate-slideUp">
                        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✨</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
                            Pronto! Sua Bússola está <span className="text-accent">calibrada</span>.
                        </h2>
                        <p className="text-secondary mb-6" style={{ fontSize: '0.938rem', lineHeight: 1.7 }}>
                            Você acaba de fazer seu primeiro <strong className="text-primary">"Ritual da Bússola"</strong>
                            {' '}— o exercício mais importante do método.
                        </p>

                        <div className="flex flex-col gap-3 mb-8 stagger" style={{ textAlign: 'left' }}>
                            {[
                                { icon: '📍', text: 'Ver suas prioridades (sempre visíveis)' },
                                { icon: '✅', text: 'Marcar tarefas como feitas' },
                                { icon: '📊', text: 'Acompanhar sua energia em tempo real' },
                            ].map((item, i) => (
                                <div key={i} className="card animate-slideInRight" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                                    <span className="text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-secondary text-sm mb-6">
                            No fim do dia, faremos um check-in rápido.
                        </p>

                        <button className="btn btn-primary btn-lg btn-block" onClick={completeOnboarding}>
                            Ver meu dashboard →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
