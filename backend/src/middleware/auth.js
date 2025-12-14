const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
// In production, you'd check a user role table or metadata
const requireAdmin = async (req, res, next) => {
  try {
    // First check JWT token role (most efficient)
    if (req.user.role === 'admin') {
      req.user.isAdmin = true;
      return next();
    }

    // Fallback: Check Supabase user metadata if role not in JWT
    const supabase = require('../config/supabase');
    const { data: userData, error } = await supabase.auth.admin.getUserById(req.user.userId);
    
    if (error || !userData) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Check user metadata for admin role
    const role = userData.user?.user_metadata?.role || 'customer';
    const email = userData.user?.email?.toLowerCase() || '';
    const allowedAdminEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    
    const isAdmin = role === 'admin' || 
                   email.includes('admin') || 
                   allowedAdminEmails.includes(email);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Middleware for customer-only routes
const requireCustomer = (req, res, next) => {
  // All authenticated users can access customer routes
  // Admin check is separate
  next();
};

// Rate limiting helper (simple in-memory, use Redis in production)
const rateLimitStore = new Map();
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const requests = rateLimitStore.get(key).filter(time => time > windowStart);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests, please try again later' });
    }

    requests.push(now);
    rateLimitStore.set(key, requests);
    next();
  };
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  requireCustomer,
  rateLimit,
  JWT_SECRET 
};
