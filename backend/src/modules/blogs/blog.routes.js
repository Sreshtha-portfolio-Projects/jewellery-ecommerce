const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const {
  getAllBlogs,
  getPublicBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogAnalytics
} = require('./blog.controller');

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all published blogs (public)
 *     tags: [Blogs]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of published blogs
 */
router.get('/', getPublicBlogs);

/**
 * @swagger
 * /api/blogs/categories:
 *   get:
 *     summary: Get all blog categories
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: List of blog categories
 */
router.get('/categories', getBlogCategories);

/**
 * @swagger
 * /api/blogs/{slug}:
 *   get:
 *     summary: Get blog by slug (public)
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog details
 *       404:
 *         description: Blog not found
 */
router.get('/:slug', getBlogBySlug);

module.exports = router;
