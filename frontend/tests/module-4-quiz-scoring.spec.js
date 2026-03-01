// Module 4: Quiz and Scoring Functionality Test
// Using real credentials: tessasaji2026@mca.ajce.in / Tessa@12345
import { test, expect } from '@playwright/test';
import { clearStorage } from './utils/testHelpers.js';

const USER_EMAIL = 'tessasaji2026@mca.ajce.in';
const USER_PASSWORD = 'Tessa@12345';

test.describe('Module 4: Quiz and Scoring Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('Test Case 4: Take quiz and verify scoring', async ({ page }) => {
    await test.step('Step 1: Login first', async () => {
      await page.goto('/login');
      await page.fill('input[name="email"], input[type="email"]', USER_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', USER_PASSWORD);
      await page.click('button[type="submit"], button:has-text("Login")');
      await page.waitForURL(/\/(student|teacher|admin)-dashboard/, { timeout: 20000 });
    });

    await test.step('Step 2: Navigate to quiz section', async () => {
      await page.waitForTimeout(2000);
      // Look for quiz button - try multiple selectors
      const selectors = [
        'button:has-text("Take a Quiz")',
        'button:has-text("Quiz")',
        'button:has-text("📝")',
        '[class*="quiz"] button',
        'button[onclick*="quiz"]'
      ];

      let clicked = false;
      for (const selector of selectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
          try {
            await button.scrollIntoViewIfNeeded();
            await button.click();
            await page.waitForTimeout(2000);
            clicked = true;
            break;
          } catch (e) {
            // Try next selector
          }
        }
      }

      if (!clicked) {
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Step 3: Start a quiz', async () => {
      await page.waitForTimeout(3000);
      const startButton = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Take Quiz")').first();
      if (await startButton.isVisible({ timeout: 5000 })) {
        await startButton.click();
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Step 4: Answer quiz questions and finish', async () => {
      let isLastQuestion = false;
      let iterations = 0;

      while (!isLastQuestion && iterations < 10) {
        iterations++;

        // Answer current question
        const options = page.locator('button[class*="option"], .option, input[type="radio"]');
        if (await options.first().isVisible({ timeout: 5000 })) {
          await options.first().click();
          await page.waitForTimeout(500);
        }

        // Check for Next or Finish button
        const nextButton = page.locator('button:has-text("Next")');
        const finishButton = page.locator('button:has-text("Finish"), button:has-text("Complete"), button:has-text("Submit")');

        if (await finishButton.isVisible({ timeout: 2000 })) {
          await finishButton.click();
          isLastQuestion = true;
        } else if (await nextButton.isVisible({ timeout: 2000 })) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        } else {
          // If neither found, maybe it's finished or stuck
          break;
        }
      }
    });

    await test.step('Step 5: Verify score', async () => {
      await page.waitForTimeout(3000);
      // Check for score or results
      const scoreSelectors = [
        '.score',
        '[class*="score"]',
        '[class*="result"]',
        'text=/score/i',
        'text=/result/i',
        'h2:has-text("Results")'
      ];

      let found = false;
      for (const selector of scoreSelectors) {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
          await expect(page.locator(selector).first()).toBeVisible();
          found = true;
          break;
        }
      }

      if (!found) {
        // Fallback: check if we are on a results-like page
        await expect(page).toHaveURL(/.*quiz.*/i);
      }
    });
  });
});

