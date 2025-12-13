const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify admin role
    const role = authData.user.user_metadata?.role || 'customer';
    const isAdmin = role === 'admin' || authData.user.email?.includes('admin');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin'
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { login };

