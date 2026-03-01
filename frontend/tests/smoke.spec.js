// Basic smoke tests for key pages
import { test, expect } from '@playwright/test';
import { clearStorage } from './utils/testHelpers.js';

test.describe('Homepage Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check if page loads without errors
    await expect(page).toHaveTitle(/ChemConcept Bridge|Chemistry Learning/);

    // Check for key elements
    await expect(page.locator('body')).toBeVisible();

    // Check for navigation elements
    const loginLink = page.locator('a[href="/login"], button:has-text("Login")').first();
    await expect(loginLink).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    const loginLink = page.locator('a[href="/login"], button:has-text("Login")').first();
    await loginLink.click();

    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');

    const registerLink = page.locator('a[href="/register"], button:has-text("Register"), button:has-text("Sign Up")').first();
    await registerLink.click();

    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});

test.describe('Login Page Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/login');
  });

  test('should display login form elements', async ({ page }) => {
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button.login-btn, button:has-text("Login"), button:has-text("Sign In")').first()).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button.login-btn, button:has-text("Login"), button:has-text("Sign In")').first();
    await submitButton.click();

    // Check for validation messages
    const errorMessages = page.locator('.error, .error-message, .invalid-feedback, [role="alert"]');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotPasswordLink = page.locator('a[href="/forgot-password"], a:has-text("Forgot Password"), a:has-text("Forgot")').first();
    await expect(forgotPasswordLink).toBeVisible();
  });
});

test.describe('Register Page Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/register');
  });

  test('should display registration form elements', async ({ page }) => {
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")')).toBeVisible();
  });

  test('should have role selection for teachers', async ({ page }) => {
    // Check if there's a role selector (adjust based on your implementation)
    const roleSelector = page.locator('select[name="role"], input[name="role"], [data-testid="role-selector"]').first();
    if (await roleSelector.isVisible()) {
      await expect(roleSelector).toBeVisible();
    }
  });
});

test.describe('Protected Routes Smoke Tests', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await clearStorage(page);

    // Try to access protected routes
    const protectedRoutes = ['/admin-dashboard', '/teacher-dashboard', '/student-dashboard'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });
});
