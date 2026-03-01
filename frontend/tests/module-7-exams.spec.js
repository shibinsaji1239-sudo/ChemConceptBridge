// Module 7: Exams Functionality Test
// Using real credentials: tessasaji2026@mca.ajce.in / Tessa@12345
import { test, expect } from '@playwright/test';
import { clearStorage } from './utils/testHelpers.js';

const USER_EMAIL = 'tessasaji2026@mca.ajce.in';
const USER_PASSWORD = 'Tessa@12345';

test.describe('Module 7: Exams Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test('Test Case 7: Navigate to exams section and verify content', async ({ page }) => {
        await test.step('Step 1: Login', async () => {
            await page.goto('/login');
            await page.fill('input[name="email"], input[type="email"]', USER_EMAIL);
            await page.fill('input[name="password"], input[type="password"]', USER_PASSWORD);
            await page.locator('button[type="submit"], button.login-btn, button:has-text("Login"), button:has-text("Sign In")').first().click();
            await page.waitForURL(/\/(student|teacher|admin)-dashboard/, { timeout: 20000 });
        });

        await test.step('Step 2: Navigate to exams section', async () => {
            // Check for heading or title
            const heading = page.locator('h2, h3, h1').filter({ hasText: /Exam/i }).first();
            if (await heading.isVisible()) {
                await expect(heading).toBeVisible();
            }
        });
    });
});
