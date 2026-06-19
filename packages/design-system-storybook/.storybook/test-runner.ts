/// <reference types="jest" />
import type { TestRunnerConfig } from '@storybook/test-runner';

/**
 * Test runner config for visual/snapshot regression testing.
 * Runs HTML snapshot tests on each story - compares rendered output against baselines.
 *
 * Usage:
 * 1. Start Storybook: pnpm storybook
 * 2. In another terminal: pnpm test-storybook
 * 3. Update snapshots: pnpm test-storybook:update-snapshots
 *
 * Determinism measures (HTML snapshots are easily made flaky):
 * - CSS animations/transitions are disabled (preVisit).
 * - Remote resources are awaited (network idle) and every <img> is awaited to a
 *   settled state, so image-vs-fallback races don't change the markup per run.
 * - The DOM is polled until it stops mutating so JS-driven animations settle.
 * - Framework-generated IDs (React useId `_r_N_` / `:rN:`, Radix `radix-…`) are
 *   normalized to stable placeholders before snapshotting — they legitimately
 *   differ run-to-run and must not be treated as regressions.
 *
 * Some stories are smoke-tested (rendered without error) but NOT HTML-snapshotted
 * because their markup is inherently non-deterministic for HTML snapshots:
 * - Charts: recharts' ResponsiveContainer settles at sub-pixel-varying widths per run.
 * - Avatar: Radix swaps the fallback for a remote <img> asynchronously, so the markup
 *   depends on remote-image load timing (and on whether the host is reachable at all).
 * Both are covered visually by Chromatic (pixel diffing with a fixed viewport) instead.
 */

/** Story id prefixes whose markup is not deterministic enough for HTML snapshots. */
const SNAPSHOT_EXCLUDE_PREFIXES = ['components-charts', 'components-avatar'];

/** Replace framework-generated, run-varying IDs with stable placeholders. */
function normalizeDynamicIds(html: string): string {
  return html
    .replace(/_r_[0-9a-z]+_/gi, '_r_ID_')
    .replace(/:r[0-9a-z]+:/gi, ':rID:')
    .replace(/radix-[^"'\s>]+/gi, 'radix-ID');
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }`,
    });
  },

  async postVisit(page, context) {
    // Wait for the story to be fully rendered
    await page.waitForSelector('#storybook-root', { state: 'attached' });

    // Let remote resources (e.g. avatar images) finish loading. Bounded: live
    // embeds (e.g. YouTube iframes) never reach network idle, so cap the wait.
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});

    // Wait for every <img> to reach a settled state (loaded or errored) so the
    // image-vs-fallback markup is the same on every run. Capped so a silently
    // blocked image can't hang the test.
    await page
      .evaluate(
        () =>
          Promise.race([
            Promise.all(
              Array.from(document.images).map((img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise<void>((resolve) => {
                      img.addEventListener('load', () => resolve(), { once: true });
                      img.addEventListener('error', () => resolve(), { once: true });
                    }),
              ),
            ).then(() => undefined),
            new Promise<void>((resolve) => setTimeout(resolve, 3000)),
          ]),
      )
      .catch(() => {});

    const elementHandler = await page.$('#storybook-root');
    if (!elementHandler) {
      throw new Error('Could not find #storybook-root element');
    }

    // These stories render fine (smoke-test passes) but are not deterministic
    // enough for HTML snapshots — skip snapshotting them here (see header note).
    if (SNAPSHOT_EXCLUDE_PREFIXES.some((prefix) => context.id.startsWith(prefix))) {
      await elementHandler.dispose();
      return;
    }

    // Poll until the rendered HTML stops changing so JS-driven animations
    // settle to their final state before snapshotting.
    let previous = '';
    for (let i = 0; i < 50; i++) {
      const current = await elementHandler.innerHTML();
      if (current === previous) break;
      previous = current;
      await page.waitForTimeout(100);
    }

    const innerHTML = await elementHandler.innerHTML();
    await elementHandler.dispose();

    // Snapshot the rendered HTML for visual regression
    expect(normalizeDynamicIds(innerHTML)).toMatchSnapshot();
  },
};

export default config;
