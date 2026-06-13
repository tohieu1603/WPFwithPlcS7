"use client";

import { Empty } from "antd";
import type { Station } from "@/lib/types";

const SLOT = 140;
const X0 = 16;
const CAB_W = 112;
const TOP = 26;
const CAB_H = 92;
const BELT_Y = 150;
const BELT_H = 16;

const statusColor = (s: Station) => (s.fault ? "#ff4d4f" : s.status === "RUN" ? "#52c41a" : "#9aa4ad");

/** A small machine glyph per station type, drawn around (56, 84). */
function Glyph({ code }: { code: string }) {
  const gx = 56;
  const gy = 84;
  const c = "#5b6b7b";
  switch (code) {
    case "ST10":
    case "ST80": // stacked boxes (infeed / outfeed)
      return (
        <g fill={c}>
          <rect x={gx - 13} y={gy - 10} width={26} height={6} rx={1} />
          <rect x={gx - 13} y={gy - 2} width={26} height={6} rx={1} />
          <rect x={gx - 13} y={gy + 6} width={26} height={6} rx={1} />
        </g>
      );
    case "ST20":
    case "ST60": // barcode bars (scanner)
      return (
        <g fill={c}>
          {[0, 4, 7, 11, 14, 18, 22, 25].map((dx, i) => (
            <rect key={i} x={gx - 13 + dx} y={gy - 11} width={i % 2 ? 2 : 3} height={22} />
          ))}
        </g>
      );
    case "ST30": // press
      return (
        <g fill={c}>
          <rect x={gx - 15} y={gy - 12} width={30} height={7} rx={2} />
          <rect x={gx - 4} y={gy - 5} width={8} height={12} />
          <rect x={gx - 15} y={gy + 9} width={30} height={6} rx={2} />
        </g>
      );
    case "ST40": // vision camera
      return (
        <g>
          <rect x={gx - 12} y={gy - 13} width={10} height={5} fill={c} />
          <rect x={gx - 15} y={gy - 9} width={30} height={20} rx={3} fill={c} />
          <circle cx={gx + 3} cy={gy + 1} r={6} fill="#fff" />
          <circle cx={gx + 3} cy={gy + 1} r={3} fill={c} />
        </g>
      );
    case "ST50": // laser marker
      return (
        <g fill={c}>
          <rect x={gx - 9} y={gy - 13} width={18} height={8} rx={2} />
          <path d={`M ${gx} ${gy - 5} L ${gx - 8} ${gy + 13} L ${gx + 8} ${gy + 13} Z`} opacity={0.5} />
        </g>
      );
    case "ST70": // reject diverter
      return (
        <g fill="none" stroke={c} strokeWidth={3} strokeLinecap="round">
          <path d={`M ${gx - 14} ${gy} L ${gx + 4} ${gy}`} />
          <path d={`M ${gx - 2} ${gy} L ${gx + 12} ${gy + 13}`} />
          <path d={`M ${gx + 12} ${gy + 13} l -8 0 m 8 0 l 0 -8`} />
        </g>
      );
    default:
      return <circle cx={gx} cy={gy} r={8} fill={c} />;
  }
}

export function LineMimic({ stations, running }: { stations: Station[]; running: boolean }) {
  if (!stations.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No station data yet" />;
  const n = stations.length;
  const W = X0 + n * SLOT;
  const beltX2 = W - 8;
  const rollers = Math.floor((beltX2 - 16) / 40);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} 210`} width="100%" style={{ minWidth: 920, display: "block" }}>
        <defs>
          <linearGradient id="cab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9edf1" />
          </linearGradient>
        </defs>

        {/* conveyor */}
        <rect x={8} y={BELT_Y} width={beltX2 - 8} height={BELT_H} rx={BELT_H / 2} fill="#dfe3e8" stroke="#cfd5db" />
        <line
          x1={16}
          y1={BELT_Y + BELT_H / 2}
          x2={beltX2 - 8}
          y2={BELT_Y + BELT_H / 2}
          stroke="#aeb6bd"
          strokeWidth={4}
          strokeDasharray="10 12"
          className={running ? "belt-run" : ""}
        />
        {Array.from({ length: rollers }).map((_, i) => (
          <circle key={i} cx={20 + i * 40} cy={BELT_Y + BELT_H + 6} r={5} fill="#cfd5db" />
        ))}
        <path d={`M 2 ${BELT_Y + BELT_H / 2} l 11 -6 l 0 12 z`} fill="#8c8c8c" />

        {stations.map((st, i) => {
          const x = X0 + i * SLOT;
          const col = statusColor(st);
          return (
            <g key={st.code} transform={`translate(${x},0)`}>
              <rect x={CAB_W / 2 - 6} y={TOP + CAB_H} width={12} height={BELT_Y - (TOP + CAB_H)} fill="#d0d6dc" />
              <rect x={0} y={TOP} width={CAB_W} height={CAB_H} rx={10} fill="url(#cab)" stroke="#cfd5db" />
              <path
                d={`M0 ${TOP + 10} a10 10 0 0 1 10 -10 h ${CAB_W - 20} a10 10 0 0 1 10 10 v 12 h ${-CAB_W} z`}
                fill={col}
              />
              <text x={CAB_W / 2} y={TOP + 15} fill="#fff" fontSize={11} fontWeight={600} textAnchor="middle">
                {st.name}
              </text>
              <circle cx={CAB_W - 12} cy={TOP + 11} r={4} fill="#fff" opacity={0.85} />
              <Glyph code={st.code} />
              <text x={CAB_W / 2} y={TOP + CAB_H - 9} fontSize={15} fontWeight={700} fill="#333" textAnchor="middle">
                {st.count}
              </text>
              <text x={CAB_W / 2} y={BELT_Y + 34} fontSize={11} fill="#999" textAnchor="middle">
                {st.code}
              </text>
              <text x={CAB_W / 2} y={BELT_Y + 48} fontSize={10} fill="#bbb" textAnchor="middle">
                {st.cycleTime.toFixed(1)}s
              </text>
              {st.status === "RUN" && !st.fault && (
                <rect x={CAB_W / 2 - 7} y={BELT_Y - 9} width={14} height={14} rx={3} fill="#1677ff" className="part-run" />
              )}
              {i < n - 1 && (
                <path d={`M ${CAB_W + 14} ${TOP + CAB_H / 2 - 5} l 9 5 l -9 5 z`} fill="#c4ccd3" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
