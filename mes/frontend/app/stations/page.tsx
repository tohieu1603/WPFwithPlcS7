"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Table, Tag, Row, Col, Badge } from "antd";
import { getStations } from "@/lib/api";
import { StationFlow } from "@/components/StationFlow";
import { StationCycleChart } from "@/components/Charts";
import type { Station } from "@/lib/types";

const statusColor = (s: string) => (s === "RUN" ? "success" : s === "FAULT" ? "error" : "default");

export default function StationsPage() {
  const { data } = useQuery({ queryKey: ["stations"], queryFn: getStations });
  const stations = (data ?? []) as Station[];
  const running = stations.some((s) => s.status === "RUN");
  const bottleneck = stations.reduce<Station | null>((m, s) => (!m || s.cycleTime > m.cycleTime ? s : m), null);

  const columns = [
    { title: "Code", dataIndex: "code", key: "code", width: 80 },
    { title: "Station", dataIndex: "name", key: "name" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag>,
    },
    { title: "Count", dataIndex: "count", key: "count" },
    {
      title: "Cycle time",
      dataIndex: "cycleTime",
      key: "cycle",
      render: (v: number, r: Station) => (
        <span>
          {v.toFixed(2)} s {bottleneck?.code === r.code && <Tag color="orange" style={{ marginLeft: 6 }}>bottleneck</Tag>}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Line process flow"
        size="small"
        extra={<Badge status={running ? "processing" : "default"} text={running ? "Running" : "Idle"} />}
        style={{ marginBottom: 16 }}
      >
        <StationFlow stations={stations} running={running} />
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={13}>
          <Card title="Station detail" size="small">
            <Table rowKey="code" size="small" pagination={false} columns={columns} dataSource={stations} />
          </Card>
        </Col>
        <Col xs={24} lg={11}>
          <Card title="Cycle time (tallest = bottleneck)" size="small">
            <StationCycleChart stations={stations} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
