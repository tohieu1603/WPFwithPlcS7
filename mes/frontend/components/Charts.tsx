"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from "recharts";
import { Empty } from "antd";
import type { Kpi, Station, ProductionRecord, OeePoint, ShiftOee } from "@/lib/types";

export function ProductionTrend({ history }: { history: Kpi[] }) {
  if (!history.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data yet" />;
  const data = history.map((k) => ({
    t: new Date(k.createdAt).toLocaleTimeString(),
    Good: k.good,
    Reject: k.reject,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#52c41a" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#52c41a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4d4f" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ff4d4f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="t" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Area type="monotone" dataKey="Good" stroke="#52c41a" fill="url(#g)" strokeWidth={2} />
        <Area type="monotone" dataKey="Reject" stroke="#ff4d4f" fill="url(#r)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const PARETO_COLORS = ["#ff4d4f", "#fa8c16", "#faad14", "#8c8c8c"];

export function RejectPareto({ kpi }: { kpi: Kpi | null }) {
  const data = [
    { reason: "Vision", count: kpi?.rejVision ?? 0 },
    { reason: "Barcode", count: kpi?.rejBarcode ?? 0 },
    { reason: "Verify", count: kpi?.rejVerify ?? 0 },
    { reason: "Assembly", count: kpi?.rejAssembly ?? 0 },
  ].sort((a, b) => b.count - a.count);

  if (data.every((d) => d.count === 0))
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No rejects" />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PARETO_COLORS[i % PARETO_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Per-station cycle time. The tallest bar is the bottleneck. */
export function StationCycleChart({ stations }: { stations: Station[] }) {
  if (!stations.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  const data = stations.map((s) => ({ name: s.name, cycle: Number(s.cycleTime.toFixed(2)) }));
  const max = Math.max(...data.map((d) => d.cycle));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="s" />
        <Tooltip />
        <Bar dataKey="cycle" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.cycle >= max ? "#ff7a45" : "#1677ff"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Vision match score per recent unit, with the minimum-score limit line. */
export function VisionScoreTrend({ records, minScore = 90 }: { records: ProductionRecord[]; minScore?: number }) {
  if (!records.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  const data = [...records].reverse().map((r, i) => ({ i: i + 1, score: Number(r.visionScore.toFixed(1)) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="i" tick={{ fontSize: 11 }} />
        <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip />
        <ReferenceLine y={minScore} stroke="#ff4d4f" strokeDasharray="4 4" label={{ value: "min", fontSize: 11 }} />
        <Line type="monotone" dataKey="score" stroke="#1677ff" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Measured gap per recent unit, with the tolerance band. */
export function GapTrend({
  records,
  nominal = 0.5,
  tol = 0.1,
}: {
  records: ProductionRecord[];
  nominal?: number;
  tol?: number;
}) {
  if (!records.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  const data = [...records].reverse().map((r, i) => ({ i: i + 1, gap: Number(r.gap.toFixed(3)) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="i" tick={{ fontSize: 11 }} />
        <YAxis domain={[nominal - tol * 2, nominal + tol * 2]} tick={{ fontSize: 11 }} unit="mm" />
        <Tooltip />
        <ReferenceArea y1={nominal - tol} y2={nominal + tol} fill="#52c41a" fillOpacity={0.08} />
        <ReferenceLine y={nominal + tol} stroke="#ff4d4f" strokeDasharray="4 4" />
        <ReferenceLine y={nominal - tol} stroke="#ff4d4f" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="gap" stroke="#722ed1" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Good vs Reject as a donut. */
export function PassFailDonut({ good, reject }: { good: number; reject: number }) {
  if (good + reject === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  const data = [
    { name: "Good", value: good, fill: "#52c41a" },
    { name: "Reject", value: reject, fill: "#ff4d4f" },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Throughput (pph) and first-pass yield over time. */
export function ThroughputTrend({ history }: { history: Kpi[] }) {
  if (!history.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data yet" />;
  const data = history.map((k) => ({
    t: new Date(k.createdAt).toLocaleTimeString(),
    Throughput: Math.round(k.throughput),
    FPY: Math.round(k.fpy),
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="t" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip />
        <Legend />
        <Line yAxisId="l" type="monotone" dataKey="Throughput" stroke="#1677ff" dot={false} strokeWidth={2} />
        <Line yAxisId="r" type="monotone" dataKey="FPY" stroke="#52c41a" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** OEE and its three factors over time. */
export function OeeTrend({ history }: { history: OeePoint[] }) {
  if (!history.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data yet" />;
  const data = history.map((h) => ({
    t: new Date(h.t).toLocaleTimeString(),
    OEE: h.overall, Availability: h.availability, Performance: h.performance, Quality: h.quality,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="t" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="OEE" stroke="#1677ff" dot={false} strokeWidth={3} />
        <Line type="monotone" dataKey="Availability" stroke="#52c41a" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="Performance" stroke="#faad14" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="Quality" stroke="#722ed1" dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Generic SPC control chart: samples with mean and 3-sigma control limits. */
export function SpcChart({
  values, mean, ucl, lcl, unit = "", color = "#1677ff", domain,
}: {
  values: number[]; mean: number; ucl: number; lcl: number;
  unit?: string; color?: string; domain?: [number, number];
}) {
  if (!values.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  const data = values.map((v, i) => ({ i: i + 1, v: Number(v.toFixed(3)) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="i" tick={{ fontSize: 11 }} />
        <YAxis domain={domain ?? ["auto", "auto"]} tick={{ fontSize: 11 }} unit={unit} />
        <Tooltip />
        <ReferenceLine y={ucl} stroke="#ff4d4f" strokeDasharray="5 4" label={{ value: "UCL", fontSize: 10, fill: "#ff4d4f" }} />
        <ReferenceLine y={lcl} stroke="#ff4d4f" strokeDasharray="5 4" label={{ value: "LCL", fontSize: 10, fill: "#ff4d4f" }} />
        <ReferenceLine y={mean} stroke="#52c41a" label={{ value: "x̄", fontSize: 11, fill: "#52c41a" }} />
        <Line type="monotone" dataKey="v" name="value" stroke={color} dot={{ r: 2 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Pareto: reason counts (bars) plus a cumulative-percent line. */
export function ParetoChart({
  data, countName = "Count", unit = "",
}: {
  data: { reason: string; count: number }[]; countName?: string; unit?: string;
}) {
  if (!data.length || data.every((d) => d.count === 0))
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, d) => s + d.count, 0) || 1;
  let cum = 0;
  const rows = sorted.map((d) => {
    cum += d.count;
    return { reason: d.reason, count: d.count, cum: Math.round((cum / total) * 100) };
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="reason" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={50} />
        <YAxis yAxisId="l" tick={{ fontSize: 11 }} allowDecimals={false} unit={unit} />
        <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="l" dataKey="count" name={countName} fill="#ff7a45" radius={[4, 4, 0, 0]} />
        <Line yAxisId="r" type="monotone" dataKey="cum" name="Cumulative %" stroke="#1677ff" strokeWidth={2} dot={{ r: 2 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** OEE and factors compared across work shifts (grouped bars). */
export function OeeByShift({ rows }: { rows: ShiftOee[] }) {
  if (!rows.length || rows.every((r) => r.samples === 0))
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No shift data yet" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="shift" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip />
        <Legend />
        <Bar dataKey="availability" name="Availability" fill="#52c41a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="performance" name="Performance" fill="#faad14" radius={[3, 3, 0, 0]} />
        <Bar dataKey="quality" name="Quality" fill="#722ed1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="overall" name="OEE" fill="#1677ff" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Alarm event counts per station (horizontal bars). */
export function AlarmsByStation({ data }: { data: { station: string; count: number }[] }) {
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No alarm events" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart layout="vertical" data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="station" width={56} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Events" fill="#fa8c16" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Distribution of print grades across recent units. */
export function GradeDistribution({ records }: { records: ProductionRecord[] }) {
  const counts: Record<string, number> = {};
  for (const r of records) counts[r.grade || "-"] = (counts[r.grade || "-"] || 0) + 1;
  const data = Object.entries(counts)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => a.grade.localeCompare(b.grade));
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" name="Units" fill="#13c2c2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
