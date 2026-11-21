import { test as base, createBdd } from 'playwright-bdd';
import { AdvisoryFirmDetailPage } from '../pages/AdvisoryFirmDetailPage';
import { AppFrame } from '../pages/AppFrame';
import { LoginPage } from '../pages/LoginPage';
import { NetworkOverviewPage } from '../pages/NetworkOverviewPage';
import { Database } from './database';

type Fixtures = {
  db: Database;
  loginPage: LoginPage;
  networkOverview: NetworkOverviewPage;
  firmDetail: AdvisoryFirmDetailPage;
  app: AppFrame;
  /** What a step remembers for the next ones, such as the advisory firm it clicked. */
  memory: Map<string, string>;
};

export const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    const db = new Database();
    await use(db);
    await db.close();
  },
  networkOverview: async ({ page }, use) => use(new NetworkOverviewPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  firmDetail: async ({ page }, use) => use(new AdvisoryFirmDetailPage(page)),
  app: async ({ page }, use) => use(new AppFrame(page)),
  memory: async ({}, use) => use(new Map()),
});

export const { Given, When, Then } = createBdd(test);
