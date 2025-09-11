import { test, expect } from '@playwright/test';

test.describe('Monday.com Style Interface', () => {
  test('should load the main interface with all components', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main elements are present
    await expect(page.getByText('Smart Task Management')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Projects')).toBeVisible();
    
    // Check kanban board columns
    await expect(page.getByText('TODO')).toBeVisible();
    await expect(page.getByText('IN PROGRESS')).toBeVisible();
    await expect(page.getByText('COMPLETED')).toBeVisible();
    
    // Check task cards are present
    await expect(page.getByText('First Task')).toBeVisible();
    await expect(page.getByText('Second Task')).toBeVisible();
    
    // Check right panel task details
    await expect(page.getByText('This is the first task')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should have working navigation items', async ({ page }) => {
    await page.goto('/');
    
    // Test clicking on different sidebar items
    await page.getByRole('button', { name: 'Projects' }).click();
    
    await page.getByRole('button', { name: 'Chats' }).click();
    
    // Should be able to return to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
  });

  test('should display task priorities correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check priority badges are visible
    await expect(page.getByText('High Priority')).toBeVisible();
    await expect(page.getByText('Low Priority')).toBeVisible();
  });

  test('should show project dropdown functionality', async ({ page }) => {
    await page.goto('/');
    
    // Check project selector is present
    await expect(page.getByText('My Project')).toBeVisible();
    
    // Check tabs are present
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Board' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Timeline' })).toBeVisible();
  });

  test('should have responsive layout elements', async ({ page }) => {
    await page.goto('/');
    
    // Check main layout areas
    const sidebar = page.locator('[role="button"]:has-text("Dashboard")').first();
    const mainContent = page.getByText('TODO');
    const detailPanel = page.getByText('Schedule me an appointment');
    
    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
    await expect(detailPanel).toBeVisible();
  });
});