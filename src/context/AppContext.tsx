import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, DailyCheckin, Experiment, Page } from '../types';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function createDefaultUser(): User {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
        id: generateId(),
        createdAt: now.toISOString(),
        onboardingCompleted: false,
        subscription: 'free',
        trialEndsAt: trialEnd.toISOString(),
    };
}

interface AppState {
    user: User;
    checkins: DailyCheckin[];
    experiments: Experiment[];
    currentPage: Page;
}

interface AppContextValue extends AppState {
    setCurrentPage: (page: Page) => void;
    completeOnboarding: () => void;
    addCheckin: (checkin: Omit<DailyCheckin, 'id' | 'userId'>) => void;
    updateCheckin: (id: string, updates: Partial<DailyCheckin>) => void;
    getTodayCheckin: () => DailyCheckin | undefined;
    togglePriority: (checkinId: string, priorityId: string) => void;
    editPriority: (checkinId: string, priorityId: string, newText: string) => void;
    addPriority: (checkinId: string, text: string) => void;
    removePriority: (checkinId: string, priorityId: string) => void;
    addExperiment: (experiment: Omit<Experiment, 'id' | 'userId' | 'createdAt' | 'anotacoes'>) => void;
    updateExperiment: (id: string, updates: Partial<Experiment>) => void;
    removeExperiment: (id: string) => void;
    getTrialDaysLeft: () => number;
    isPremium: () => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
    try {
        const saved = localStorage.getItem('bussola_do_caos_state');
        if (saved) {
            const state = JSON.parse(saved);
            return { ...state, currentPage: state.user.onboardingCompleted ? 'dashboard' : 'onboarding' };
        }
    } catch { /* ignore */ }
    return {
        user: createDefaultUser(),
        checkins: [],
        experiments: [],
        currentPage: 'onboarding',
    };
}

function saveState(state: AppState) {
    localStorage.setItem('bussola_do_caos_state', JSON.stringify({
        user: state.user,
        checkins: state.checkins,
        experiments: state.experiments,
    }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>(loadState);

    useEffect(() => { saveState(state); }, [state]);

    const setCurrentPage = useCallback((page: Page) => {
        setState(prev => ({ ...prev, currentPage: page }));
    }, []);

    const completeOnboarding = useCallback(() => {
        setState(prev => ({
            ...prev,
            user: { ...prev.user, onboardingCompleted: true },
            currentPage: 'dashboard',
        }));
    }, []);

    const addCheckin = useCallback((checkin: Omit<DailyCheckin, 'id' | 'userId'>) => {
        setState(prev => ({
            ...prev,
            checkins: [...prev.checkins, { ...checkin, id: generateId(), userId: prev.user.id }],
        }));
    }, []);

    const updateCheckin = useCallback((id: string, updates: Partial<DailyCheckin>) => {
        setState(prev => ({
            ...prev,
            checkins: prev.checkins.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
    }, []);

    const getTodayCheckin = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        return state.checkins.find(c => c.date === today);
    }, [state.checkins]);

    const togglePriority = useCallback((checkinId: string, priorityId: string) => {
        setState(prev => ({
            ...prev,
            checkins: prev.checkins.map(c => {
                if (c.id !== checkinId) return c;
                return {
                    ...c,
                    prioridades: c.prioridades.map(p =>
                        p.id === priorityId ? { ...p, completed: !p.completed } : p
                    ),
                    tarefasCompletadas: c.prioridades.filter(p =>
                        p.id === priorityId ? !p.completed : p.completed
                    ).length,
                };
            }),
        }));
    }, []);

    const editPriority = useCallback((checkinId: string, priorityId: string, newText: string) => {
        setState(prev => ({
            ...prev,
            checkins: prev.checkins.map(c => {
                if (c.id !== checkinId) return c;
                return {
                    ...c,
                    prioridades: c.prioridades.map(p =>
                        p.id === priorityId ? { ...p, text: newText } : p
                    ),
                };
            }),
        }));
    }, []);

    const addPriority = useCallback((checkinId: string, text: string) => {
        setState(prev => ({
            ...prev,
            checkins: prev.checkins.map(c => {
                if (c.id !== checkinId) return c;
                return {
                    ...c,
                    prioridades: [...c.prioridades, { id: generateId(), text, completed: false }],
                };
            }),
        }));
    }, []);

    const removePriority = useCallback((checkinId: string, priorityId: string) => {
        setState(prev => ({
            ...prev,
            checkins: prev.checkins.map(c => {
                if (c.id !== checkinId) return c;
                const newPrioridades = c.prioridades.filter(p => p.id !== priorityId);
                return {
                    ...c,
                    prioridades: newPrioridades,
                    tarefasCompletadas: newPrioridades.filter(p => p.completed).length,
                };
            }),
        }));
    }, []);

    const addExperiment = useCallback((experiment: Omit<Experiment, 'id' | 'userId' | 'createdAt' | 'anotacoes'>) => {
        setState(prev => ({
            ...prev,
            experiments: [...prev.experiments, {
                ...experiment,
                id: generateId(),
                userId: prev.user.id,
                createdAt: new Date().toISOString(),
                anotacoes: [],
            }],
        }));
    }, []);

    const updateExperiment = useCallback((id: string, updates: Partial<Experiment>) => {
        setState(prev => ({
            ...prev,
            experiments: prev.experiments.map(e => e.id === id ? { ...e, ...updates } : e),
        }));
    }, []);

    const removeExperiment = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            experiments: prev.experiments.filter(e => e.id !== id),
        }));
    }, []);

    const getTrialDaysLeft = useCallback(() => {
        const end = new Date(state.user.trialEndsAt).getTime();
        const now = Date.now();
        return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
    }, [state.user.trialEndsAt]);

    const isPremium = useCallback(() => {
        return state.user.subscription === 'premium' || getTrialDaysLeft() > 0;
    }, [state.user.subscription, getTrialDaysLeft]);

    const value: AppContextValue = {
        ...state,
        setCurrentPage,
        completeOnboarding,
        addCheckin,
        updateCheckin,
        getTodayCheckin,
        togglePriority,
        editPriority,
        addPriority,
        removePriority,
        addExperiment,
        updateExperiment,
        removeExperiment,
        getTrialDaysLeft,
        isPremium,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
