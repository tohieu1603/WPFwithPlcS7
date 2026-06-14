"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Table, Switch, Space, Tag, Select, Statistic } from "antd";
import { getAlarmsFiltered, getAlarmStats, getDowntime } from "@/lib/api";
import { AlarmsByStation, ParetoChart } from "@/components/Charts";
import type { AlarmRow } from "@/lib/types";

const prioColor = (p: string) =>
  p === "CRITICAL" ? "red" : p === "HIGH" ? "orange" : p === "MEDIUM" ? "gold" : "blue";

function duration(r: AlarmRow): string {
  if (r.active) return "active";
  if (!r.clearedAt) return "-";
  const sec = Math.round((new Date(r.clearedAt).getTime() - new Date(r.raisedAt).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function AlarmsPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [priority, setPriority] = useState<string | undefined>();

  const { data: rows, isFetching } = useQuery({
    queryKey: ["alarms", activeOnly, priority],
    queryFn: () => getAlarmsFiltered({ active: activeOnly, priority }),
  });
  const { data: stats } = useQuery({ queryKey: ["alarmStats"], queryFn: getAlarmStats });
  const { data: downtime } = useQuery({ queryKey: ["downtime"], queryFn: getDowntime });

  const columns = [
    { title: "Priority", dataIndex: "priority", key: "priority", width: 110, render: (p: string) => <Tag color={prioColor(p)}>{p}</Tag> },
    { title: "Station", dataIndex: "station", key: "station", width: 90 },
    { title: "Tag", dataIndex: "name", key: "name", render: (v: string) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Status", dataIndex: "active", key: "active", width: 100, render: (a: boolean) => <Tag color={a ? "red" : "default"}>{a ? "ACTIVE" : "CLEARED"}</Tag> },
    { title: "Duration", key: "dur", width: 100, render: (_: unknown, r: AlarmRow) => duration(r) },
    { title: "Raised", dataIndex: "raisedAt", key: "time", width: 170, render: (t: string) => new Date(t).toLocaleString() },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={5}><Card size="small"><Statistic title="Active now" value={stats?.activeCount ?? 0} styles={{ content: { color: (stats?.activeCount ?? 0) > 0 ? "#cf1322" : undefined } }} /></Card></Col>
        <Col xs={12} md={5}><Card size="small"><Statistic title="Critical" value={stats?.byPriority?.CRITICAL ?? 0} styles={{ content: { color: "#cf1322" } }} /></Card></Col>
        <Col xs={12} md={5}><Card size="small"><Statistic title="High" value={stats?.byPriority?.HIGH ?? 0} styles={{ content: { color: "#fa8c16" } }} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Events" value={stats?.totalEvents ?? 0} /></Card></Col>
        <Col xs={12} md={5}><Card size="small"><Statistic title="Avg duration" value={stats?.avgDurationSec ?? 0} suffix="s" /></Card></Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            title="Alarm & event log"
            extra={
              <Space>
                <Select placeholder="Priority" allowClear style={{ width: 130 }} value={priority} onChange={setPriority}
                  options={[{ value: "CRITICAL", label: "CRITICAL" }, { value: "HIGH", label: "HIGH" }, { value: "MEDIUM", label: "MEDIUM" }, { value: "LOW", label: "LOW" }]} />
                <span>Active only</span>
                <Switch checked={activeOnly} onChange={setActiveOnly} />
              </Space>
            }
          >
            <Table rowKey="id" size="small" loading={isFetching} columns={columns} dataSource={rows ?? []} pagination={{ pageSize: 15 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Events by station" size="small">
            <AlarmsByStation data={stats?.byStation ?? []} />
          </Card>
        </Col>
      </Row>

      <Card title="Downtime Pareto (time lost per cause)" size="small" style={{ marginTop: 16 }}>
        <ParetoChart
          data={(downtime ?? []).map((d) => ({ reason: d.cause, count: d.downtimeSec }))}
          countName="Down (s)"
          unit="s"
        />
      </Card>
    </div>
  );
}
