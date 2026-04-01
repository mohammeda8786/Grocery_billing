const mongoose = require('mongoose');
const Product = require('../models/Product');
const sampleProducts = require('./sample-products');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery-billing';

const seed = async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    console.log('Seeded products successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
