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

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (admin view)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products with pagination
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   get:
 *     summary: Get product by ID with variants and images
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     summary: Create new product
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - base_price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [rings, earrings, necklaces, bracelets]
 *               base_price:
 *                 type: number
 *               metal_type:
 *                 type: string
 *               variants:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductVariant'
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     image_url:
 *                       type: string
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', createProduct);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               base_price:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', updateProduct);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', deleteProduct);

/**
 * @swagger
 * /api/admin/products/{productId}/variants:
 *   post:
 *     summary: Create product variant
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       201:
 *         description: Variant created
 */
router.post('/:productId/variants', createVariant);

/**
 * @swagger
 * /api/admin/products/variants/{variantId}:
 *   put:
 *     summary: Update variant
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Variant updated
 */
router.put('/variants/:variantId', updateVariant);

/**
 * @swagger
 * /api/admin/products/variants/{variantId}:
 *   delete:
 *     summary: Delete variant
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Variant deleted
 */
router.delete('/variants/:variantId', deleteVariant);

/**
 * @swagger
 * /api/admin/products/{productId}/images:
 *   post:
 *     summary: Add product image (URL)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image_url:
 *                 type: string
 *               alt_text:
 *                 type: string
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Image added
 */
router.post('/:productId/images', uploadProductImage);

/**
 * @swagger
 * /api/admin/products/{productId}/images/upload:
 *   post:
 *     summary: Upload product image (file)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               alt_text:
 *                 type: string
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Image uploaded
 */
router.post('/:productId/images/upload', uploadImageToStorage);

router.put('/:productId/images/reorder', reorderImages);
router.delete('/images/:imageId', deleteImage);

/**
 * @swagger
 * /api/admin/products/bulk-import:
 *   post:
 *     summary: Bulk import products/variants from CSV
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileContent:
 *                 type: string
 *                 description: CSV file content as string
 *               importType:
 *                 type: string
 *                 enum: [products, variants, both]
 *                 default: both
 *     responses:
 *       200:
 *         description: Import completed
 */
router.post('/bulk-import', bulkImport);

/**
 * @swagger
 * /api/admin/products/bulk-export:
 *   get:
 *     summary: Export products/variants to CSV
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exportType
 *         schema:
 *           type: string
 *           enum: [products, variants, both]
 *           default: both
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/bulk-export', bulkExport);

module.exports = router;

