"use client";

import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Statistic, Tag, Table, List, Empty, Progress, Badge } from "antd";
import { getDashboard, getKpiHistory, getOeeHistory, getOeeByShift } from "@/lib/api";
import { ProductionTrend, RejectPareto, ThroughputTrend, PassFailDonut, StationCycleChart, OeeTrend, OeeByShift } from "@/components/Charts";
import { StationFlow } from "@/components/StationFlow";
import type { ProductionRecord } from "@/lib/types";

const dispColor = (d: string) => (d === "PASS" ? "success" : d === "FAIL" ? "error" : "default");
const prioColor = (p: string) =>
  p === "CRITICAL" ? "red" : p === "HIGH" ? "orange" : p === "MEDIUM" ? "gold" : "blue";
const gaugeColor = (v: number) => (v >= 85 ? "#52c41a" : v >= 65 ? "#faad14" : "#ff4d4f");

function MiniGauge({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <Progress type="dashboard" percent={value} size={92} strokeColor={gaugeColor(value)} gapDegree={60} />
      <div style={{ color: "#666", marginTop: -4 }}>{title}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const { data: history } = useQuery({ queryKey: ["kpiHistory"], queryFn: () => getKpiHistory(40) });
  const { data: oeeHistory } = useQuery({ queryKey: ["oeeHistory"], queryFn: () => getOeeHistory(40) });
  const { data: oeeShift } = useQuery({ queryKey: ["oeeByShift"], queryFn: getOeeByShift });

  const s = data?.state;
  const k = data?.kpi;
  const oee = data?.oee;
  const running = s?.state === "EXECUTE";

  const recCols = [
    { title: "Serial", dataIndex: "serial", key: "serial" },
    { title: "Product", dataIndex: "product", key: "product" },
    {
      title: "Vision",
      dataIndex: "visionScore",
      key: "vis",
      render: (v: number, r: ProductionRecord) => (r.visionPass ? `${v.toFixed(1)} %` : "FAIL"),
    },
    {
      title: "Result",
      dataIndex: "disposition",
      key: "disp",
      render: (d: string) => <Tag color={dispColor(d)}>{d}</Tag>,
    },
  ];

  return (
    <div>
      {/* state banner */}
      <Card style={{ marginBottom: 16 }} styles={{ body: { padding: "16px 24px" } }}>
        <Row gutter={24} align="middle">
          <Col>
            <div style={{ color: "#888", fontSize: 12 }}>MACHINE STATE</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s?.state ?? "-"}</div>
            <div style={{ marginTop: 4 }}>
              <Badge status={running ? "processing" : "default"} text={running ? "RUNNING" : "IDLE"} />
              <Tag style={{ marginLeft: 8 }}>{s?.mode ?? "-"}</Tag>
            </div>
          </Col>
          <Col flex="auto" />
          <Col><Statistic title="Line rate (ppm)" value={s?.lineRate ?? 0} precision={1} /></Col>
          <Col><Statistic title="Air (bar)" value={s?.airPressure ?? 0} precision={2} /></Col>
          <Col>
            <Statistic
              title="Active alarms"
              value={s?.activeAlarms ?? 0}
              styles={{ content: { color: (s?.activeAlarms ?? 0) > 0 ? "#cf1322" : undefined } }}
            />
          </Col>
        </Row>
      </Card>

      {/* OEE + KPI */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="OEE" size="small" style={{ height: "100%" }}>
            <Row align="middle">
              <Col span={12} style={{ textAlign: "center" }}>
                <Progress
                  type="dashboard"
                  percent={oee?.overall ?? 0}
                  size={150}
                  strokeColor={gaugeColor(oee?.overall ?? 0)}
                />
                <div style={{ color: "#666" }}>Overall</div>
              </Col>
              <Col span={12}>
                <Row gutter={[8, 8]}>
                  <Col span={24}><MiniGauge title="Availability" value={oee?.availability ?? 0} /></Col>
                </Row>
              </Col>
            </Row>
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col span={12}><MiniGauge title="Performance" value={oee?.performance ?? 0} /></Col>
              <Col span={12}><MiniGauge title="Quality" value={oee?.quality ?? 0} /></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} md={6}><Card size="small"><Statistic title="Good" value={k?.good ?? 0} styles={{ content: { color: "#3f8600" } }} /></Card></Col>
            <Col xs={12} md={6}><Card size="small"><Statistic title="Reject" value={k?.reject ?? 0} styles={{ content: { color: "#cf1322" } }} /></Card></Col>
            <Col xs={12} md={6}><Card size="small"><Statistic title="Total" value={k?.total ?? 0} /></Card></Col>
            <Col xs={12} md={6}><Card size="small"><Statistic title="Throughput (pph)" value={k?.throughput ?? 0} precision={0} /></Card></Col>
          </Row>
          <Card title="Reject Pareto" size="small">
            <RejectPareto kpi={k ?? null} />
          </Card>
        </Col>
      </Row>

      {/* live process flow */}
      <Card title="Process flow" size="small" style={{ marginBottom: 16 }}>
        <StationFlow stations={data?.stations ?? []} running={running} />
      </Card>

      {/* OEE trend + by shift */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="OEE trend (Availability / Performance / Quality)" size="small">
            <OeeTrend history={oeeHistory ?? []} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="OEE by shift" size="small">
            <OeeByShift rows={oeeShift ?? []} />
          </Card>
        </Col>
      </Row>

      {/* trend */}
      <Card title="Production trend (Good vs Reject)" size="small" style={{ marginBottom: 16 }}>
        <ProductionTrend history={history ?? []} />
      </Card>

      {/* more charts */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="Throughput & first-pass yield" size="small">
            <ThroughputTrend history={history ?? []} />
          </Card>
        </Col>
        <Col xs={24} lg={7}>
          <Card title="Good vs Reject" size="small">
            <PassFailDonut good={k?.good ?? 0} reject={k?.reject ?? 0} />
          </Card>
        </Col>
        <Col xs={24} lg={7}>
          <Card title="Station cycle time (bottleneck)" size="small">
            <StationCycleChart stations={data?.stations ?? []} />
          </Card>
        </Col>
      </Row>

      {/* recent + alarms */}
      <Row gutter={16}>
        <Col xs={24} lg={15}>
          <Card title="Recent units" size="small">
            <Table rowKey="id" size="small" pagination={false} columns={recCols} dataSource={data?.recentRecords ?? []} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="Active alarms" size="small">
            {data?.activeAlarms?.length ? (
              <List
                size="small"
                dataSource={data.activeAlarms}
                renderItem={(a) => (
                  <List.Item>
                    <Tag color={prioColor(a.priority)}>{a.priority}</Tag>
                    <span style={{ flex: 1 }}>{a.description}</span>
                    <span style={{ color: "#999" }}>{a.station}</span>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active alarms" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
