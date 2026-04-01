const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// GET /api/products?search=
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { tamilName: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const products = await Product.find(filter).limit(40).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, tamilName, category, ratePerKg, ratePerPadi } = req.body;
    if (!name || ratePerKg == null || ratePerPadi == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newProduct = new Product({ name, tamilName, category, ratePerKg, ratePerPadi });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

module.exports = router;
