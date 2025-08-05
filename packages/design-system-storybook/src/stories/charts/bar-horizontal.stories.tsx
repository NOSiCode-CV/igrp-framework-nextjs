/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { Bar, Cell, LabelList } from 'recharts';
import {
  IGRPHorizontalBarChart,
  type IGRPHorizontalBarChartProps,
} from '@igrp/igrp-framework-react-design-system';

export default {
  title: 'Components/Charts/Bar/Horizontal',
  component: IGRPHorizontalBarChart,
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
    showReferenceZero: {
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
    barGap: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      defaultValue: 8,
    },
    tooltipIndicator: {
      control: { type: 'select' },
      options: ['line', 'dot'],
      defaultValue: 'line',
    },
  },
} as Meta;

const Template: StoryFn<IGRPHorizontalBarChartProps> = (args) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPHorizontalBarChart {...args} />
  </div>
);

const dadosVisitantes = [
  { mes: 'Janeiro', desktop: 186 },
  { mes: 'Fevereiro', desktop: 305 },
  { mes: 'Março', desktop: 237 },
  { mes: 'Abril', desktop: 73 },
  { mes: 'Maio', desktop: 209 },
  { mes: 'Junho', desktop: 214 },
];

const dadosDispositivos = [
  { mes: 'Janeiro', desktop: 186, mobile: 80 },
  { mes: 'Fevereiro', desktop: 305, mobile: 200 },
  { mes: 'Março', desktop: 237, mobile: 120 },
  { mes: 'Abril', desktop: 73, mobile: 190 },
  { mes: 'Maio', desktop: 209, mobile: 130 },
  { mes: 'Junho', desktop: 214, mobile: 140 },
];

const dadosTrimestrais = [
  { trimestre: 'T1', receita: 12500, meta: 10000 },
  { trimestre: 'T2', receita: 15000, meta: 12000 },
  { trimestre: 'T3', receita: 9800, meta: 14000 },
  { trimestre: 'T4', receita: 18000, meta: 16000 },
];

const dadosNegativos = [
  { mes: 'Janeiro', visitantes: 186 },
  { mes: 'Fevereiro', visitantes: 205 },
  { mes: 'Março', visitantes: -207 },
  { mes: 'Abril', visitantes: 173 },
  { mes: 'Maio', visitantes: -209 },
  { mes: 'Junho', visitantes: 214 },
];

const dadosFinanceiros = [
  { mes: 'Jan', receita: 8600, despesas: -5400, lucro: 3200 },
  { mes: 'Fev', receita: 7900, despesas: -5100, lucro: 2800 },
  { mes: 'Mar', receita: 9200, despesas: -5900, lucro: 3300 },
  { mes: 'Abr', receita: 6800, despesas: -7200, lucro: -400 },
  { mes: 'Mai', receita: 8100, despesas: -5600, lucro: 2500 },
  { mes: 'Jun', receita: 9500, despesas: -1100, lucro: 8400 },
];

const dadosComparativo = [
  { categoria: 'Produto A', atual: 1250, anterior: -980 },
  { categoria: 'Produto B', atual: 980, anterior: -850 },
  { categoria: 'Produto C', atual: -850, anterior: 920 },
  { categoria: 'Produto D', atual: 750, anterior: -650 },
  { categoria: 'Produto E', atual: -550, anterior: 780 },
];

const dadosTemperatura = [
  { mes: 'Jan', temperatura: 28 },
  { mes: 'Fev', temperatura: 30 },
  { mes: 'Mar', temperatura: 26 },
  { mes: 'Abr', temperatura: 22 },
  { mes: 'Mai', temperatura: 18 },
  { mes: 'Jun', temperatura: 16 },
];

export const Basico: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Visitantes Mensais',
    description: 'Janeiro - Junho 2024',
    data: dadosVisitantes,
    bars: [{ dataKey: 'desktop', name: 'Desktop' }],
    categoryKey: 'mes',
    footer: {
      description: 'Mostrando total de visitantes dos últimos 6 meses',
    },
  },
};

export const MultiSeries: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Dispositivos por Mês',
    description: 'Janeiro - Junho 2024',
    data: dadosDispositivos,
    bars: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#10b981' },
    ],
    categoryKey: 'mes',
    legendPosition: 'bottom',
    footer: {
      description: 'Comparação entre acessos por tipo de dispositivo',
    },
  },
};

