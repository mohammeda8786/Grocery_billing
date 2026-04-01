const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productsRouter = require('./routes/products');
const billRouter = require('./routes/bill');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/products', productsRouter);
app.use('/api/send-bill', billRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Grocery billing backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
