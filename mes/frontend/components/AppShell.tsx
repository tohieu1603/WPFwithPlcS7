"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  ApartmentOutlined,
  LineChartOutlined,
  ProfileOutlined,
  AlertOutlined,
  ExperimentOutlined,
  DeploymentUnitOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Sider, Header, Content } = Layout;

const items = [
  { key: "/", icon: <DashboardOutlined />, label: <Link href="/">Dashboard</Link> },
  { key: "/stations", icon: <ApartmentOutlined />, label: <Link href="/stations">Stations</Link> },
  { key: "/quality", icon: <LineChartOutlined />, label: <Link href="/quality">Quality</Link> },
  { key: "/records", icon: <ProfileOutlined />, label: <Link href="/records">Production Records</Link> },
  { key: "/genealogy", icon: <DeploymentUnitOutlined />, label: <Link href="/genealogy">Genealogy</Link> },
  { key: "/alarms", icon: <AlertOutlined />, label: <Link href="/alarms">Alarms</Link> },
  { key: "/recipes", icon: <ExperimentOutlined />, label: <Link href="/recipes">Recipes</Link> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth="0" style={{ borderRight: "1px solid #f0f0f0" }}>
        <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 20px", fontWeight: 700, fontSize: 18 }}>
          MES
        </div>
        <Menu mode="inline" selectedKeys={[path]} items={items} style={{ borderInlineEnd: 0 }} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            paddingInline: 24,
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            fontWeight: 600,
          }}
        >
          Vision Line © To Hieu
        </Header>
        <Content style={{ margin: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
