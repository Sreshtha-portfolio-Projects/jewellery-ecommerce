const supabase = require('../config/supabase');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  }
}).single('image');

/**
 * Upload image to Supabase Storage
 */
const uploadImageToStorage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    try {
      const { productId } = req.params;
      const { alt_text, display_order, is_primary } = req.body;

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image to storage' });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // If setting as primary, unset other primary images
      if (is_primary === 'true' || is_primary === true) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);
      }

      // Save image record to database
      const { data: image, error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          alt_text: alt_text || req.file.originalname,
          display_order: display_order ? parseInt(display_order) : 0,
          is_primary: is_primary === 'true' || is_primary === true
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving image record:', dbError);
        // Try to delete uploaded file
        await supabase.storage.from('product-images').remove([fileName]);
        return res.status(500).json({ message: 'Failed to save image record' });
      }

      res.status(201).json({
        message: 'Image uploaded successfully',
        image: {
          ...image,
          image_url: imageUrl
        }
      });
    } catch (error) {
      console.error('Error in uploadImageToStorage:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
};

module.exports = {
  uploadImageToStorage,
  upload // Export multer middleware for use in routes
};

