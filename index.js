// index.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
const serveStatic = require('serve-static');
const jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const { subtle } = require('crypto');
require('dotenv').config();
const JWT_SECRET = "haihdbuh487267348778734@#3489?fh92u348209382398094804urfhjs-3][hvuf";
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb+srv://akashmandal6297:6a14zm3h0QcHFjUt@cluster0.xwdlcdu.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,

});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});


const User = mongoose.model('User', UserSchema);

// Create a Product schema
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  image: String,
  category: String,
});

const Product = mongoose.model('Product', productSchema);

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = req.body;
    const product = new Product(newProduct);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// const orderProductSchema = new mongoose.Schema({
//   product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//   count: { type: Number, required: true },
// });



// Create a MongoDB schema for the order data
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  // selectedProduct: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // assuming you have a Product model for the products
  products: [
    {
      selectedProduct: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      count: { type: Number, required: true },
    },
  ],
  // count: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  isCashOnDelivery: { type: Boolean, required: true },
});

const Order = mongoose.model('Order', orderSchema);

app.post('/api/orderform', async (req, res) => {
  try {
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();
    res.json({ message: 'Order successfully saved to MongoDB.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving order to MongoDB.' });
  }
});

// Define a route to get all orders
app.get('/api/orderfrom', async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await Order.find();

    // Respond with the orders data as JSON
    res.json(orders);
  } catch (error) {
    // If there is an error, respond with an error message
    res.status(500).json({ message: 'Error fetching orders from MongoDB.' });
  }
});



// Route to handle user registration
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user
    user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to handle user sign-in
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Sign in successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Import and use the contact route
const contactRoute = require('./contact');
app.use('/api', contactRoute);


app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "15m",
    });
   
    const link = `https://trible-trands.onrender.com/reset-password/${oldUser._id}/${token}`;
    
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'akashmandal6297@gmail.com',
        pass: 'bwmhovtgqzzydgul'
      }
    });
    
    var mailOptions = {
      from: 'youremail@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: link
      
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log(link);
  } catch (error) { }
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

app.delete('/api/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    await Product.deleteOne({ id: productId });
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

