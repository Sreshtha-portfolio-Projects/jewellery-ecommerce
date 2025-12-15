const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Store Information */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Store Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  defaultValue="Aldorado Jewells"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Store name is set globally</p>
              </div>
            </div>
          </section>

          {/* Currency & Tax */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Currency & Tax</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  disabled
                >
                  <option>INR (₹)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Currency is set to INR</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Percentage (GST)
                </label>
                <input
                  type="number"
                  defaultValue="18"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Currently set to 18% GST</p>
              </div>
            </div>
          </section>

          {/* Support & Contact */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Support & Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  defaultValue="info@aldoradojewells.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Customer support email address</p>
              </div>
            </div>
          </section>

          {/* Shipping Rules */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Shipping Rules</h2>
            <div className="space-y-4">
              <div className="p-4 bg-beige-50 border border-beige-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Current Rule:</strong> Free shipping on all orders
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Advanced shipping rules (weight-based, location-based) coming soon
                </p>
              </div>
            </div>
          </section>

          {/* Payment Gateway */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Payment Gateway</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Razorpay</p>
                    <p className="text-sm text-gray-600">Online Payment & EMI</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Configured via environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
                </p>
              </div>
            </div>
          </section>

          {/* Coming Soon Features */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <div className="space-y-2 text-gray-600">
              <p>• Advanced shipping rules (weight, location-based)</p>
              <p>• Multiple payment gateways</p>
              <p>• Email notification settings</p>
              <p>• SMS notification settings</p>
              <p>• Store hours and holidays</p>
              <p>• Return policy configuration</p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <button
              disabled
              className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Save Changes (Coming Soon)
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Settings are currently managed via environment variables and database. UI configuration coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
