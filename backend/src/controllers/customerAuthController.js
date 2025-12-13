const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, password, and full name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name: fullName,
        role: 'customer'
      }
    });

    if (authError || !authData.user) {
      return res.status(400).json({ 
        message: authError?.message || 'Failed to create account' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: authData.user.user_metadata?.full_name
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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

    // Check user role
    const role = authData.user.user_metadata?.role || 'customer';
    const isAdmin = role === 'admin' || authData.user.email?.includes('admin');

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: authData.user.user_metadata?.full_name,
        role: role
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: userData.user.id,
      email: userData.user.email,
      fullName: userData.user.user_metadata?.full_name,
      role: userData.user.user_metadata?.role || 'customer',
      createdAt: userData.user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { signup, login, getProfile };

