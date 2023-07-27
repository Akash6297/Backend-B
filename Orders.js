// Assuming you have defined your Order schema using Mongoose
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

app.get('/api/orders/:email', async (req, res) => {
    try {
      const userEmail = req.params.email;
      // Fetch orders where the "email" field matches the signed-in user's email
      const orders = await Order.find({ email: userEmail });
      res.json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

// module.exports = app;
