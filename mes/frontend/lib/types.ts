export interface MachineState {
  state: string;
  mode: string;
  running: boolean;
  lineRate: number;
  airPressure: number;
  activeAlarms: number;
  updatedAt: string;
}

export interface Kpi {
  good: number;
  reject: number;
  total: number;
  fpy: number;
  throughput: number;
  rejVision: number;
  rejBarcode: number;
  rejVerify: number;
  rejAssembly: number;
  runtime: number;
  downtime: number;
  createdAt: string;
}

export interface Oee {
  availability: number;
  performance: number;
  quality: number;
  overall: number;
}

export interface ProductionRecord {
  id: number;
  serial: string;
  product: string;
  barcode: string;
  visionPass: boolean;
  visionScore: number;
  gap: number;
  bore: number;
  grade: string;
  disposition: string;
  failReason: string;
  createdAt: string;
}

export interface AlarmRow {
  id: number;
  name: string;
  priority: string;
  station: string;
  description: string;
  active: boolean;
  raisedAt: string;
  clearedAt?: string | null;
}

export interface Recipe {
  id: number;
  number: number;
  name: string;
  gapNominal: number;
  gapTol: number;
  visionMinScore: number;
  pressForce: number;
  screwTorque: number;
  cycleTarget: number;
  barcodeMinGrade: number;
  updatedAt: string;
}

export interface Station {
  code: string;
  name: string;
  status: string;
  fault: boolean;
  count: number;
  cycleTime: number;
  updatedAt: string;
}

export interface Dashboard {
  state: MachineState | null;
  kpi: Kpi | null;
  recentRecords: ProductionRecord[];
  activeAlarms: AlarmRow[];
  stations: Station[];
  oee: Oee;
}

export interface OeePoint {
  t: string;
  availability: number;
  performance: number;
  quality: number;
  overall: number;
}

export interface SpcStats {
  mean: number;
  sigma: number;
  ucl: number;
  lcl: number;
  min: number;
  max: number;
}

export interface QualityData {
  records: ProductionRecord[];
  count: number;
  passRate: number;
  score: SpcStats;
  gap: SpcStats;
  gradeDist: { grade: string; count: number }[];
  pareto: { reason: string; count: number }[];
}

export interface AlarmStats {
  activeCount: number;
  totalEvents: number;
  byPriority: Record<string, number>;
  byStation: { station: string; count: number }[];
  avgDurationSec: number;
}

export interface ShiftOee {
  shift: string;
  availability: number;
  performance: number;
  quality: number;
  overall: number;
  throughput: number;
  samples: number;
}

export interface DowntimeRow {
  cause: string;
  station: string;
  downtimeSec: number;
  count: number;
}

export interface ProductCount {
  product: string;
  count: number;
}

export interface WhereUsed {
  units: ProductionRecord[];
  total: number;
  pass: number;
  fail: number;
  rework: number;
}

export interface StationStep {
  code: string;
  name: string;
  status: string;
  detail: string;
}

export interface RecordDetail {
  record: ProductionRecord;
  timeline: StationStep[];
}
