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
    let role = authData.user.user_metadata?.role || 'customer';
    const email = authData.user.email?.toLowerCase() || '';
    
    // Check for admin: role in metadata, email contains 'admin', or email in allowed list
    const allowedAdminEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    let isAdmin = role === 'admin' || email.includes('admin') || allowedAdminEmails.includes(email);

    // If user is in allowed list but doesn't have admin role, update their metadata
    if (!isAdmin && allowedAdminEmails.includes(email)) {
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authData.user.id,
          {
            user_metadata: {
              ...authData.user.user_metadata,
              role: 'admin'
            }
          }
        );
        if (!updateError) {
          role = 'admin';
          isAdmin = true;
        }
      } catch (err) {
        console.error('Error updating user metadata:', err);
      }
    }

    if (!isAdmin) {
      console.log('Admin check failed:', { 
        email: authData.user.email, 
        role, 
        user_metadata: authData.user.user_metadata 
      });
      return res.status(403).json({ 
        message: 'Admin access required. Your email must contain "admin", be in ALLOWED_ADMIN_EMAILS, or your account must have role="admin" in user metadata.' 
      });
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

