import { type SubjectCardData, normalizeSubjectMeta } from "@/lib/frontend/subjects";

export type DashboardUser = {
  id: string;
  email: string;
  username: string;
  level: number;
  xp: number;
};

export type DashboardStats = {
  weeklyTopics: number;
  totalXp: number;
  weeklyXp?: number;
  weeklyGrowth?: number;
  badges?: number;
};

export type PendingSubject = SubjectCardData;

export type RankingItem = {
  id: string;
  username: string;
  level: number;
  xp: number;
  isCurrentUser: boolean;
};

export type DashboardPayload = {
  user: DashboardUser;
  stats: DashboardStats;
  pendingSubjects: PendingSubject[];
  ranking: RankingItem[];
};

export function mapDashboardPayload(
  payload: DashboardPayload,
): DashboardPayload {
  return {
    ...payload,
    pendingSubjects: payload.pendingSubjects.map(normalizeSubjectMeta),
  };
}
