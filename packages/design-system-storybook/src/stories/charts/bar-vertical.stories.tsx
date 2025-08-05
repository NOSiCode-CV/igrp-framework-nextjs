import type { StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPVerticalBarChart,
  type IGRPVerticalBarChartProps,
} from '@igrp/igrp-framework-react-design-system';

export default {
  title: 'Components/Charts/Bar/Vertical',
  component: IGRPVerticalBarChart,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'auto'],
      defaultValue: 'md',
    },
    showGrid: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    hideAxis: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    showXAxis: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    legendPosition: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left', 'none'],
      defaultValue: 'none',
    },
    barRadius: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      defaultValue: 5,
    },
    stacked: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    tooltipIndicator: {
      control: { type: 'select' },
      options: ['line', 'dot'],
      defaultValue: 'line',
    },
  },
};

const Template: StoryFn<IGRPVerticalBarChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPVerticalBarChart {...args} />
  </div>
);

const dadosVendaCategorias = [
  { categoria: 'Eletrônicos', vendas: 1250 },
  { categoria: 'Vestuário', vendas: 980 },
  { categoria: 'Casa & Jardim', vendas: 750 },
  { categoria: 'Esportes', vendas: 480 },
  { categoria: 'Livros', vendas: 320 },
];

const dadosDesempenhoEquipe = [
  { equipe: 'Marketing', realizado: 92, meta: 100 },
  { equipe: 'Vendas', realizado: 108, meta: 100 },
  { equipe: 'Desenvolvimento', realizado: 84, meta: 100 },
  { equipe: 'Suporte', realizado: 97, meta: 100 },
  { equipe: 'RH', realizado: 89, meta: 100 },
];

const dadosRegioes = [
  { regiao: 'Sudeste', vendas: 8640, clientes: 3250 },
  { regiao: 'Nordeste', vendas: 6420, clientes: 2180 },
  { regiao: 'Sul', vendas: 5930, clientes: 1870 },
  { regiao: 'Centro-Oeste', vendas: 3860, clientes: 1240 },
  { regiao: 'Norte', vendas: 3150, clientes: 980 },
];

const dadosSatisfacao = [
  { produto: 'Notebook Pro X', satisfacao: 4.8 },
  { produto: 'Smartphone Galaxy', satisfacao: 4.5 },
  { produto: 'Tablet Ultra', satisfacao: 4.2 },
  { produto: 'Monitor Curvo', satisfacao: 4.6 },
  { produto: 'Teclado Mecânico', satisfacao: 4.7 },
  { produto: 'Mouse Gamer', satisfacao: 4.4 },
  { produto: 'Headset Wireless', satisfacao: 4.3 },
];

const dadosAvaliacaoCursos = [
  { curso: 'Programação Web', iniciantes: 92, intermediarios: 88, avancados: 95 },
  { curso: 'Machine Learning', iniciantes: 75, intermediarios: 86, avancados: 94 },
  { curso: 'UX/UI Design', iniciantes: 90, intermediarios: 92, avancados: 89 },
  { curso: 'DevOps', iniciantes: 70, intermediarios: 85, avancados: 92 },
  { curso: 'Mobile Dev', iniciantes: 88, intermediarios: 90, avancados: 93 },
];

export const Basico: StoryObj<IGRPVerticalBarChartProps> = {
  render: Template,
  args: {
    title: 'Vendas por Categoria',
    description: 'Performance por categoria de produto',
    data: dadosVendaCategorias,
    bars: [{ dataKey: 'vendas', name: 'Vendas', color: '#3b82f6' }],
    categoryKey: 'categoria',
    valueFormatter: (value) => `R$ ${value.toLocaleString()}`,
    footer: { description: 'Eletrônicos lidera as vendas no período atual' },
  },
};

export const DesempenhoEquipe: StoryObj<IGRPVerticalBarChartProps> = {
  render: Template,
  args: {
    title: 'Performance vs Meta',
    description: 'Percentual atingido por equipe',
    data: dadosDesempenhoEquipe,
    bars: [
      { dataKey: 'realizado', name: 'Realizado', color: '#3b82f6' },
      { dataKey: 'meta', name: 'Meta', color: '#d1d5db' },
    ],
    categoryKey: 'equipe',
    legendPosition: 'bottom',
    valueFormatter: (value) => `${value}%`,
    showXAxis: true,
    footer: { description: 'Equipe de Vendas superou a meta estabelecida' },
  },
};

export const VendasPorRegiao: StoryObj<IGRPVerticalBarChartProps> = {
  render: Template,
  args: {
    title: 'Vendas por Região',
    description: 'Total de vendas e clientes por região',
    data: dadosRegioes,
    bars: [
      { dataKey: 'vendas', name: 'Vendas', color: '#3b82f6' },
      { dataKey: 'clientes', name: 'Clientes', color: '#10b981' },
    ],
    categoryKey: 'regiao',
    legendPosition: 'bottom',
    valueFormatter: (value) => value.toLocaleString(),
    showXAxis: true,
    tooltipIndicator: 'dot',
  },
};

export const SatisfacaoProdutos: StoryObj<IGRPVerticalBarChartProps> = {
  render: Template,
  args: {
    title: 'Nível de Satisfação',
    description: 'Avaliação média por produto (1-5)',
    data: dadosSatisfacao,
    bars: [{ dataKey: 'satisfacao', name: 'Satisfação', color: '#8b5cf6' }],
    categoryKey: 'produto',
    valueFormatter: (value) => `${value}/5`,
    valueDomain: [3.5, 5],
    showXAxis: true,
    footer: {
      description: 'Satisfação média aumentou em relação ao período anterior',
    },
  },
};

export const AvaliacaoCursos: StoryObj<IGRPVerticalBarChartProps> = {
  render: Template,
  args: {
    title: 'Avaliação de Cursos por Nível',
    description: 'Percentual de aprovação por tipo de aluno',
    data: dadosAvaliacaoCursos,
    bars: [
      { dataKey: 'iniciantes', name: 'Iniciantes', color: '#10b981' },
      { dataKey: 'intermediarios', name: 'Intermediários', color: '#3b82f6' },
      { dataKey: 'avancados', name: 'Avançados', color: '#8b5cf6' },
    ],
    categoryKey: 'curso',
    legendPosition: 'bottom',
    valueFormatter: (value) => `${value}%`,
    valueDomain: [60, 100],
    stacked: true, // Can be toggled in controls
    showXAxis: true,
    footer: { description: 'DevOps tem a avaliação mais baixa entre iniciantes' },
  },
};

export const EstiloPersonalizado: StoryObj<IGRPVerticalBarChartProps> = {
  render: Template,
  args: {
    title: 'Satisfação por Produto',
    description: 'Avaliação média (1-5)',
    data: dadosSatisfacao.slice(0, 5),
    bars: [{ dataKey: 'satisfacao', name: 'Satisfação', color: '#f97316' }],
    categoryKey: 'produto',
    valueFormatter: (value) => `★ ${value.toFixed(1)}`,
    barRadius: 15,
    showGrid: true,
    showXAxis: true,
    hideAxis: false,
    footer: { description: 'Produtos de hardware têm melhor avaliação' },
  },
};
