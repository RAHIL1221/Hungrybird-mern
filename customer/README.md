# 🍕 FoodApp Customer — MERN Stack Food Ordering App

Customer-facing web application for online food ordering built with React.js.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Backend server running on port 5000

### 1. Install Dependencies

```bash
cd customer
npm install
```

### 2. Run Development Server

```bash
npm start
```

The app will run on http://localhost:3001

## 📁 Project Structure

```
customer/
├── public/
│   └── index.html
└── src/
    ├── api/
    │   └── index.js          # API calls
    ├── components/
    │   ├── layout/
    │   │   └── Navbar.js     # Top navigation
    │   └── ui/
    │       └── Loading.js    # Loading components
    ├── context/
    │   ├── AuthContext.js    # Authentication state
    │   └── CartContext.js    # Shopping cart state
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.js
    │   │   └── Register.js
    │   ├── cart/
    │   │   └── Cart.js       # Shopping cart & checkout
    │   ├── home/
    │   │   └── Home.js       # Landing page
    │   ├── orders/
    │   │   ├── Orders.js     # Order history
    │   │   └── OrderDetail.js # Order tracking
    │   ├── profile/
    │   │   └── Profile.js    # User profile & addresses
    │   └── restaurants/
    │       ├── Restaurants.js
    │       └── RestaurantDetail.js
    ├── App.js                # Routes & providers
    └── index.css             # Global styles
```

## 🎨 Features

### Customer Features
- Browse restaurants and menus
- Search and filter food items
- Add items to cart
- Apply coupon codes
- Place orders with delivery address
- Track order status in real-time
- View order history
- Manage profile and addresses
- Cancel orders (before preparation)

### UI/UX
- Modern, clean design
- Responsive layout
- Real-time cart updates
- Order status tracking
- Toast notifications
- Loading states

## 🔐 Authentication

Customer authentication uses JWT tokens stored in localStorage:
- `customerToken` - Access token
- `customerRefreshToken` - Refresh token

## 🛒 Cart Management

Cart state is managed via CartContext and persisted in localStorage:
- Add/remove items
- Update quantities
- Clear cart
- Restaurant validation (single restaurant per order)

## 📡 API Integration

All API calls go through `/api/customer/*` endpoints:

### Auth
- POST `/auth/register` - Create account
- POST `/auth/login` - Login
- GET `/auth/me` - Get current user
- PUT `/auth/profile` - Update profile
- POST `/auth/addresses` - Add address

### Menu
- GET `/menu/restaurants` - List restaurants
- GET `/menu/restaurants/:id` - Restaurant details & menu
- GET `/menu/foods/featured` - Featured foods
- GET `/menu/foods/search` - Search foods

### Orders
- POST `/orders` - Place order
- GET `/orders` - Order history
- GET `/orders/:id` - Order details
- PATCH `/orders/:id/cancel` - Cancel order
- POST `/orders/validate-coupon` - Validate coupon

## 🎨 Styling

Pure CSS with CSS variables for theming:
- No UI framework dependencies
- Custom components
- Responsive design
- Modern animations

## 🚀 Build for Production

```bash
npm run build
```

Deploy the `build/` folder to any static hosting service (Vercel, Netlify, etc.)

## 🔗 Related Projects

- **Backend**: `../backend` - Node.js/Express API
- **Admin Panel**: `../frontend` - Admin dashboard

## 📝 Environment Variables

The app uses proxy configuration in `package.json` to connect to the backend:

```json
"proxy": "http://localhost:5000"
```

For production, set `REACT_APP_API_URL` environment variable.

## 🛠️ Tech Stack

- React 18
- React Router v6
- Axios
- React Hot Toast
- date-fns
- Context API (state management)
- CSS Variables (styling)
