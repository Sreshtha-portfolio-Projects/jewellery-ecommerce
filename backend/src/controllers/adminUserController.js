const supabase = require('../config/supabase');

/**
 * Get all users with their roles
 */
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      return res.status(500).json({ message: 'Error fetching users', error: usersError.message });
    }

    // Get roles for all users
    const userIds = users.users.map(u => u.id);
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .in('user_id', userIds);

    // Combine user data with roles
    const usersWithRoles = users.users.map(user => {
      const userRoles = roles?.filter(r => r.user_id === user.id) || [];
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        roles: userRoles.map(r => r.role),
        isAdmin: userRoles.some(r => r.role === 'admin')
      };
    });

    res.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/**
 * Grant admin role to a user
 */
const grantAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    const grantedBy = req.user.userId;

    // Verify user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has admin role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (existingRole && !checkError) {
      return res.status(400).json({ message: 'User already has admin role' });
    }

    // Grant admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        granted_by: grantedBy,
        notes: notes || `Admin role granted by ${req.user.email}`
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error granting admin role:', roleError);
      return res.status(500).json({ 
        message: 'Error granting admin role', 
        error: process.env.NODE_ENV === 'development' ? roleError.message : undefined 
      });
    }

    res.json({ 
      message: 'Admin role granted successfully',
      role: roleData
    });
  } catch (error) {
    console.error('Error granting admin role:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Revoke admin role from a user
 */
const revokeAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent revoking your own admin role
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'You cannot revoke your own admin role' });
    }

    // Check if user has admin role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (checkError || !existingRole) {
      return res.status(404).json({ message: 'User does not have admin role' });
    }

    // Revoke admin role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (deleteError) {
      console.error('Error revoking admin role:', deleteError);
      return res.status(500).json({ 
        message: 'Error revoking admin role', 
        error: process.env.NODE_ENV === 'development' ? deleteError.message : undefined 
      });
    }

    res.json({ message: 'Admin role revoked successfully' });
  } catch (error) {
    console.error('Error revoking admin role:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Get roles for a specific user
 */
const getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        message: 'Error fetching user roles', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }

    res.json({ roles: roles || [] });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  getAllUsers,
  grantAdminRole,
  revokeAdminRole,
  getUserRoles
};

