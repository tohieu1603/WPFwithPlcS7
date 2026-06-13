"use client";

import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Statistic } from "antd";
import { getRecords } from "@/lib/api";
import { VisionScoreTrend, GapTrend, GradeDistribution } from "@/components/Charts";

export default function QualityPage() {
  const { data } = useQuery({
    queryKey: ["qualityRecords"],
    queryFn: () => getRecords({ page: 1, pageSize: 60 }),
  });
  const recs = data?.rows ?? [];
  const pass = recs.filter((r) => r.disposition === "PASS").length;
  const passRate = recs.length ? (pass / recs.length) * 100 : 0;
  const avgScore = recs.length ? recs.reduce((s, r) => s + r.visionScore, 0) / recs.length : 0;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Sampled units" value={recs.length} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Pass rate" value={passRate} precision={1} suffix="%" /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Avg vision score" value={avgScore} precision={1} suffix="%" /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Total in DB" value={data?.total ?? 0} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Vision match score (last 60 units)" size="small">
            <VisionScoreTrend records={recs} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Gap measurement - SPC band" size="small">
            <GapTrend records={recs} />
          </Card>
        </Col>
      </Row>

      <Card title="Print grade distribution" size="small">
        <GradeDistribution records={recs} />
      </Card>
    </div>
  );
}
