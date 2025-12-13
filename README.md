# Poor Gem - Luxury Jewelry E-commerce Platform

A full-stack luxury jewelry e-commerce platform built with React, Node.js, and Supabase.

## 🏗️ Architecture

```
Frontend (React) → Backend (Node.js/Express) → Supabase (Postgres + Auth)
```

**Important**: The frontend never communicates directly with Supabase. All database operations go through the Node.js backend API.

## 📁 Project Structure

```
jewellery-ecommerce/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── layouts/        # Layout components
│   │   ├── services/      # API service layer
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── backend/           # Node.js backend API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── server.js      # Entry point
│   └── package.json
│
└── supabase-setup.sql # Database schema and setup
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `supabase-setup.sql`
3. Go to Authentication > Users and create an admin user (or use the API)
4. Copy your Supabase URL and Service Role Key from Settings > API

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secret-jwt-key
PORT=3000
```

Start the backend:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and set the API URL:
```
VITE_API_BASE_URL=http://localhost:3000
```

Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

## 🎨 Features

### Frontend
- **Homepage** with hero section, categories, bestsellers, testimonials
- **Product Listing** page with category filtering
- **Admin Login** page
- **Admin Dashboard** with authentication status and API health check
- Responsive design with luxury aesthetic (beige/rose-gold color scheme)
- Modern UI with smooth animations

### Backend
- RESTful API with versioned routes (`/api/*`)
- JWT-based authentication
- Supabase integration (server-side only)
- Product endpoints
- Admin health check endpoint

### Database
- Products table with categories
- Row Level Security (RLS) enabled
- Sample product data included

## 📡 API Endpoints

### Public Endpoints
- `GET /api/products` - Get all products
- `GET /api/products?category=rings` - Get products by category
- `GET /api/products/:id` - Get single product
- `POST /api/auth/login` - Admin login

### Protected Endpoints (Require JWT)
- `GET /api/admin/health` - Check API and database health

## 🔐 Authentication

Admin authentication flow:
1. Frontend sends email/password to `/api/auth/login`
2. Backend verifies credentials with Supabase Auth
3. Backend issues JWT token
4. Frontend stores token and includes it in Authorization header
5. Protected routes verify JWT token

## 🎯 Future Enhancements

- Product CRUD operations from admin dashboard
- Image upload to Supabase Storage
- Order management system
- User accounts and wishlists
- Advanced filtering and sorting
- Payment integration
- Search functionality

## 🛠️ Tech Stack

**Frontend:**
- React (JSX)
- Vite
- Tailwind CSS
- React Router
- Axios

**Backend:**
- Node.js
- Express.js
- Supabase JS SDK
- JWT
- bcryptjs

**Database:**
- Supabase (PostgreSQL)
- Supabase Auth

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL

## 🎨 Design Philosophy

The platform follows a luxury jewelry brand aesthetic:
- Soft beige and cream backgrounds
- Rose-gold and muted gold accents
- Elegant typography (serif + sans-serif pairing)
- Generous white space
- Subtle hover effects and transitions
- Editorial-style product layouts

## 📄 License

This project is private and proprietary.

## 👥 Support

For issues or questions, contact: info@poorgem.com

