const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogAnalytics
} = require('./blog.controller');

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/blogs:
 *   get:
 *     summary: Get all blogs (admin)
 *     tags: [Admin - Blogs]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, scheduled]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all blogs
 */
router.get('/', getAllBlogs);

/**
 * @swagger
 * /api/admin/blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, scheduled]
 *               publish_date:
 *                 type: string
 *                 format: date-time
 *               meta_title:
 *                 type: string
 *               meta_description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blog created successfully
 */
router.post('/', createBlog);

/**
 * @swagger
 * /api/admin/blogs/{id}:
 *   put:
 *     summary: Update a blog
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Blog updated successfully
 */
router.put('/:id', updateBlog);

/**
 * @swagger
 * /api/admin/blogs/{id}:
 *   delete:
 *     summary: Delete a blog
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 */
router.delete('/:id', deleteBlog);

/**
 * @swagger
 * /api/admin/blogs/{id}/analytics:
 *   get:
 *     summary: Get blog analytics
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog analytics data
 */
router.get('/:id/analytics', getBlogAnalytics);

/**
 * @swagger
 * /api/admin/blog-categories:
 *   get:
 *     summary: Get all blog categories
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blog categories
 */
router.get('/categories/all', getBlogCategories);

/**
 * @swagger
 * /api/admin/blog-categories:
 *   post:
 *     summary: Create a blog category
 *     tags: [Admin - Blogs]
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
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/categories', createBlogCategory);

/**
 * @swagger
 * /api/admin/blog-categories/{id}:
 *   put:
 *     summary: Update a blog category
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/categories/:id', updateBlogCategory);

/**
 * @swagger
 * /api/admin/blog-categories/{id}:
 *   delete:
 *     summary: Delete a blog category
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/categories/:id', deleteBlogCategory);

module.exports = router;
