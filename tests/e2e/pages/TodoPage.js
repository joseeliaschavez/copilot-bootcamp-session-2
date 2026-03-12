class TodoPage {
  constructor(page) {
    this.page = page;
    this.taskNameInput = page.getByLabel('Task name').first();
    this.dueDateInput = page.getByLabel('Due date').first();
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async addTask(name, dueDate) {
    await this.taskNameInput.fill(name);
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    await this.addTaskButton.click();
  }

  taskItemByName(name) {
    return this.page
      .locator('.task-item')
      .filter({ has: this.page.locator('.task-name', { hasText: new RegExp(`^${name}$`) }) })
      .first();
  }

  async beginEditForTask(name) {
    const item = this.taskItemByName(name);
    await item.getByRole('button', { name: 'Edit' }).click();
  }

  async saveEdit(name, dueDate) {
    const item = this.taskItemByName(name);
    await item.getByLabel('Task name').fill(name);
    await item.getByLabel('Due date').fill(dueDate);
    await item.getByRole('button', { name: 'Save' }).click();
  }

  async deleteTask(name) {
    await this.taskItemByName(name).getByRole('button', { name: 'Delete' }).click();
  }

  async taskTexts() {
    const items = this.page.locator('.task-item .task-name');
    return await items.allTextContents();
  }
}

module.exports = { TodoPage };
