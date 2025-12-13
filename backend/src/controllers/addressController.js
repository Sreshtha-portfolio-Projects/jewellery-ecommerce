const supabase = require('../config/supabase');

const getAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ message: 'Error fetching addresses' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in getAddresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault, addressType } = req.body;

    // Validate required fields
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ message: 'Missing required address fields' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        full_name: fullName,
        phone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state,
        postal_code: postalCode,
        country: country || 'India',
        is_default: isDefault || false,
        address_type: addressType || 'shipping'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ message: 'Error creating address' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error in createAddress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault, addressType } = req.body;

    // Verify address belongs to user
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingAddress.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const updateData = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (addressLine1 !== undefined) updateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postal_code = postalCode;
    if (country !== undefined) updateData.country = country;
    if (isDefault !== undefined) updateData.is_default = isDefault;
    if (addressType !== undefined) updateData.address_type = addressType;

    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ message: 'Error updating address' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in updateAddress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify address belongs to user
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting address:', error);
      return res.status(500).json({ message: 'Error deleting address' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};

