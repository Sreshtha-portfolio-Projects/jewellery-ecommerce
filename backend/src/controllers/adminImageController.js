const supabase = require('../config/supabase');

/**
 * Upload product image
 * Note: In production, you'd upload to Supabase Storage and get the URL
 * For now, we accept image_url directly
 */
const uploadProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { image_url, alt_text, display_order, is_primary } = req.body;

    if (!image_url) {
      return res.status(400).json({ message: 'image_url is required' });
    }

    // If setting as primary, unset other primary images
    if (is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    const { data: image, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url,
        alt_text: alt_text || null,
        display_order: display_order !== undefined ? display_order : 0,
        is_primary: is_primary || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error uploading image:', error);
      return res.status(500).json({ message: 'Error uploading image' });
    }

    res.status(201).json({ message: 'Image uploaded successfully', image });
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Reorder images
 */
const reorderImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageIds } = req.body; // Array of image IDs in new order

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ message: 'imageIds must be an array' });
    }

    const updates = imageIds.map((id, index) => ({
      id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase
        .from('product_images')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('product_id', productId);
    }

    res.json({ message: 'Images reordered successfully' });
  } catch (error) {
    console.error('Error in reorderImages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete image
 */
const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image:', error);
      return res.status(500).json({ message: 'Error deleting image' });
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error in deleteImage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  uploadProductImage,
  reorderImages,
  deleteImage,
};

