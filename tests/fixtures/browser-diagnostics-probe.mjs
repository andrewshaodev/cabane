import test from "node:test";
import { withBrowserDiagnostics } from "../browser-test-diagnostics.mjs";
import { createBrowserTestSession } from "../browser-test-environment.mjs";

test(
  "intentional browser diagnostic failure",
  withBrowserDiagnostics(async () => {
    const session = await createBrowserTestSession();
    try {
      const page = await session.newPage();
      await page.setContent("<h1>Diagnostic evidence</h1>");
      const pageError = page.waitForEvent("pageerror");
      await page.evaluate(() => {
        console.error("diagnostic console error");
        setTimeout(() => {
          throw new Error("diagnostic page error");
        }, 0);
      });
      await pageError;
      throw new Error("intentional assertion failure");
    } finally {
      await session.close();
    }
  }),
);
