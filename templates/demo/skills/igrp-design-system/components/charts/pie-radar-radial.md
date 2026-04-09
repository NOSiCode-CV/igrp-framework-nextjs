# IGRPPieChart, IGRPRadarChart, IGRPRadialBarChart

## IGRPPieChart

```tsx
<IGRPPieChart
  data={data}
  categoryKey="name"
  pies={[{ dataKey: 'value', name: 'Sales', showLabels: true }]}
  title="Distribution"
/>
```

## IGRPRadarChart

```tsx
<IGRPRadarChart
  data={data}
  categoryKey="subject"
  radars={[{ dataKey: 'value', name: 'Score' }]}
/>
```

## IGRPRadialBarChart

```tsx
<IGRPRadialBarChart
  data={data}
  categoryKey="name"
  radials={[{ dataKey: 'value', name: 'Progress' }]}
/>
```
