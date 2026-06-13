"use client";

import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  PackagePlus,
  ScanBarcode,
  Wrench,
  Camera,
  Zap,
  BadgeCheck,
  CircleX,
  PackageCheck,
  Factory,
  type LucideIcon,
} from "lucide-react";
import type { Station } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  ST10: PackagePlus,
  ST20: ScanBarcode,
  ST30: Wrench,
  ST40: Camera,
  ST50: Zap,
  ST60: BadgeCheck,
  ST70: CircleX,
  ST80: PackageCheck,
};

const statusColor = (s: Station) => (s.fault ? "#ff4d4f" : s.status === "RUN" ? "#52c41a" : "#94a3b8");

function StationNode({ data }: { data: { station: Station } }) {
  const st = data.station;
  const col = statusColor(st);
  const Icon = ICONS[st.code] ?? Factory;
  const running = st.status === "RUN" && !st.fault;
  return (
    <div
      style={{
        width: 184,
        borderRadius: 12,
        background: "#fff",
        border: `1px solid ${running ? col : "#e5e7eb"}`,
        boxShadow: running ? `0 0 0 3px ${col}22` : "0 1px 6px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#cbd5e1", border: "none" }} />
      <div
        style={{
          background: col,
          color: "#fff",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>{st.name}</span>
        <span style={{ fontSize: 11, opacity: 0.85 }}>{st.code}</span>
      </div>
      <div style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: col,
          }}
        >
          <Icon size={26} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{st.count}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>parts</div>
        </div>
      </div>
      <div
        style={{
          padding: "6px 12px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#64748b",
        }}
      >
        <span>{running ? "RUNNING" : st.fault ? "FAULT" : "IDLE"}</span>
        <span>{st.cycleTime.toFixed(1)} s</span>
      </div>
      <div style={{ height: 4, background: "#f1f5f9" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (st.cycleTime / 3) * 100)}%`, background: col }} />
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#cbd5e1", border: "none" }} />
    </div>
  );
}

const nodeTypes = { station: StationNode };

export function StationFlow({ stations, running }: { stations: Station[]; running: boolean }) {
  const buildNodes = () =>
    stations.map((st, i) => ({
      id: st.code,
      type: "station",
      position: { x: i * 232, y: 0 },
      data: { station: st },
      draggable: false,
    }));
  const buildEdges = () =>
    stations.slice(0, -1).map((st, i) => ({
      id: `e${i}`,
      source: st.code,
      target: stations[i + 1].code,
      animated: running,
      style: { stroke: "#94a3b8", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
    }));

  const [nodes, setNodes] = useNodesState(buildNodes());
  const [edges, setEdges] = useEdgesState(buildEdges());

  useEffect(() => {
    setNodes(buildNodes());
    setEdges(buildEdges());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, running]);

  return (
    <div style={{ height: 300 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        nodesDraggable={false}
        edgesFocusable={false}
        zoomOnScroll={false}
        panOnScroll
      >
        <Background gap={18} color="#eef2f6" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
