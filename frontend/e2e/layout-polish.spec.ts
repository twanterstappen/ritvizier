import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

test("plate clear buttons stay inside both input borders", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const route of ["/", "/auto/G-921-GS"]) {
    await page.goto(route);
    const input = page.getByRole("textbox", { name: "Kenteken", exact: true });
    await input.fill("G921GS");
    const clear = page.getByRole("button", {
      name: "Kenteken wissen",
      exact: true,
    });
    const bounds = await clear.evaluate((button) => {
      const control = button.getBoundingClientRect();
      const plate = button
        .closest(".plate-input-wrap")!
        .getBoundingClientRect();
      return {
        right: plate.right - control.right,
        top: control.top - plate.top,
        bottom: plate.bottom - control.bottom,
        width: control.width,
        height: control.height,
      };
    });
    expect(bounds.right).toBeGreaterThanOrEqual(3);
    expect(bounds.top).toBeGreaterThanOrEqual(3);
    expect(bounds.bottom).toBeGreaterThanOrEqual(3);
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    await mkdir(join(process.cwd(), "..", "artifacts", "layout-polish"), {
      recursive: true,
    });
    await page.screenshot({
      path: join(
        process.cwd(),
        "..",
        "artifacts",
        "layout-polish",
        `clear-${route === "/" ? "home" : "compact"}-${test.info().project.name}.png`,
      ),
    });
    await clear.click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
  }
});

test("short and long pages keep the footer at the end without a mobile gap", async ({
  page,
}) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const route of ["/opgeslagen", "/"]) {
      await page.goto(route);
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const footer = document
              .querySelector(".site-footer")!
              .getBoundingClientRect();
            const nav = document
              .querySelector(".mobile-nav")!
              .getBoundingClientRect();
            const mobile =
              getComputedStyle(document.querySelector(".mobile-nav")!)
                .display !== "none";
            return Math.abs(
              (mobile ? nav.bottom : footer.bottom) - innerHeight,
            );
          }),
        )
        .toBeLessThanOrEqual(1);
      const colors = await page.evaluate(() =>
        [
          document.body,
          document.querySelector(".site-header")!,
          document.querySelector(".site-footer")!,
          document.querySelector(".mobile-nav")!,
        ].map((element) => getComputedStyle(element).backgroundColor),
      );
      expect(new Set(colors).size).toBe(1);
      if (width < 768) {
        await expect
          .poll(() =>
            page.evaluate(() =>
              Math.abs(
                document.querySelector(".mobile-nav")!.getBoundingClientRect()
                  .top -
                  document
                    .querySelector(".site-footer")!
                    .getBoundingClientRect().bottom,
              ),
            ),
          )
          .toBeLessThanOrEqual(1);
      }
      await mkdir(join(process.cwd(), "..", "artifacts", "layout-polish"), {
        recursive: true,
      });
      await page.screenshot({
        path: join(
          process.cwd(),
          "..",
          "artifacts",
          "layout-polish",
          `footer-${route === "/" ? "long" : "short"}-${width}-${test.info().project.name}.png`,
        ),
      });
    }
  }
});

test("mobile comparison aligns cars in a table and scrolls a third car", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/vergelijken");
  for (const plate of ["GZS88X", "P185BH"]) {
    await page.getByLabel("Kenteken voor vergelijking").fill(plate);
    await page.getByRole("button", { name: "Toevoegen", exact: true }).click();
    await expect(page.getByLabel("Kenteken voor vergelijking")).toHaveValue("");
  }
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveCount(3);
  await expect(table.locator(".plate-badge")).toHaveCount(0);
  await expect(page.locator(".skip-link")).not.toBeFocused();
  const headings = await table
    .locator("thead h2")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().top),
    );
  expect(headings[0]).toBe(headings[1]);
  await expect(
    table.getByRole("row", { name: /^Bouwjaar/ }).getByRole("cell"),
  ).toHaveCount(2);
  const region = page.getByRole("region", { name: "Voertuigvergelijking" });
  expect(
    await region.evaluate((node) => node.scrollWidth - node.clientWidth),
  ).toBeLessThanOrEqual(1);
  await page.getByLabel("Kenteken voor vergelijking").fill("G921GS");
  await page.getByRole("button", { name: "Toevoegen", exact: true }).click();
  await expect(table.getByRole("columnheader")).toHaveCount(4);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => region.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page
    .getByRole("button", { name: "Verwijder G-921-GS uit vergelijking" })
    .click();
  await expect(table.getByRole("columnheader")).toHaveCount(3);
  await mkdir(join(process.cwd(), "..", "artifacts", "layout-polish"), {
    recursive: true,
  });
  await page.screenshot({
    path: join(
      process.cwd(),
      "..",
      "artifacts",
      "layout-polish",
      `comparison-${test.info().project.name}.png`,
    ),
    fullPage: true,
    style: ".skip-link { visibility: hidden; }",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: join(
      process.cwd(),
      "..",
      "artifacts",
      "layout-polish",
      `comparison-desktop-${test.info().project.name}.png`,
    ),
    animations: "disabled",
    fullPage: true,
    style: ".skip-link { visibility: hidden; }",
  });
});

test("non-import registration age is not applicable and the new favicon is linked", async ({
  page,
}) => {
  await page.goto("/auto/G-921-GS");
  await page
    .locator(".section-tabs")
    .getByRole("button", { name: "Tellerstand & historie", exact: true })
    .click();
  const age = page
    .locator(".data-row")
    .filter({ hasText: "Leeftijd bij Nederlandse registratie" });
  await expect(age.getByRole("definition")).toHaveText("Niet van toepassing");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/favicon-r.svg",
  );
  const svg = await page.request.get("/favicon-r.svg");
  expect(svg.ok()).toBe(true);
  expect(await svg.text()).toContain('fill="#ffffff"');
  const ico = await page.request.get("/favicon.ico");
  expect(ico.ok()).toBe(true);
  expect((await ico.body()).subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
});
