import * as React from "react";

/**
 * 图表封装组件（基于 Recharts）
 * 业务方使用前需自行安装：pnpm add recharts
 *
 * 提供常用图表类型，避免直接暴露 Recharts 全部 API
 */

export type ChartType = "line" | "bar" | "area" | "pie";

export interface ChartSeries {
  name: string;
  /** 数据 key，对应 data 中字段名 */
  dataKey: string | number;
  color?: string;
}

export interface ChartProps {
  type: ChartType;
  data: Array<Record<string, unknown>>;
  /** X 轴字段 */
  xKey: string;
  series: ChartSeries[];
  height?: number;
  loading?: boolean;
  /** 是否显示图例 */
  legend?: boolean;
  /** 是否显示网格 */
  grid?: boolean;
}

/**
 * 由于 Recharts 是重量依赖，这里采用动态加载策略。
 * 调用方需保证运行环境中已安装 recharts。
 */
let RechartsModule: typeof import("recharts") | null = null;
async function loadRecharts() {
  if (RechartsModule) return RechartsModule;
  RechartsModule = await import("recharts");
  return RechartsModule;
}

const defaultColors = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export function Chart({
  type,
  data,
  xKey,
  series,
  height = 240,
  loading = false,
  legend = true,
  grid = true,
}: ChartProps) {
  const [mod, setMod] = React.useState<typeof import("recharts") | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    loadRecharts()
      .then((m) => {
        if (mounted) setMod(m);
      })
      .catch(() => {
        if (mounted) {
          setError("Recharts 未安装，请运行 pnpm add recharts 后重试");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-400"
        style={{ height }}
      >
        {error}
      </div>
    );
  }

  if (!mod) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-400"
        style={{ height }}
      >
        {loading ? "加载图表..." : "图表组件"}
      </div>
    );
  }

  const {
    ResponsiveContainer,
    LineChart,
    BarChart,
    AreaChart,
    PieChart,
    Line,
    Bar,
    Area,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
  } = mod;

  const renderSeries = () => {
    return series.map((s, idx) => {
      const color = s.color ?? defaultColors[idx % defaultColors.length];
      if (type === "line") {
        return (
          <Line
            key={s.dataKey as string}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        );
      }
      if (type === "bar") {
        return (
          <Bar
            key={s.dataKey as string}
            dataKey={s.dataKey}
            name={s.name}
            fill={color}
          />
        );
      }
      if (type === "area") {
        return (
          <Area
            key={s.dataKey as string}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={color}
            fill={color}
            fillOpacity={0.15}
          />
        );
      }
      // pie
      return null;
    });
  };

  const common = {
    data,
    margin: { top: 8, right: 16, bottom: 0, left: 0 },
  } as const;

  const chart =
    type === "pie" ? (
      <PieChart {...common}>
        <Pie
          data={data.map((d, i) => ({
            name: String(d[xKey]),
            value: Number(d[series[0]?.dataKey as string] ?? 0),
          }))}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={Math.min(height, 240) / 2 - 24}
          label
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={defaultColors[i % defaultColors.length]}
            />
          ))}
        </Pie>
        {legend && <Legend />}
        <Tooltip />
      </PieChart>
    ) : type === "bar" ? (
      <BarChart {...common}>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip />
        {legend && <Legend />}
        {renderSeries()}
      </BarChart>
    ) : type === "area" ? (
      <AreaChart {...common}>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip />
        {legend && <Legend />}
        {renderSeries()}
      </AreaChart>
    ) : (
      <LineChart {...common}>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip />
        {legend && <Legend />}
        {renderSeries()}
      </LineChart>
    );

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
