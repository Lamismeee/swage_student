'use strict';

const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

const dataFile = path.join(__dirname, '..', 'data', 'products.json');
const backup = dataFile + '.bak';

beforeAll(() => {
  if (fs.existsSync(dataFile)) fs.copyFileSync(dataFile, backup);
});

afterAll(() => {
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, dataFile);
    fs.unlinkSync(backup);
  }
});

beforeEach(() => {
  if (fs.existsSync(backup)) fs.copyFileSync(backup, dataFile);
});

afterEach(() => {
  if (fs.existsSync(backup)) fs.copyFileSync(backup, dataFile);
});

describe('Product model', () => {
  test('getAll returns all products', () => {
    const products = Product.getAll();
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBeGreaterThanOrEqual(6);
  });

  test('getById returns the correct product', () => {
    const product = Product.getById(1);
    expect(product).toBeDefined();
    expect(product.id).toBe(1);
    expect(product.name).toContain('Sauce Labs Backpack');
  });

  test('getById returns undefined for missing product', () => {
    expect(Product.getById(999)).toBeUndefined();
  });

  test('getCategories returns unique categories', () => {
    const categories = Product.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(new Set(categories).size).toBe(categories.length);
    expect(categories).toEqual(expect.arrayContaining(['Accessories', 'Apparel', 'Outdoor']));
  });

  test('getTypes returns unique types from JSON', () => {
    const types = Product.getTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(new Set(types).size).toBe(types.length);
    expect(types).toEqual(expect.arrayContaining(['Backpack', 'T-Shirt', 'Onesie']));
  });

  test('add creates a product and persists it', () => {
    const product = Product.add({
      name: 'CRUD Test Mug',
      price: '12.50',
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Mug',
      badge: 'New',
      desc: 'Created by a test',
    });

    expect(product.id).toBeDefined();
    expect(Product.getById(product.id)).toMatchObject({
      name: 'CRUD Test Mug',
      price: 12.5,
      type: 'Mug',
    });
  });

  test('add validates required fields and price', () => {
    expect(() => Product.add({ name: '', price: 10 })).toThrow('Name, category, type, and image are required.');
    expect(() => Product.add({
      name: 'Bad price',
      price: 'free',
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Mug',
    })).toThrow('Price must be a positive number.');
  });

  test('update changes an existing product', () => {
    const created = Product.add({
      name: 'Editable Product',
      price: 10,
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Mug',
      desc: 'Before',
    });

    const updated = Product.update(created.id, {
      ...created,
      name: 'Edited Product',
      price: 14.75,
      desc: 'After',
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: 'Edited Product',
      price: 14.75,
      desc: 'After',
    });
    expect(updated.updatedAt).toBeDefined();
  });

  test('remove deletes a product', () => {
    const created = Product.add({
      name: 'Removable Product',
      price: 8,
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Sticker',
    });

    const removed = Product.remove(created.id);
    expect(removed.name).toBe('Removable Product');
    expect(Product.getById(created.id)).toBeUndefined();
  });
});
