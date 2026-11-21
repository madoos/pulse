export type HealthIndicator = {
  name: string;
  isUp: () => Promise<boolean>;
};
