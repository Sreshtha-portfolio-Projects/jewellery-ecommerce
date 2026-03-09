import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchBlogs();
  }, [page, filters]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/blogs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch blogs');

      const data = await response.json();
      setBlogs(data.blogs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete blog');

      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <Link
          to="/admin/marketing/blogs/new"
          className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          Create New Blog
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search blogs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Categories</option>
            <option value="Jewellery Care">Jewellery Care</option>
            <option value="Style Guide">Style Guide</option>
            <option value="Industry News">Industry News</option>
            <option value="Behind the Scenes">Behind the Scenes</option>
            <option value="Gift Ideas">Gift Ideas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-beige-50 border-b border-beige-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-200">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-beige-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                      <div className="text-xs text-gray-500">{blog.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {blog.category || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(blog.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {blog.views || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {blog.publish_date ? new Date(blog.publish_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/marketing/blogs/edit/${blog.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                        {blog.status === 'published' && (
                          <a
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {blogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No blogs found. Create your first blog to get started!
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-beige-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beige-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-beige-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beige-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Blogs;
