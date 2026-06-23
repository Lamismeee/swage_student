'use strict';

const fs = require('fs');
const path = require('path');
const adminCtrl = require('../controllers/adminController');
const Product = require('../models/Product');

const productsFile = path.join(__dirname, '..', 'data', 'products.json');
const backup = productsFile + '.admin.bak';

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.render = jest.fn(() => res);
  res.redirect = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

beforeAll(() => {
  if (fs.existsSync(productsFile)) fs.copyFileSync(productsFile, backup);
});

afterAll(() => {
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, productsFile);
    fs.unlinkSync(backup);
  }
});

beforeEach(() => {
  if (fs.existsSync(backup)) fs.copyFileSync(backup, productsFile);
});

afterEach(() => {
  if (fs.existsSync(backup)) fs.copyFileSync(backup, productsFile);
});

describe('adminController', () => {
  test('listProducts renders all products with a success message', () => {
    const req = { session: {}, query: { created: '1' } };
    const res = mockRes();
    adminCtrl.listProducts(req, res);
    expect(res.render).toHaveBeenCalledWith('admin-products', expect.objectContaining({
      products: expect.any(Array),
      message: 'Product created.',
      cartCount: 0,
    }));
  });

  test('showNewProduct renders the empty product form', () => {
    const req = { session: {} };
    const res = mockRes();
    adminCtrl.showNewProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('admin-product-form', expect.objectContaining({
      title: 'New Product',
      action: '/admin/products',
      cartCount: 0,
      categories: expect.any(Array),
      types: expect.any(Array),
      product: expect.objectContaining({ image: '/images/backpack.svg' }),
    }));
  });

  test('createProduct redirects after a successful create', () => {
    const req = {
      session: {},
      body: {
        name: 'Admin Controller Mug',
        price: '11.25',
        image: '/images/backpack.svg',
        category: 'Accessories',
        type: 'Mug',
        badge: 'New',
        desc: 'Created in controller test',
      },
    };
    const res = mockRes();
    adminCtrl.createProduct(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/admin/products?created=1');
    expect(Product.getAll().some(product => product.name === 'Admin Controller Mug')).toBe(true);
  });

  test('createProduct re-renders with status 400 when data is invalid', () => {
    const req = {
      session: {},
      body: {
        name: '',
        price: '0',
        image: '',
        category: '',
        type: '',
      },
    };
    const res = mockRes();
    adminCtrl.createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith('admin-product-form', expect.objectContaining({
      title: 'New Product',
      error: expect.stringMatching(/required|positive/i),
    }));
  });

  test('showEditProduct renders an existing product', () => {
    const created = Product.add({
      name: 'Editable Controller Product',
      price: 20,
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Bottle',
      desc: 'Before edit',
    });
    const req = { session: {}, params: { id: String(created.id) } };
    const res = mockRes();
    adminCtrl.showEditProduct(req, res);
    expect(res.render).toHaveBeenCalledWith('admin-product-form', expect.objectContaining({
      title: 'Edit Product',
      action: `/admin/products/${created.id}`,
      product: expect.objectContaining({ id: created.id, name: 'Editable Controller Product' }),
    }));
  });

  test('showEditProduct returns 404 when product does not exist', () => {
    const req = { session: {}, params: { id: '999999' } };
    const res = mockRes();
    adminCtrl.showEditProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Product not found.');
  });

  test('updateProduct redirects after a successful update', () => {
    const created = Product.add({
      name: 'Controller Update Product',
      price: 18,
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Hat',
      desc: 'Before update',
    });
    const req = {
      session: {},
      params: { id: String(created.id) },
      body: {
        name: 'Controller Update Product 2',
        price: '21.5',
        image: '/images/backpack.svg',
        category: 'Accessories',
        type: 'Hat',
        badge: 'Sale',
        desc: 'After update',
      },
    };
    const res = mockRes();
    adminCtrl.updateProduct(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/admin/products?updated=1');
    expect(Product.getById(created.id)).toMatchObject({
      name: 'Controller Update Product 2',
      price: 21.5,
      badge: 'Sale',
    });
  });

  test('updateProduct re-renders with 404 when product does not exist', () => {
    const req = {
      session: {},
      params: { id: '999999' },
      body: {
        name: 'Missing Product',
        price: '10',
        image: '/images/backpack.svg',
        category: 'Accessories',
        type: 'Mug',
      },
    };
    const res = mockRes();
    adminCtrl.updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('admin-product-form', expect.objectContaining({
      title: 'Edit Product',
      error: 'Product not found.',
    }));
  });

  test('updateProduct re-renders with 400 when payload is invalid', () => {
    const created = Product.add({
      name: 'Invalid Update Product',
      price: 9,
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Mug',
    });
    const req = {
      session: {},
      params: { id: String(created.id) },
      body: {
        name: '',
        price: '-1',
        image: '',
        category: '',
        type: '',
      },
    };
    const res = mockRes();
    adminCtrl.updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith('admin-product-form', expect.objectContaining({
      title: 'Edit Product',
      error: expect.stringMatching(/required|positive/i),
    }));
  });

  test('deleteProduct removes the product and redirects', () => {
    const created = Product.add({
      name: 'Delete Controller Product',
      price: 7,
      image: '/images/backpack.svg',
      category: 'Accessories',
      type: 'Sticker',
    });
    const req = { params: { id: String(created.id) } };
    const res = mockRes();
    adminCtrl.deleteProduct(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/admin/products?deleted=1');
    expect(Product.getById(created.id)).toBeUndefined();
  });

  test('deleteProduct returns 404 when the product is missing', () => {
    const req = { params: { id: '999999' } };
    const res = mockRes();
    adminCtrl.deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Product not found.');
  });
});
