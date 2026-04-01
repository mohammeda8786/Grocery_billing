const express = require('express');
const router = express.Router();

const getTamilUnit = (unit) => {
  if (unit === 'KG') return 'கிலோ';
  if (unit === 'PADI') return 'படி';
  return unit;
};

const buildBillMessage = ({ phone, customerName, items, totalAmount }) => {
  const header = 'பொருள் - அளவு - அளவீடு - மொத்தம்';
  const separator = '-----------------------------';

  const rows = items.map((item) => {
    const name = item.tamilName || item.name || '';
    const qty = item.quantity || 0;
    const unit = getTamilUnit(item.weightType || 'KG');
    const total = `₹${item.total?.toFixed(2) ?? '0.00'}`;

    return `${name} - ${qty} ${unit} - ${total}`;
  });

  const bodyLines = [
    '```',
    '🛒 Babu Grocery Shop',
    `வாடிக்கையாளர்: ${customerName}`,
    '',
    '📄 பில் விவரம்:',
    header,
    separator,
    ...rows,
    separator,
    `மொத்த தொகை: ₹${totalAmount.toFixed(2)}`,
    '',
    '📞 தொடர்புக்கு:',
    '9150803429',
    '9952158568',
    '',
    '🙏 நன்றி! மீண்டும் வருக!',
    '```',
  ];

  return bodyLines.join('\n');
};

router.post('/', async (req, res) => {
  try {
    const { phone, customerName, items, totalAmount } = req.body;

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Bill must contain at least one item' });
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ message: 'Total amount must be greater than zero' });
    }

    const billText = buildBillMessage({ phone, customerName: customerName.trim(), items, totalAmount });
    const encoded = encodeURIComponent(billText);
    const whatsappLink = `https://wa.me/91${phone}?text=${encoded}`;

    res.json({ message: 'Bill prepared', whatsappLink, billText });
  } catch (error) {
    res.status(500).json({ message: 'Failed to build bill', error: error.message });
  }
});

module.exports = router;
