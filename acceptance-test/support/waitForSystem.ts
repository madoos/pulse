import { API_URL, BASE_URL } from './environment';

const TIMEOUT_MS = 120_000;

const isUp = async (url: string) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

/** Waits until the API and the web answer, so the first test does not fail while they start. */
export default async function waitForSystem() {
  const deadline = Date.now() + TIMEOUT_MS;
  for (const url of [`${API_URL}/health`, BASE_URL]) {
    while (!(await isUp(url))) {
      if (Date.now() > deadline) throw new Error(`${url} is not up: start it with docker compose`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
