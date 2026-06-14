"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Select, Statistic, Table, Tag, Typography, Alert } from "antd";
import { getProducts, getWhereUsed } from "@/lib/api";
import { PassFailDonut } from "@/components/Charts";
import type { ProductionRecord } from "@/lib/types";

const dispColor = (d: string) => (d === "PASS" ? "success" : d === "FAIL" ? "error" : "warning");

export default function GenealogyPage() {
  const [product, setProduct] = useState<string | undefined>();
  const { data: products } = useQuery({ queryKey: ["genProducts"], queryFn: getProducts });
  const { data } = useQuery({ queryKey: ["whereUsed", product], queryFn: () => getWhereUsed(product) });

  const columns = [
    { title: "Serial", dataIndex: "serial", key: "serial", render: (v: string) => <Typography.Text strong copyable={{ text: v }} style={{ fontFamily: "monospace" }}>{v}</Typography.Text> },
    { title: "Barcode", dataIndex: "barcode", key: "barcode", render: (v: string) => <span style={{ fontFamily: "monospace", color: "#555" }}>{v || "-"}</span> },
    { title: "Vision", key: "vis", render: (_: unknown, r: ProductionRecord) => (r.visionPass ? <Tag color="success">{r.visionScore.toFixed(1)} %</Tag> : <Tag color="error">FAIL</Tag>) },
    { title: "Grade", dataIndex: "grade", key: "grade", render: (v: string) => (v ? <Tag color="blue">{v}</Tag> : "-") },
    { title: "Result", dataIndex: "disposition", key: "disp", render: (d: string) => <Tag color={dispColor(d)}>{d}</Tag> },
    { title: "Reason", dataIndex: "failReason", key: "reason", render: (v: string) => (v ? <Tag color="volcano">{v}</Tag> : "") },
    { title: "Time", dataIndex: "createdAt", key: "time", render: (t: string) => new Date(t).toLocaleString() },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <div style={{ color: "#888", fontSize: 12 }}>WHERE-USED — pick a model to trace every unit built from it</div>
            <Select
              placeholder="All products"
              allowClear
              style={{ width: 260, marginTop: 6 }}
              value={product}
              onChange={setProduct}
              options={(products ?? []).map((p) => ({ value: p.product, label: `${p.product} (${p.count})` }))}
            />
          </Col>
          <Col flex="auto" />
          <Col><Statistic title="Units" value={data?.total ?? 0} /></Col>
          <Col><Statistic title="Pass" value={data?.pass ?? 0} styles={{ content: { color: "#3f8600" } }} /></Col>
          <Col><Statistic title="Fail" value={data?.fail ?? 0} styles={{ content: { color: "#cf1322" } }} /></Col>
          <Col><Statistic title="Rework" value={data?.rework ?? 0} styles={{ content: { color: "#d48806" } }} /></Col>
        </Row>
      </Card>

      <Alert
        type="info"
        message={`Forward traceability (where-used): every unit built from ${product ?? "any model"} — use this to scope a recall. Backward (as-built) is on each unit's row in Production Records.`}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col xs={24} lg={17}>
          <Card title="Affected units" size="small">
            <Table rowKey="id" size="small" columns={columns} dataSource={data?.units ?? []} pagination={{ pageSize: 12 }} />
          </Card>
        </Col>
        <Col xs={24} lg={7}>
          <Card title="Pass vs Fail" size="small">
            <PassFailDonut good={data?.pass ?? 0} reject={data?.fail ?? 0} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
