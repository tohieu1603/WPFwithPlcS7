"use client";

import { Card, Empty } from "antd";
import type { Station } from "@/lib/types";

const dot = (s: Station) => (s.fault ? "#ff4d4f" : s.status === "RUN" ? "#52c41a" : "#bfbfbf");

export function StationBoard({ stations }: { stations: Station[] }) {
  if (!stations.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No station data yet" />;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {stations.map((st) => (
        <Card key={st.code} size="small" style={{ width: 138 }} styles={{ body: { padding: 12 } }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{st.name}</div>
              <div style={{ fontSize: 11, color: "#999" }}>{st.code}</div>
            </div>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: dot(st), marginTop: 3 }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#666", display: "flex", justifyContent: "space-between" }}>
            <span>Count</span>
            <b style={{ color: "#222" }}>{st.count}</b>
          </div>
          <div style={{ fontSize: 12, color: "#666", display: "flex", justifyContent: "space-between" }}>
            <span>Cycle</span>
            <b style={{ color: "#222" }}>{st.cycleTime.toFixed(1)} s</b>
          </div>
        </Card>
      ))}
    </div>
  );
}
