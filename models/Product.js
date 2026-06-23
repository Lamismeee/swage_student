'use strict';

const fs = require('fs');
const path = require('path');
const Category = require('./Category');

const productsFile = path.join(__dirname, '..', 'data', 'products.json');
const types = require('../data/types.json');

function readProducts() {
  try {
    const raw = fs.readFileSync(productsFile, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeProduct(fields, existing = {}) {
  const name = String(fields.name ?? existing.name ?? '').trim();
  const category = String(fields.category ?? existing.category ?? '').trim();
  const type = String(fields.type ?? existing.type ?? '').trim();
  const image = String(fields.image ?? existing.image ?? '').trim();
  const desc = String(fields.desc ?? existing.desc ?? '').trim();
  const badge = String(fields.badge ?? existing.badge ?? '').trim() || null;
  const price = Number(fields.price ?? existing.price);

  if (!name || !category || !type || !image) {
    throw new Error('Name, category, type, and image are required.');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Price must be a positive number.');
  }

  return {
    name,
    price: +price.toFixed(2),
    image,
    category,
    type,
    badge,
    desc,
  };
}

class Product {
  static getAll() {
    return readProducts();
  }

  static getById(id) {
    return Product.getAll().find(p => p.id === Number(id));
  }

  static getCategories() {
    return unique([...Category.getAll(), ...Product.getAll().map(p => p.category)]);
  }

  static getTypes() {
    return unique([...types, ...Product.getAll().map(p => p.type)]);
  }

  static add(fields) {
    const products = Product.getAll();
    const nextId = products.reduce((max, product) => Math.max(max, Number(product.id) || 0), 0) + 1;
    const product = {
      id: nextId,
      ...normalizeProduct(fields),
      createdAt: new Date().toISOString(),
    };
    products.push(product);
    writeProducts(products);
    return product;
  }

  static update(id, fields) {
    const products = Product.getAll();
    const idx = products.findIndex(p => p.id === Number(id));
    if (idx === -1) throw new Error('Product not found.');

    products[idx] = {
      ...products[idx],
      ...normalizeProduct(fields, products[idx]),
      updatedAt: new Date().toISOString(),
    };
    writeProducts(products);
    return products[idx];
  }

  static remove(id) {
    const products = Product.getAll();
    const idx = products.findIndex(p => p.id === Number(id));
    if (idx === -1) throw new Error('Product not found.');

    const [removed] = products.splice(idx, 1);
    writeProducts(products);
    return removed;
  }
}

module.exports = Product;
