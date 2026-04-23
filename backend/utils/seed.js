require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const DeliveryAgent = require('../models/DeliveryAgent');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hungrybird');
  console.log('MongoDB connected');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Admin.deleteMany(), User.deleteMany(), Category.deleteMany(),
    Restaurant.deleteMany(), Food.deleteMany(), Order.deleteMany(), DeliveryAgent.deleteMany(),
  ]);

  // Admins
  const admins = await Admin.create([
    { name: 'Super Admin', email: 'admin@hungrybird.com', password: 'admin123', role: 'super_admin', permissions: ['dashboard','orders','food','restaurants','users','payments','delivery','reviews','coupons','notifications','settings','admins','inventory'], isActive: true },
    { name: 'Manager', email: 'manager@hungrybird.com', password: 'manager123', role: 'manager', permissions: ['dashboard','orders','food','restaurants','users','delivery','reviews','coupons'], isActive: true },
    { name: 'Staff', email: 'staff@hungrybird.com', password: 'staff123', role: 'staff', permissions: ['dashboard','orders'], isActive: true },
  ]);

  // Users
  const users = await User.create([
    { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1234567890', isVerified: true, totalOrders: 12, totalSpent: 340.50 },
    { name: 'Bob Smith', email: 'bob@example.com', phone: '+1234567891', isVerified: true, totalOrders: 5, totalSpent: 120.00 },
    { name: 'Carol White', email: 'carol@example.com', phone: '+1234567892', isVerified: false, totalOrders: 3, totalSpent: 75.00 },
    { name: 'David Brown', email: 'david@example.com', phone: '+1234567893', isVerified: true, totalOrders: 20, totalSpent: 580.00, isBlocked: false },
    { name: 'Eve Davis', email: 'eve@example.com', phone: '+1234567894', isVerified: true, totalOrders: 8, totalSpent: 210.00 },
  ]);

  // Categories
  const categories = await Category.create([
    { name: 'Pizza', description: 'Italian style pizzas', isActive: true, sortOrder: 1 },
    { name: 'Burgers', description: 'Juicy burgers', isActive: true, sortOrder: 2 },
    { name: 'Drinks', description: 'Refreshing beverages', isActive: true, sortOrder: 3 },
    { name: 'Sushi', description: 'Fresh Japanese sushi', isActive: true, sortOrder: 4 },
    { name: 'Desserts', description: 'Sweet treats', isActive: true, sortOrder: 5 },
    { name: 'Salads', description: 'Healthy salads', isActive: true, sortOrder: 6 },
  ]);

  // Restaurants
  const restaurants = await Restaurant.create([
    { name: 'Pizza Palace', description: 'Best pizza in town', email: 'pizza@palace.com', phone: '+1111111111', address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001' }, cuisine: ['Italian', 'Pizza'], status: 'approved', isActive: true, rating: 4.5, totalReviews: 120, deliveryTime: '25-35 min', minOrder: 15, deliveryFee: 2.99, commission: 10 },
    { name: 'Burger Barn', description: 'Gourmet burgers', email: 'info@burgerbarn.com', phone: '+2222222222', address: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001' }, cuisine: ['American', 'Burgers'], status: 'approved', isActive: true, rating: 4.2, totalReviews: 85, deliveryTime: '20-30 min', minOrder: 10, deliveryFee: 1.99, commission: 12 },
    { name: 'Sushi World', description: 'Authentic Japanese cuisine', email: 'hello@sushiworld.com', phone: '+3333333333', address: { street: '789 Elm St', city: 'Chicago', state: 'IL', zipCode: '60601' }, cuisine: ['Japanese', 'Sushi'], status: 'approved', isActive: true, rating: 4.7, totalReviews: 200, deliveryTime: '30-45 min', minOrder: 20, deliveryFee: 3.99, commission: 15 },
    { name: 'Green Garden', description: 'Healthy and fresh', email: 'info@greengarden.com', phone: '+4444444444', address: { street: '321 Pine Rd', city: 'Houston', state: 'TX', zipCode: '77001' }, cuisine: ['Healthy', 'Salads'], status: 'pending', isActive: false, rating: 0, totalReviews: 0, deliveryTime: '20-30 min', minOrder: 12, deliveryFee: 2.49, commission: 10 },
  ]);

  // Foods
  const foods = await Food.create([
    { name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 12.99, category: categories[0]._id, restaurant: restaurants[0]._id, isAvailable: true, isVeg: true, isFeatured: true, rating: 4.5, totalReviews: 50, preparationTime: 20, stock: -1 },
    { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni', price: 14.99, category: categories[0]._id, restaurant: restaurants[0]._id, isAvailable: true, isVeg: false, isFeatured: true, rating: 4.7, totalReviews: 80, preparationTime: 20, stock: -1 },
    { name: 'Classic Burger', description: 'Beef patty with lettuce and tomato', price: 9.99, category: categories[1]._id, restaurant: restaurants[1]._id, isAvailable: true, isVeg: false, isFeatured: true, rating: 4.3, totalReviews: 40, preparationTime: 15, stock: -1 },
    { name: 'Veggie Burger', description: 'Plant-based patty', price: 10.99, category: categories[1]._id, restaurant: restaurants[1]._id, isAvailable: true, isVeg: true, rating: 4.0, totalReviews: 25, preparationTime: 15, stock: -1 },
    { name: 'Salmon Roll', description: 'Fresh salmon with avocado', price: 16.99, category: categories[3]._id, restaurant: restaurants[2]._id, isAvailable: true, isVeg: false, isFeatured: true, rating: 4.8, totalReviews: 90, preparationTime: 25, stock: -1 },
    { name: 'Coca Cola', description: '330ml can', price: 2.49, category: categories[2]._id, restaurant: restaurants[0]._id, isAvailable: true, isVeg: true, rating: 4.0, totalReviews: 10, preparationTime: 2, stock: 100 },
    { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 7.99, category: categories[4]._id, restaurant: restaurants[0]._id, isAvailable: true, isVeg: true, isFeatured: true, rating: 4.9, totalReviews: 60, preparationTime: 15, stock: 30 },
    { name: 'Caesar Salad', description: 'Romaine lettuce with caesar dressing', price: 8.99, category: categories[5]._id, restaurant: restaurants[3]._id, isAvailable: true, isVeg: true, rating: 4.2, totalReviews: 15, preparationTime: 10, stock: -1 },
  ]);

  // Delivery Agents
  const agents = await DeliveryAgent.create([
    { name: 'Mike Wilson', email: 'mike@delivery.com', phone: '+5555555551', vehicleType: 'bike', vehicleNumber: 'NY-1234', isAvailable: true, isActive: true, totalDeliveries: 145, rating: 4.6, earnings: 2900, zone: 'North' },
    { name: 'Sarah Lee', email: 'sarah@delivery.com', phone: '+5555555552', vehicleType: 'scooter', vehicleNumber: 'CA-5678', isAvailable: false, isActive: true, totalDeliveries: 89, rating: 4.8, earnings: 1780, zone: 'South' },
    { name: 'Tom Garcia', email: 'tom@delivery.com', phone: '+5555555553', vehicleType: 'bicycle', vehicleNumber: 'IL-9012', isAvailable: true, isActive: true, totalDeliveries: 210, rating: 4.4, earnings: 4200, zone: 'East' },
  ]);

  // Orders — use create() one-by-one so pre('save') generates orderNumber
  const statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const paymentMethods = ['cash', 'card', 'wallet'];
  const paymentStatuses = ['pending', 'paid', 'paid', 'paid', 'paid', 'failed'];

  for (let i = 0; i < 30; i++) {
    const statusIdx = i % statuses.length;
    const status = statuses[statusIdx];
    const user = users[i % users.length];
    const restaurant = restaurants[i % 3];
    const food = foods[i % foods.length];
    const qty = (i % 3) + 1;
    const subtotal = food.price * qty;
    const deliveryFee = restaurant.deliveryFee;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));
    const daysAgo = i * 2;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const order = new Order({
      user: user._id,
      restaurant: restaurant._id,
      items: [{ food: food._id, name: food.name, price: food.price, quantity: qty, subtotal: food.price * qty }],
      deliveryAddress: { street: '100 Test St', city: 'New York', state: 'NY', zipCode: '10001' },
      status,
      statusHistory: [{ status, timestamp: createdAt }],
      payment: { method: paymentMethods[i % 3], status: paymentStatuses[statusIdx], ...(status === 'delivered' ? { paidAt: createdAt } : {}) },
      subtotal,
      deliveryFee,
      tax,
      discount: 0,
      total,
      deliveryAgent: (status === 'out_for_delivery' || status === 'delivered') ? agents[0]._id : undefined,
      ...(status === 'delivered' ? { deliveredAt: createdAt } : {}),
      createdAt,
      updatedAt: createdAt,
    });
    await order.save();
  }

  console.log('✅ Seed data created successfully!');
  console.log('\n🔑 Admin Credentials:');
  console.log('  Super Admin: admin@hungrybird.com / admin123');
  console.log('  Manager:     manager@hungrybird.com / manager123');
  console.log('  Staff:       staff@hungrybird.com / staff123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
