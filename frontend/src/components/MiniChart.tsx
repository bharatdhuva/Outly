import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

interface MiniChartProps {
  data: { value: number }[];
  color?: string;
  height?: number;
}

export function MiniChart({ data, color = "hsl(24 95% 53%)", height = 40 }: MiniChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`mini-gradient-${color.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={() => null}
          cursor={false}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#mini-gradient-${color.replace(/\s/g, "")})`}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
