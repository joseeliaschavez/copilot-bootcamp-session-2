const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('TODO workflow', () => {
  test('creates a task with due date', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await todoPage.addTask('E2E Create Task', '2028-05-18');

    await expect(page.getByText('E2E Create Task')).toBeVisible();
    await expect(page.getByText('Due: 2028-05-18')).toBeVisible();
  });

  test('edits an existing task', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await todoPage.addTask('E2E Edit Target', '2028-06-01');
    await todoPage.beginEditForTask('E2E Edit Target');

    const activeEditForm = page.locator('.edit-form').first();
    await activeEditForm.getByLabel('Task name').fill('E2E Task Updated');
    await activeEditForm.getByLabel('Due date').fill('2029-01-01');
    await activeEditForm.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('E2E Task Updated')).toBeVisible();
    await expect(page.getByText('Due: 2029-01-01')).toBeVisible();
  });

  test('keeps tasks in descending due date order', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await todoPage.addTask('Later Date Task', '2030-12-01');
    await todoPage.addTask('Earlier Date Task', '2027-01-01');

    const names = await todoPage.taskTexts();
    const laterIndex = names.indexOf('Later Date Task');
    const earlierIndex = names.indexOf('Earlier Date Task');

    expect(laterIndex).toBeGreaterThanOrEqual(0);
    expect(earlierIndex).toBeGreaterThanOrEqual(0);
    expect(laterIndex).toBeLessThan(earlierIndex);
  });

  test('validates due date format errors from backend', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await page.route('**/api/items', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Due date must be in YYYY-MM-DD format' }),
        });
        return;
      }

      await route.continue();
    });

    await todoPage.addTask('Bad Date Task', '2028-01-31');
    await expect(page.getByRole('alert')).toContainText('Error adding item: Due date must be in YYYY-MM-DD format');
  });

  test('deletes a task', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    await todoPage.addTask('E2E Delete Target', '2028-04-10');
    await expect(page.getByText('E2E Delete Target')).toBeVisible();

    await todoPage.deleteTask('E2E Delete Target');
    await expect(page.getByText('E2E Delete Target')).not.toBeVisible();
  });

  test('supports mobile viewport interactions', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await todoPage.addTask('Mobile Task', '2028-07-20');

    await expect(page.getByText('Mobile Task')).toBeVisible();
    await context.close();
  });
});
