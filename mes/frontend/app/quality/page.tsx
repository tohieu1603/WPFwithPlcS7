"use client";

import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Statistic } from "antd";
import { getQuality } from "@/lib/api";
import { SpcChart, ParetoChart, GradeDistribution } from "@/components/Charts";

export default function QualityPage() {
  const { data } = useQuery({ queryKey: ["quality"], queryFn: () => getQuality(120) });

  const recs = data?.records ?? [];
  const scores = recs.filter((r) => r.visionScore > 0).map((r) => r.visionScore);
  const gaps = recs.filter((r) => r.gap > 0).map((r) => r.gap);
  const score = data?.score;
  const gap = data?.gap;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Sampled units" value={data?.count ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Pass rate" value={data?.passRate ?? 0} precision={1} suffix="%" /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Vision mean" value={score?.mean ?? 0} precision={1} suffix="%" /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Gap mean ± 3σ" value={gap?.mean ?? 0} precision={3} suffix="mm" />
            <div style={{ color: "#999", fontSize: 12 }}>σ {(gap?.sigma ?? 0).toFixed(3)} · {(gap?.lcl ?? 0).toFixed(3)}–{(gap?.ucl ?? 0).toFixed(3)}</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Vision score — SPC control chart" size="small">
            <SpcChart values={scores} mean={score?.mean ?? 0} ucl={score?.ucl ?? 0} lcl={score?.lcl ?? 0}
              unit="%" color="#1677ff" domain={[70, 100]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Gap measurement — SPC control chart" size="small">
            <SpcChart values={gaps} mean={gap?.mean ?? 0} ucl={gap?.ucl ?? 0} lcl={gap?.lcl ?? 0}
              unit="mm" color="#722ed1" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Reject Pareto (cumulative)" size="small">
            <ParetoChart data={data?.pareto ?? []} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Print grade distribution" size="small">
            <GradeDistribution records={recs} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
