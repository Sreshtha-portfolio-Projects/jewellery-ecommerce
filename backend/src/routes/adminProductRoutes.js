const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/adminProductController');
const {
  createVariant,
  updateVariant,
  deleteVariant
} = require('../controllers/adminVariantController');
const {
  uploadProductImage,
  reorderImages,
  deleteImage
} = require('../controllers/adminImageController');
const {
  uploadImageToStorage
} = require('../controllers/adminImageUploadController');
const {
  bulkImport,
  bulkExport
} = require('../controllers/adminBulkController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Product CRUD
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Variants
router.post('/:productId/variants', createVariant);
router.put('/variants/:variantId', updateVariant);
router.delete('/variants/:variantId', deleteVariant);

// Images
router.post('/:productId/images', uploadProductImage); // For URL-based uploads
router.post('/:productId/images/upload', uploadImageToStorage); // For file uploads to Supabase Storage
router.put('/:productId/images/reorder', reorderImages);
router.delete('/images/:imageId', deleteImage);

// Bulk operations
router.post('/bulk-import', bulkImport);
router.get('/bulk-export', bulkExport);

module.exports = router;