export const Empilhado: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    stacked: true,
    title: 'Dispositivos por Mês (Empilhado)',
    footer: {
      description: 'Total de acessos por mês',
    },
    description: 'Janeiro - Junho 2024',
    data: dadosDispositivos,
    bars: [
      { dataKey: 'desktop', name: 'Desktop', color: '#3b82f6' },
      { dataKey: 'mobile', name: 'Mobile', color: '#10b981' },
    ],
    categoryKey: 'mes',
    legendPosition: 'bottom',
  },
};

export const FormatacaoPersonalizada: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Receita Trimestral',
    description: 'Performance vs Meta',
    data: dadosTrimestrais,
    bars: [
      { dataKey: 'receita', name: 'Receita', color: '#3b82f6' },
      { dataKey: 'meta', name: 'Meta', color: '#d1d5db' },
    ],
    categoryKey: 'trimestre',
    valueFormatter: (value: number) => `R$ ${(value / 1000).toFixed(1)}K`,
    footer: {
      description: 'Receita superou a meta no último trimestre',
    },
  },
};

export const GradeTemperatura: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Temperatura Média',
    description: 'Janeiro - Junho 2024',
    data: dadosTemperatura,
    bars: [{ dataKey: 'temperatura', name: 'Temperatura', color: '#ef4444' }],
    categoryKey: 'mes',
    showGrid: true,
    valueFormatter: (value: number) => `${value}°C`,
    tooltipIndicator: 'dot',
    footer: {
      description: 'Temperatura diminuindo com a chegada do inverno',
    },
  },
};

export const ValoresNegativos: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Gráfico de Barras - Negativos',
    description: 'Janeiro - Junho 2024',
    data: dadosNegativos,
    bars: [
      {
        dataKey: 'visitantes',
        name: 'Visitantes',
        render: (props: any) => (
          <Bar {...props}>
            {dadosNegativos.map((entry) => (
              <Cell
                key={`cell-${entry.mes}`}
                fill={entry.visitantes > 0 ? '#3b82f6' : '#ef4444'}
              />
            ))}
          </Bar>
        ),
      },
    ],
    categoryKey: 'mes',
    showGrid: true,
    showReferenceZero: true,
    footer: {
      description: 'Mostrando total de visitantes dos últimos 6 meses',
    },
  },
};

export const ReceitasDespesas: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Receitas e Despesas',
    description: 'Análise financeira mensal',
    data: dadosFinanceiros,
    bars: [
      { dataKey: 'receita', name: 'Receita', color: '#10b981' },
      { dataKey: 'despesas', name: 'Despesas', color: '#ef4444' },
      {
        dataKey: 'lucro',
        name: 'Lucro',
        render: (props: any) => (
          <Bar {...props}>
            {dadosFinanceiros.map((entry) => (
              <Cell
                key={`cell-${entry.mes}`}
                fill={entry.lucro > 0 ? '#3b82f6' : '#f97316'}
              />
            ))}
          </Bar>
        ),
      },
    ],
    categoryKey: 'mes',
    legendPosition: 'bottom',
    showGrid: true,
    showReferenceZero: true,
    tooltipIndicator: 'dot',
    valueFormatter: (value: number) => `R$ ${Math.abs(value).toLocaleString()}`,
  },
};

export const ComparativoPeríodos: StoryObj<IGRPHorizontalBarChartProps> = {
  render: Template,
  args: {
    title: 'Comparativo de Períodos',
    description: 'Atual vs Anterior',
    data: dadosComparativo,
    bars: [
      {
        dataKey: 'atual',
        name: 'Período Atual',
        render: (props: any) => (
          <Bar {...props}>
            {dadosComparativo.map((entry) => (
              <Cell
                key={`cell-atual-${entry.categoria}`}
                fill={entry.atual > 0 ? '#3b82f6' : '#ef4444'}
              />
            ))}
            <LabelList
              position='top'
              formatter={(value: number) => (value > 0 ? `+${value}` : value)}
            />
          </Bar>
        ),
      },
      {
        dataKey: 'anterior',
        name: 'Período Anterior',
        render: (props: any) => (
          <Bar {...props}>
            {dadosComparativo.map((entry) => (
              <Cell
                key={`cell-anterior-${entry.categoria}`}
                fill={entry.anterior > 0 ? '#10b981' : '#f97316'}
              />
            ))}
            <LabelList
              position='top'
              formatter={(value: number) => (value > 0 ? `+${value}` : value)}
            />
          </Bar>
        ),
      },
    ],
    categoryKey: 'categoria',
    legendPosition: 'bottom',
    valueDomain: [-1000, 1500],
    showReferenceZero: true,
  },
};
