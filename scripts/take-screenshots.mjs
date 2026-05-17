/**
 * BudgetBuddy — UI Screenshot Script
 * Captures all key screens for the design agent asset pack.
 * Run: node scripts/take-screenshots.mjs
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../docs/screenshots");
mkdirSync(OUT, { recursive: true });

const WEB_URL = "http://localhost:3000";
const MARKETING_URL = "http://localhost:3001";

// Viewport presets
const DESKTOP = { width: 1440, height: 900 };
const LAPTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 }; // iPhone 15 Pro
const TABLET = { width: 768, height: 1024 };

async function shot(page, name, opts = {}) {
  const { fullPage = false, clip } = opts;
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage, clip, animations: "disabled" });
  console.log(`  ✓ ${name}.png`);
  return path;
}

async function waitForLoad(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  // Extra settle for chart animations
  await page.waitForTimeout(800);
  // Dismiss Clerk dev banner if present
  await page.evaluate(() => {
    // Remove Clerk dev mode overlay iframes/divs
    document
      .querySelectorAll(
        '[id*="clerk"], [class*="clerk-development"], iframe[src*="clerk"]'
      )
      .forEach((el) => el.remove());
    // Also hide any fixed-position banners from the bottom-right
    document.querySelectorAll("body > div:not(#__next)").forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.position === "fixed" || style.position === "absolute") {
        el.style.display = "none";
      }
    });
  });
  await page.waitForTimeout(100);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ── 1. MARKETING SITE ────────────────────────────────────────────────────

  console.log("\n📸 Marketing site...");
  {
    const page = await browser.newPage();

    // Desktop hero (above fold)
    await page.setViewportSize(DESKTOP);
    await page.goto(MARKETING_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "01-marketing-desktop-hero");

    // Desktop full page
    await shot(page, "02-marketing-desktop-full", { fullPage: true });

    // Features section
    await page.evaluate(() =>
      document.querySelector("#features")?.scrollIntoView()
    );
    await page.waitForTimeout(300);
    await shot(page, "03-marketing-desktop-features");

    // Pricing section
    await page.evaluate(() =>
      document.querySelector("#pricing")?.scrollIntoView()
    );
    await page.waitForTimeout(300);
    await shot(page, "04-marketing-desktop-pricing");

    // Mobile viewport - hero
    await page.setViewportSize(MOBILE);
    await page.goto(MARKETING_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "05-marketing-mobile-hero");

    // Mobile full page
    await shot(page, "06-marketing-mobile-full", { fullPage: true });

    await page.close();
  }

  // ── 2. WEB DASHBOARD (LIGHT MODE) ────────────────────────────────────────

  console.log("\n📸 Web dashboard — light mode...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(DESKTOP);

    // Force light mode via localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });

    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);

    // Full dashboard viewport
    await shot(page, "07-dashboard-desktop-light");

    // Stat cards closeup
    const statsEl = await page.$(".grid.gap-4.sm\\:grid-cols-2");
    if (statsEl) {
      const box = await statsEl.boundingBox();
      if (box) {
        await shot(page, "08-dashboard-stat-cards-light", {
          clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
        });
      }
    }

    // Scroll to budget + chart section and capture
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(400);
    await shot(page, "09-dashboard-budget-chart-light");

    // Scroll to transactions
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);
    await shot(page, "10-dashboard-transactions-light");

    // Full page scroll
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await shot(page, "11-dashboard-desktop-light-full", { fullPage: true });

    // Laptop viewport
    await page.setViewportSize(LAPTOP);
    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);
    await shot(page, "12-dashboard-laptop-light");

    await page.close();
  }

  // ── 3. WEB DASHBOARD (DARK MODE) ─────────────────────────────────────────

  console.log("\n📸 Web dashboard — dark mode...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(DESKTOP);

    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });

    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);

    // Click the dark mode toggle to ensure dark is applied
    const themeToggle = await page.$('button:has(.lucide-moon), button:has(.lucide-sun)');
    if (themeToggle) {
      // Check if we're already in dark mode by looking at html class
      const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark")
      );
      if (!isDark) {
        await themeToggle.click();
        await page.waitForTimeout(300);
      }
    }

    await shot(page, "13-dashboard-desktop-dark");
    await shot(page, "14-dashboard-desktop-dark-full", { fullPage: true });

    await page.close();
  }

  // ── 4. WEB DASHBOARD — MOBILE VIEWPORT ───────────────────────────────────

  console.log("\n📸 Web dashboard — mobile viewport...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(MOBILE);

    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });

    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);

    await shot(page, "15-dashboard-mobile-light-top");

    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);
    await shot(page, "16-dashboard-mobile-light-budget");

    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);
    await shot(page, "17-dashboard-mobile-light-transactions");

    // Full page mobile
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "18-dashboard-mobile-light-full", { fullPage: true });

    // Dark mobile
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);
    await shot(page, "19-dashboard-mobile-dark-full", { fullPage: true });

    await page.close();
  }

  // ── 5. WEB AUTH PAGES ────────────────────────────────────────────────────

  console.log("\n📸 Auth pages...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(DESKTOP);
    // Clerk loads external resources so use domcontentloaded + settle wait
    await page.goto(`${WEB_URL}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "20-sign-in-desktop");

    await page.setViewportSize(MOBILE);
    await page.goto(`${WEB_URL}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await shot(page, "21-sign-in-mobile");

    await page.close();
  }

  // ── 6. SIDEBAR DETAIL SHOTS ───────────────────────────────────────────────

  console.log("\n📸 Sidebar detail...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(DESKTOP);
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);

    // Crop just the sidebar
    await shot(page, "22-sidebar-expanded-light", {
      clip: { x: 0, y: 0, width: 264, height: 900 },
    });

    // Dark sidebar
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);
    await shot(page, "23-sidebar-expanded-dark", {
      clip: { x: 0, y: 0, width: 264, height: 900 },
    });

    await page.close();
  }

  // ── 7. COMPONENT DETAIL SHOTS ─────────────────────────────────────────────

  console.log("\n📸 Component details...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(DESKTOP);
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);

    // Budget gauge card
    const cards = await page.$$(".space-y-6 > div");
    // Scroll to budget section
    await page.evaluate(() => window.scrollBy(0, 380));
    await page.waitForTimeout(400);

    // Capture the two-column grid
    const twoColGrid = await page.$(".grid.gap-6.lg\\:grid-cols-2");
    if (twoColGrid) {
      const box = await twoColGrid.boundingBox();
      if (box) {
        await shot(page, "24-budget-gauge-and-chart", {
          clip: { x: box.x, y: box.y, width: box.width, height: box.height },
        });
      }
    }

    await page.close();
  }

  // ── 8. TABLET VIEWS ───────────────────────────────────────────────────────

  console.log("\n📸 Tablet views...");
  {
    const page = await browser.newPage();
    await page.setViewportSize(TABLET);
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`${WEB_URL}/demo`, { waitUntil: "networkidle" });
    await waitForLoad(page);
    await shot(page, "25-dashboard-tablet-light");
    await shot(page, "26-dashboard-tablet-light-full", { fullPage: true });
    await page.close();
  }

  await browser.close();

  // ── SUMMARY ───────────────────────────────────────────────────────────────

  console.log(`
✅ Screenshots complete!
📁 Saved to: docs/screenshots/
   Total: 26 screenshots covering:
   • Marketing site (desktop + mobile, hero + full + sections)
   • Web dashboard — light & dark (desktop, laptop, tablet, mobile)
   • Sidebar detail shots (light + dark)
   • Component closeups (stat cards, budget gauge, chart, transactions)
   • Auth pages (sign-in desktop + mobile)
`);
}

run().catch((err) => {
  console.error("Screenshot script failed:", err);
  process.exit(1);
});
