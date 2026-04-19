import { type SubjectCardData } from "@/lib/constants";
import { normalizeSubjectMeta, normalizeSubjectTitle } from "@/lib/frontend/subjects";

export type Objective = { text: string; xp: string };

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
  weeklyXp: number;
  weeklyGrowth: number;
  badges: number;
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

const subjectObjectives: Record<string, Objective[]> = {
  Literatura: [
    { text: "Quais são as diferenças dos três estágios do modernismo?", xp: "100XP" },
    { text: "Analisar características do Realismo e Naturalismo", xp: "80XP" },
    { text: "Identificar recursos estilísticos em poesia", xp: "90XP" },
    { text: "Comparar autores do Modernismo brasileiro", xp: "95XP" },
    { text: "Relacionar movimentos literários e contexto histórico", xp: "85XP" },
    { text: "Interpretar trechos de obras clássicas brasileiras", xp: "75XP" },
  ],
  "Produção de texto": [
    { text: "Concluir uma redação dissertativa-argumentativa", xp: "100XP" },
    { text: "Estruturar argumentos convincentes", xp: "85XP" },
    { text: "Revisar coerência e coesão textual", xp: "75XP" },
    { text: "Reforçar tese e conclusão da redação", xp: "90XP" },
    { text: "Melhorar repertório sociocultural da redação", xp: "95XP" },
    { text: "Praticar propostas de intervenção", xp: "80XP" },
  ],
  Matemática: [
    { text: "Resolver equações de segundo grau", xp: "90XP" },
    { text: "Dominar aplicações de funções trigonométricas", xp: "95XP" },
    { text: "Praticar problemas de geometria analítica", xp: "85XP" },
    { text: "Revisar proporções e porcentagens", xp: "80XP" },
    { text: "Treinar estatística com gráficos e tabelas", xp: "75XP" },
    { text: "Resolver sistemas lineares com confiança", xp: "90XP" },
  ],
  Biologia: [
    { text: "Estudar fases da mitose e meiose", xp: "100XP" },
    { text: "Compreender metabolismo celular", xp: "90XP" },
    { text: "Analisar genética mendeliana", xp: "85XP" },
    { text: "Relacionar ecologia e cadeia alimentar", xp: "80XP" },
    { text: "Revisar organelas e suas funções", xp: "75XP" },
    { text: "Comparar ciclos de reprodução dos seres vivos", xp: "95XP" },
  ],
  Química: [
    { text: "Balancear equações químicas", xp: "80XP" },
    { text: "Calcular mol e estequiometria", xp: "95XP" },
    { text: "Compreender ligações químicas", xp: "85XP" },
    { text: "Revisar soluções e concentração", xp: "90XP" },
    { text: "Distinguir funções inorgânicas básicas", xp: "75XP" },
    { text: "Resolver problemas de pH e pOH", xp: "100XP" },
  ],
  História: [
    { text: "Estudar a formação do Brasil colonial", xp: "100XP" },
    { text: "Analisar a História Mundial Contemporânea", xp: "90XP" },
    { text: "Comparar impérios, revoluções e independências", xp: "85XP" },
    { text: "Revisar a Era Vargas e a República Velha", xp: "95XP" },
    { text: "Conectar a história do Brasil e a história global", xp: "80XP" },
    { text: "Analisar movimentos sociais no século XX", xp: "75XP" },
  ],
  Geografia: [
    { text: "Identificar formações geológicas", xp: "80XP" },
    { text: "Analisar dinâmica climática", xp: "90XP" },
    { text: "Estudar desenvolvimento econômico regional", xp: "85XP" },
    { text: "Relacionar urbanização e impactos ambientais", xp: "95XP" },
    { text: "Comparar biomas brasileiros", xp: "75XP" },
    { text: "Interpretar mapas, escalas e coordenadas", xp: "100XP" },
  ],
};

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickSubjectObjective(subjectName: string, userSeed: string, salt: number): Objective | null {
  const objectives = subjectObjectives[subjectName];

  if (!objectives?.length) {
    return null;
  }

  const hashValue = stableHash(`${userSeed}:${subjectName}:${salt}`);
  return objectives[hashValue % objectives.length];
}

export function mapDashboardPayload(
  payload: DashboardPayload,
  tempSubjects: SubjectCardData[],
): DashboardPayload {
  return {
    ...payload,
    pendingSubjects: [...payload.pendingSubjects.map(normalizeSubjectMeta), ...tempSubjects.map(normalizeSubjectMeta)],
  };
}

export function generateObjectives(userSeed: string, subjects: PendingSubject[]): Objective[] {
  const objectives: Objective[] = [];
  const usedTexts = new Set<string>();
  const subjectNames = subjects.map((subject) => normalizeSubjectTitle(subject.title));

  for (let index = 0; index < subjectNames.length && objectives.length < 2; index += 1) {
    const picked = pickSubjectObjective(subjectNames[index], userSeed, index);

    if (picked && !usedTexts.has(picked.text)) {
      objectives.push(picked);
      usedTexts.add(picked.text);
    }
  }

  if (objectives.length < 2 && subjectNames.length > 0) {
    const firstSubjectName = subjectNames[0];

    for (let salt = 1; salt < 6 && objectives.length < 2; salt += 1) {
      const picked = pickSubjectObjective(firstSubjectName, userSeed, salt);

      if (picked && !usedTexts.has(picked.text)) {
        objectives.push(picked);
        usedTexts.add(picked.text);
      }
    }
  }

  if (objectives.length === 0) {
    objectives.push({ text: "Comece adicionando seus primeiros tópicos de estudo", xp: "Ganhe XP" });
  }

  return objectives;
}
