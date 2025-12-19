const jwt = require('jsonwebtoken');

// Validate JWT_SECRET is set in production
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set in production environment');
    process.exit(1);
  }
  // Development fallback (warn but allow)
  console.warn('WARNING: JWT_SECRET not set, using insecure default. Set JWT_SECRET in production!');
  JWT_SECRET = 'your-secret-key-change-in-production-DEVELOPMENT-ONLY';
} else {
  // Validate secret strength in production
  if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', {
        error: err.message,
        name: err.name,
        hasSecret: !!JWT_SECRET,
        secretLength: JWT_SECRET?.length,
        tokenPreview: token?.substring(0, 20) + '...'
      });
      return res.status(403).json({ 
        message: 'Invalid or expired token',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    req.user = user;
    next();
  });
};

// Helper function to check if user is admin (checks database)
const checkIsAdmin = async (userId) => {
  try {
    const supabase = require('../config/supabase');
    
    // Check user_roles table for admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    if (!roleError && roleData) {
      return true;
    }
    
    // Fallback: Check JWT token role (for backward compatibility during migration)
    // Also check user metadata and ALLOWED_ADMIN_EMAILS for migration period
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData) {
      return false;
    }
    
    // Legacy checks (for backward compatibility)
    const role = userData.user?.user_metadata?.role || 'customer';
    const email = userData.user?.email?.toLowerCase() || '';
    const allowedAdminEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    
    return role === 'admin' || 
           email.includes('admin') || 
           allowedAdminEmails.includes(email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Middleware to check if user is admin
// Checks database user_roles table first, then falls back to legacy methods
const requireAdmin = async (req, res, next) => {
  try {
    // First check JWT token role (cached, most efficient)
    if (req.user.role === 'admin') {
      req.user.isAdmin = true;
      return next();
    }

    // Check database for admin role
    const isAdmin = await checkIsAdmin(req.user.userId);
    
    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'Admin access required. Contact an administrator to grant you admin privileges.' 
      });
    }

    req.user.isAdmin = true;
    req.user.role = 'admin'; // Update role in request for future checks
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
