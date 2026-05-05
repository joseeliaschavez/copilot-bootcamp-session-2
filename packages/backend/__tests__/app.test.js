const { app, db, insertStmt } = require('../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('App module (unit)', () => {
  describe('exports', () => {
    it('should export the express app', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
      expect(typeof app.delete).toBe('function');
    });

    it('should export the database instance', () => {
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
      expect(typeof db.exec).toBe('function');
    });

    it('should export a prepared insert statement', () => {
      expect(insertStmt).toBeDefined();
      expect(typeof insertStmt.run).toBe('function');
    });
  });

  describe('database initialization', () => {
    it('should create the items table', () => {
      const tableInfo = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items'")
        .get();
      expect(tableInfo).toBeDefined();
      expect(tableInfo.name).toBe('items');
    });

    it('should seed the database with initial items', () => {
      const items = db.prepare('SELECT * FROM items').all();
      expect(items.length).toBeGreaterThanOrEqual(3);
      expect(items[0]).toHaveProperty('id');
      expect(items[0]).toHaveProperty('name');
      expect(items[0]).toHaveProperty('created_at');
    });

    it('should have items with non-empty names', () => {
      const items = db.prepare('SELECT * FROM items').all();
      items.forEach((item) => {
        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('insertStmt behavior', () => {
    it('should insert a new item and return a lastInsertRowid', () => {
      const result = insertStmt.run('Unit Test Item');
      expect(result).toHaveProperty('lastInsertRowid');
      expect(Number(result.lastInsertRowid)).toBeGreaterThan(0);

      const inserted = db
        .prepare('SELECT * FROM items WHERE id = ?')
        .get(result.lastInsertRowid);
      expect(inserted).toBeDefined();
      expect(inserted.name).toBe('Unit Test Item');
    });
  });
});
