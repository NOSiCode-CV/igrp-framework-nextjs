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
 */
const config: TestRunnerConfig = {
  async postVisit(page, context) {
    // Wait for the story to be fully rendered
    await page.waitForSelector('#storybook-root', { state: 'attached' });

    const elementHandler = await page.$('#storybook-root');
    if (!elementHandler) {
      throw new Error('Could not find #storybook-root element');
    }

    const innerHTML = await elementHandler.innerHTML();
    await elementHandler.dispose();

    // Snapshot the rendered HTML for visual regression
    expect(innerHTML).toMatchSnapshot();
  },
};

export default config;
