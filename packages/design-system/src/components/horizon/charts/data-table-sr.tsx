"use client"

import { useIGRPi18n } from "../../../i18n/index.js"
import type { IGRPChartDataItem } from "./types.js"

/**
 * @internal Visually hidden table with the chart's values: the SVG alone gives
 * screen-reader users no way to read the data (WCAG 1.1.1).
 */
function IGRPChartDataTable({
  data,
  rowKey,
  series,
}: {
  data: IGRPChartDataItem[]
  rowKey?: string
  series: { dataKey: string; name?: string }[]
}) {
  const i18n = useIGRPi18n()
  if (data.length === 0 || series.length === 0) return null

  return (
    <table className="sr-only">
      <thead>
        <tr>
          {rowKey && <th scope="col">{i18n.charts.category}</th>}
          {series.map((s) => (
            <th key={s.dataKey} scope="col">
              {s.name || s.dataKey}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {rowKey && <th scope="row">{row[rowKey]}</th>}
            {series.map((s) => (
              <td key={s.dataKey}>{row[s.dataKey]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { IGRPChartDataTable }
