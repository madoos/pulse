/** An advisory firm with the basic data the listing shows. */
export type AdvisoryFirmSummary = {
  id: number;
  name: string;
  province: string;
  city: string;
  employees: number;
  specialty: string;
};

/** What the listing is narrowed to. Every criterion is optional. */
export type FirmCriteria = { search?: string; provinceId?: number; specialtyCode?: string };

/** Where a firm sits in the listing, which is sorted by name and then by id. */
export type FirmKey = { name: string; id: number };

export type FirmFilters = {
  provinces: { id: number; name: string }[];
  specialties: { code: string; name: string }[];
};

export type AdvisoryFirmRepository = {
  /** Up to `limit` firms that meet the criteria, sorted by name and id, after `after` if given. */
  page: (
    criteria: FirmCriteria,
    after: FirmKey | null,
    limit: number,
  ) => Promise<AdvisoryFirmSummary[]>;
  /** How many firms meet the criteria. */
  count: (criteria: FirmCriteria) => Promise<number>;
  /** The provinces and specialties that have firms, by name. */
  filters: () => Promise<FirmFilters>;
};
