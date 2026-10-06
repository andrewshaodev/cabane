import test from "node:test";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";

test("the real receiving route needs no local workspace and malformed links offer recovery", async () => {
  const { server } = await getBrowserTestServer("app");
  let browser;
  try {
    browser = await createBrowserTestSession();
    const page = await browser.newPage();
    const base = server.resolvedUrls.local[0];
    await page.goto(`${base}open/home-123?ha=https%3A%2F%2Fha.example&view=dashboard`);
    await page.getByRole("button", { name: "Sign in & open" }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Sign in & open" }).waitFor();
    await page.goto(`${base}open/home-123?ha=javascript:bad`);
    await page.getByRole("heading", { name: "This link is incomplete" }).waitFor();
    await page.getByRole("link", { name: "Open from Home Assistant" }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByLabel("Home Assistant address").waitFor();
  } finally {
    await browser?.close();
  }
});
