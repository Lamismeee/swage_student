'use strict';

const Product = require('../models/Product');
const Cart = require('../models/Cart');

function getCart(req) {
  return new Cart(req.session.cart || {});
}

function renderProductForm(req, res, { title, action, product = {}, error = null, status = 200 }) {
  const cart = getCart(req);
  res.status(status).render('admin-product-form', {
    title,
    action,
    product,
    error,
    categories: Product.getCategories(),
    types: Product.getTypes(),
    cartCount: cart.count,
  });
}

exports.listProducts = (req, res) => {
  const cart = getCart(req);
  res.render('admin-products', {
    products: Product.getAll(),
    cartCount: cart.count,
    message: req.query.created ? 'Product created.'
      : req.query.updated ? 'Product updated.'
      : req.query.deleted ? 'Product deleted.'
      : null,
  });
};

exports.showNewProduct = (req, res) => {
  renderProductForm(req, res, {
    title: 'New Product',
    action: '/admin/products',
    product: { image: '/images/backpack.svg' },
  });
};

exports.createProduct = (req, res) => {
  try {
    Product.add(req.body);
    res.redirect('/admin/products?created=1');
  } catch (err) {
    renderProductForm(req, res, {
      title: 'New Product',
      action: '/admin/products',
      product: req.body,
      error: err.message,
      status: 400,
    });
  }
};

exports.showEditProduct = (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) return res.status(404).send('Product not found.');

  renderProductForm(req, res, {
    title: 'Edit Product',
    action: `/admin/products/${product.id}`,
    product,
  });
};

exports.updateProduct = (req, res) => {
  try {
    Product.update(req.params.id, req.body);
    res.redirect('/admin/products?updated=1');
  } catch (err) {
    const status = err.message === 'Product not found.' ? 404 : 400;
    renderProductForm(req, res, {
      title: 'Edit Product',
      action: `/admin/products/${req.params.id}`,
      product: { id: req.params.id, ...req.body },
      error: err.message,
      status,
    });
  }
};

exports.deleteProduct = (req, res) => {
  try {
    Product.remove(req.params.id);
    res.redirect('/admin/products?deleted=1');
  } catch (err) {
    res.status(404).send(err.message);
  }
};
