"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Table, Switch, Space, Tag } from "antd";
import { getAlarms } from "@/lib/api";

const prioColor = (p: string) =>
  p === "CRITICAL" ? "red" : p === "HIGH" ? "orange" : p === "MEDIUM" ? "gold" : "blue";

export default function AlarmsPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const { data, isFetching } = useQuery({
    queryKey: ["alarms", activeOnly],
    queryFn: () => getAlarms(activeOnly),
  });

  const columns = [
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (p: string) => <Tag color={prioColor(p)}>{p}</Tag>,
    },
    { title: "Station", dataIndex: "station", key: "station" },
    { title: "Tag", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (a: boolean) => <Tag color={a ? "red" : "default"}>{a ? "ACTIVE" : "CLEARED"}</Tag>,
    },
    {
      title: "Time",
      dataIndex: "raisedAt",
      key: "time",
      render: (t: string) => new Date(t).toLocaleString(),
    },
  ];

  return (
    <Card
      title="Alarms"
      extra={
        <Space>
          <span>Active only</span>
          <Switch checked={activeOnly} onChange={setActiveOnly} />
        </Space>
      }
    >
      <Table
        rowKey="id"
        size="small"
        loading={isFetching}
        columns={columns}
        dataSource={data ?? []}
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
}
