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

    // Check admin role in database (user_roles table)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .eq('role', 'admin')
      .single();

    let isAdmin = !roleError && roleData;

    // Fallback: Legacy checks for backward compatibility during migration
    if (!isAdmin) {
      let role = authData.user.user_metadata?.role || 'customer';
      const userEmail = authData.user.email?.toLowerCase() || '';
      const allowedAdminEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
      
      isAdmin = role === 'admin' || userEmail.includes('admin') || allowedAdminEmails.includes(userEmail);
      
      // If user qualifies via legacy method, automatically grant admin role in database
      if (isAdmin) {
        try {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'admin',
              notes: 'Auto-granted via legacy admin check (migration)'
            });
          
          if (insertError && !insertError.message.includes('duplicate')) {
            console.error('Error auto-granting admin role:', insertError);
          }
        } catch (err) {
          console.error('Error auto-granting admin role:', err);
        }
      }
    }

    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'Admin access required. Contact an administrator to grant you admin privileges, or use the Supabase Dashboard to manually add your user ID to the user_roles table.' 
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

