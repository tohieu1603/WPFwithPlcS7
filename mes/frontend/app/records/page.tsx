"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Card, Table, Input, Select, Space, Tag, Button, Drawer, Descriptions, Badge, Typography,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getRecords } from "@/lib/api";
import type { ProductionRecord } from "@/lib/types";

const dispColor = (d: string) => (d === "PASS" ? "success" : d === "FAIL" ? "error" : "warning");

function exportCsv(rows: ProductionRecord[]) {
  const cols = ["serial", "product", "barcode", "disposition", "visionPass", "visionScore", "gap", "bore", "grade", "failReason", "createdAt"];
  const head = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => JSON.stringify((r as any)[c] ?? "")).join(","))
    .join("\n");
  const blob = new Blob([head + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-records.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecordsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [disposition, setDisposition] = useState<string | undefined>();
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<ProductionRecord | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["records", page, pageSize, disposition, search],
    queryFn: () => getRecords({ page, pageSize, disposition, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      title: "Serial",
      dataIndex: "serial",
      key: "serial",
      render: (v: string) => <Typography.Text strong copyable={{ text: v }} style={{ fontFamily: "monospace" }}>{v}</Typography.Text>,
    },
    { title: "Product", dataIndex: "product", key: "product", render: (v: string) => <Tag>{v}</Tag> },
    { title: "Barcode", dataIndex: "barcode", key: "barcode", render: (v: string) => <span style={{ fontFamily: "monospace", color: "#555" }}>{v}</span> },
    {
      title: "Vision",
      key: "vis",
      render: (_: unknown, r: ProductionRecord) =>
        r.visionPass ? <Tag color="success">{r.visionScore.toFixed(1)} %</Tag> : <Tag color="error">FAIL</Tag>,
    },
    { title: "Grade", dataIndex: "grade", key: "grade", render: (v: string) => (v ? <Tag color="blue">{v}</Tag> : "-") },
    {
      title: "Result",
      dataIndex: "disposition",
      key: "disp",
      render: (d: string) => <Tag color={dispColor(d)}>{d}</Tag>,
    },
    { title: "Reason", dataIndex: "failReason", key: "reason", render: (v: string) => (v ? <Tag color="volcano">{v}</Tag> : "") },
    { title: "Time", dataIndex: "createdAt", key: "time", render: (t: string) => new Date(t).toLocaleString() },
  ];

  return (
    <Card
      title="Production records (traceability)"
      extra={
        <Button icon={<DownloadOutlined />} onClick={() => exportCsv(data?.rows ?? [])}>
          Export CSV
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="Search serial" allowClear style={{ width: 240 }}
          onSearch={(v) => { setSearch(v); setPage(1); }} />
        <Select placeholder="Disposition" allowClear style={{ width: 160 }} value={disposition}
          onChange={(v) => { setDisposition(v); setPage(1); }}
          options={[{ value: "PASS", label: "PASS" }, { value: "FAIL", label: "FAIL" }, { value: "REWORK", label: "REWORK" }]} />
        <Badge status="processing" text="Auto-refresh 2s" />
      </Space>

      <Table
        rowKey="id"
        size="small"
        loading={isFetching}
        columns={columns}
        dataSource={data?.rows ?? []}
        onRow={(r) => ({ onClick: () => setSelected(r), style: { cursor: "pointer" } })}
        pagination={{
          current: page, pageSize, total: data?.total ?? 0, showSizeChanger: true,
          showTotal: (t) => `${t} units`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Drawer
        title={selected ? `Unit ${selected.serial}` : ""}
        size="large"
        open={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Serial">{selected.serial}</Descriptions.Item>
            <Descriptions.Item label="Product">{selected.product}</Descriptions.Item>
            <Descriptions.Item label="Barcode (ST20)">{selected.barcode || "-"}</Descriptions.Item>
            <Descriptions.Item label="Vision (ST40)">
              <Tag color={selected.visionPass ? "success" : "error"}>{selected.visionPass ? "PASS" : "FAIL"}</Tag>
              {" "}score {selected.visionScore.toFixed(1)} %
            </Descriptions.Item>
            <Descriptions.Item label="Gap (VF03)">{selected.gap.toFixed(3)} mm</Descriptions.Item>
            <Descriptions.Item label="Bore (VF04)">{selected.bore.toFixed(3)} mm</Descriptions.Item>
            <Descriptions.Item label="Print grade (ST60)">{selected.grade || "-"}</Descriptions.Item>
            <Descriptions.Item label="Disposition">
              <Tag color={dispColor(selected.disposition)}>{selected.disposition}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Fail reason">{selected.failReason || "-"}</Descriptions.Item>
            <Descriptions.Item label="Timestamp">{new Date(selected.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Card>
  );
}
