// Module 9: Videos Functionality Test
// Using real credentials: tessasaji2026@mca.ajce.in / Tessa@12345
import { test, expect } from '@playwright/test';
import { clearStorage } from './utils/testHelpers.js';

const USER_EMAIL = 'tessasaji2026@mca.ajce.in';
const USER_PASSWORD = 'Tessa@12345';

test.describe('Module 9: Videos Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test('Test Case 9: View video gallery', async ({ page }) => {
        await test.step('Step 1: Login', async () => {
            await page.goto('/login');
            await page.fill('input[name="email"], input[type="email"]', USER_EMAIL);
            await page.fill('input[name="password"], input[type="password"]', USER_PASSWORD);
            await page.locator('button[type="submit"], button.login-btn, button:has-text("Login"), button:has-text("Sign In")').first().click();
            await page.waitForURL(/\/(student|teacher|admin)-dashboard/, { timeout: 20000 });
        });

        await test.step('Step 2: Navigate to videos page', async () => {
            // Try sidebar first
            const videosButton = page.locator('button:has-text("Videos"), .nav-item:has-text("Videos"), a:has-text("Videos")').first();
            if (await videosButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await videosButton.click();
            } else {
                await page.goto('/videos');
            }
            await page.waitForTimeout(3000);
        });

        await test.step('Step 3: Verify video gallery', async () => {
            // Wait for loading
            await expect(page.locator('.loading, text=Loading')).not.toBeVisible({ timeout: 20000 }).catch(() => { });

            // Check for videos
            const videoElements = page.locator('.video-card, iframe, .video-player, video, h1:has-text("Video"), h2:has-text("Video")').first();
            await expect(videoElements).toBeVisible({ timeout: 20000 });
            // Verify at least one demo video title
            await expect(page.locator('text=Understanding pH & Neutralization')).toBeVisible();
        });

        await test.step('Step 4: Verify video embeds (iframes)', async () => {
            const iframes = page.locator('iframe');
            await expect(iframes.first()).toBeVisible();
            const src = await iframes.first().getAttribute('src');
            expect(src).toContain('youtube');
        });
    });
});
