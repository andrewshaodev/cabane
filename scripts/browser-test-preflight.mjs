import { createServer } from "node:net";
import { chromium } from "playwright-core";

export async function browserTestPreflight() {
  try {
    await new Promise((resolve, reject) => {
      const server = createServer();
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    });
  } catch (error) {
    throw new Error(
      `Browser test preflight: cannot bind localhost (${error.code}). Run with approved local-server permissions. No test shards started.`,
      { cause: error },
    );
  }
  try {
    const browser = await chromium.launch({ channel: "chromium", headless: true });
    await browser.close();
  } catch (error) {
    throw new Error(
      `Browser test preflight: Chromium cannot start. Install the pinned browser with npm run browser:install and run with approved browser-process permissions. No test shards started.\n${error.message}`,
      { cause: error },
    );
  }
}
