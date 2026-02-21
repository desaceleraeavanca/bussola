export interface User {
  id: string;
  createdAt: string;
  onboardingCompleted: boolean;
  subscription: 'free' | 'premium';
  trialEndsAt: string;
}

export interface DailyCheckin {
  id: string;
  userId: string;
  date: string;
  energiaFisica: number; // 1-5
  energiaMental: number; // 1-5
  energiaEmocional: number; // 1-5
  nivelCaos: 'baixo' | 'medio' | 'alto';
  prioridades: Priority[];
  reflexaoNoturna?: string;
  tarefasCompletadas: number;
  energiaFisicaNoturna?: number;
  energiaMentalNoturna?: number;
  energiaEmocionalNoturna?: number;
  eveningCompleted?: boolean;
}

export interface Priority {
  id: string;
  text: string;
  completed: boolean;
}

export interface ExperimentNote {
  id: string;
  date: string;
  texto: string;
  fase?: 'teste' | 'ajuste' | 'escala';
}

export interface Experiment {
  id: string;
  userId: string;
  createdAt: string;
  nome: string;
  hipotese: string;
  duracao: number; // days
  fase: 'teste' | 'ajuste' | 'escala';
  anotacoes: ExperimentNote[];
  resultado?: string;
  proximosPassos?: string;
  completedAt?: string;
}

export interface OnboardingData {
  energia: 'esgotado' | 'ok' | 'cheio';
  dia: 'caotico' | 'meio_termo' | 'tranquilo';
  problema: string;
}

export type Page = 'onboarding' | 'dashboard' | 'checkin' | 'evolution' | 'experiments' | 'settings';
