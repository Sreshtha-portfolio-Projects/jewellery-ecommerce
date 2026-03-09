import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchBlogs();
  }, [page, filters]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/blogs?${params}`);

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

  return (
    <div className="min-h-screen bg-beige-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the latest trends, care tips, and stories from the world of fine jewellery
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search blogs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          
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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.slug}`}
                  className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {blog.thumbnail && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {blog.category && (
                      <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">
                        {blog.category}
                      </span>
                    )}
                    <h2 className="font-serif text-xl font-bold text-gray-900 mt-2 mb-3">
                      {blog.title}
                    </h2>
                    {blog.meta_description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {blog.meta_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {new Date(blog.publish_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-rose-600 font-medium">Read More →</span>
                    </div>
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-beige-100 text-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {blogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No blogs found. Check back soon for new content!
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 border border-beige-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beige-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-6 py-2 text-gray-700 flex items-center">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-2 border border-beige-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beige-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogList;
