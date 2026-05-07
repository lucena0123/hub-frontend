export type PyramidMetric = {
  label: string;
  value: string;
};

export type PyramidLayer = {
  key: string;
  title: string;
  primary: string;
  metrics: PyramidMetric[];
};

export type KpiCard = {
  label: string;
  value: string;
  helper: string;
};

export type KpiGroup = {
  title: string;
  items: KpiCard[];
};
