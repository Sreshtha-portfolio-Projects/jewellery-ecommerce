const Blog = () => {
  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-12 md:p-16 text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We're working on something special. Our blog will be launching soon with inspiring stories, styling tips, and the latest from Aldorado Jewells.
          </p>
          <p className="text-gray-500">
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blog;

