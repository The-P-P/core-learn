export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export type TourRoute = "/" | "/notes" | "/settings" | "subject";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** Valor de `data-tour`. Null = tooltip centralizado sem spotlight. */
  target: string | null;
  route: TourRoute;
  placement: TourPlacement;
  /** Se true, o passo só entra no tour quando existe ao menos uma matéria. */
  requiresSubject?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Core Learn",
    body: "Seu guia pré-Medicina fica organizado em matéria → bloco → tópico. Tudo é offline, sem login — o progresso fica neste computador.",
    target: null,
    route: "/",
    placement: "center",
  },
  {
    id: "nav",
    title: "Navegação",
    body: "Use a barra superior para ir ao Dashboard, à biblioteca de Resumos ou às Configurações.",
    target: "nav",
    route: "/",
    placement: "bottom",
  },
  {
    id: "progress",
    title: "Progresso geral",
    body: "Aqui você vê a porcentagem do guia e quantos tópicos já concluiu. Marcos como 25% e 50% são celebrados automaticamente.",
    target: "progress",
    route: "/",
    placement: "bottom",
  },
  {
    id: "habits",
    title: "Meta e sequência",
    body: "Acompanhe a meta diária de estudo e a sequência de dias ativos. Ajuste meta e lembretes em Configurações.",
    target: "habits",
    route: "/",
    placement: "bottom",
  },
  {
    id: "subjects",
    title: "Matérias",
    body: "Cada card é uma matéria. Clique para estudar. Use Adicionar matéria para criar uma nova, ou os ícones para editar e excluir.",
    target: "subjects",
    route: "/",
    placement: "top",
  },
  {
    id: "reviews",
    title: "Revisões pendentes hoje",
    body: "Quando um tópico vence a data de revisão, ele aparece aqui. Revisei avança o intervalo; Preciso rever de novo recomeça em 7 dias.",
    target: "reviews",
    route: "/",
    placement: "top",
  },
  {
    id: "subject-filters",
    title: "Dentro da matéria",
    body: "Filtre por Todos, Pendentes, Concluídos, Prioridade alta ou Para revisar. Em Concluídos você seleciona tópicos e coloca na fila de revisão.",
    target: "subject-filters",
    route: "subject",
    placement: "bottom",
    requiresSubject: true,
  },
  {
    id: "subject-topic",
    title: "Tópico",
    body: "Marque o checkbox ao concluir. Ajuste prioridade e dificuldade nos chips ao lado — isso ajuda a priorizar o que estudar.",
    target: "subject-topic",
    route: "subject",
    placement: "bottom",
    requiresSubject: true,
  },
  {
    id: "subject-content",
    title: "Conteúdo didático",
    body: "O ícone de livro abre o material do tópico (Markdown). Use para estudar o essencial; você também pode editar e complementar.",
    target: "subject-content",
    route: "subject",
    placement: "left",
    requiresSubject: true,
  },
  {
    id: "subject-summary",
    title: "Resumo do tópico",
    body: "O ícone de documento abre o editor de resumo (Markdown). O texto salva sozinho e depois aparece na página Resumos.",
    target: "subject-summary",
    route: "subject",
    placement: "left",
    requiresSubject: true,
  },
  {
    id: "notes",
    title: "Biblioteca de resumos",
    body: "Busque por tópico, matéria ou conteúdo. Abra um resumo para editar, pré-visualizar ou exportar em PDF.",
    target: "notes",
    route: "/notes",
    placement: "bottom",
  },
  {
    id: "backup",
    title: "Backup do progresso",
    body: "Exporte um arquivo JSON com progresso, resumos e histórico — ou importe um backup anterior. Assim você não perde o estudo.",
    target: "backup",
    route: "/settings",
    placement: "top",
  },
];

export function visibleTourSteps(hasSubjects: boolean): TourStep[] {
  return TOUR_STEPS.filter((step) => hasSubjects || !step.requiresSubject);
}

export function tourTargetSelector(target: string): string {
  return `[data-tour="${target}"]`;
}
