import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Line } from 'recharts';

export default function PsychroChart({ points, processLines }) {
  return (
    <ScatterChart width={600} height={400} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
      <XAxis dataKey="w" name="含湿量" unit="g/kg" type="number" />
      <YAxis dataKey="h" name="焓值" unit="kJ/kg" type="number" />
      <Tooltip formatter={(value, name) => [`${value}`, name]} />
      <Scatter name="状态点" data={points} fill="#8884d8" />
      {processLines && processLines.map((line, idx) => {
        const from = points.find(p => p.name === line.from);
        const to = points.find(p => p.name === line.to);
        if (!from || !to) return null;
        return (
          <Line
            key={idx}
            type="monotone"
            data={[
              { w: from.w, h: from.h },
              { w: to.w, h: to.h }
            ]}
            stroke={line.color || '#fa541c'}
            strokeWidth={2}
            dot={false}
          />
        );
      })}
    </ScatterChart>
  );
} 