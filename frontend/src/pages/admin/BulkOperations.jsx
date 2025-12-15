import { useState } from 'react';
import { adminService } from '../../services/adminService';

const BulkOperations = () => {
  const [importType, setImportType] = useState('both');
  const [fileContent, setFileContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileContent) {
      alert('Please upload a CSV file first');
      return;
    }

    try {
      setImporting(true);
      const result = await adminService.bulkImport(fileContent, importType);
      setImportResult(result);
      if (result.successful > 0) {
        alert(`Successfully imported ${result.successful} rows`);
      }
      if (result.failed > 0) {
        alert(`Failed to import ${result.failed} rows. Check errors below.`);
      }
    } catch (error) {
      console.error('Error importing:', error);
      alert('Failed to import: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (type = 'both') => {
    try {
      setExporting(true);
      const blob = await adminService.bulkExport(type);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('Export completed!');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export: ' + (error.response?.data?.message || error.message));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import / Export</h1>
          <p className="text-gray-600 mt-1">Manage products in bulk</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Bulk Import</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import Type
              </label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="both">Products & Variants</option>
                <option value="products">Products Only</option>
                <option value="variants">Variants Only</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {fileContent && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  File loaded: {fileContent.split('\n').length - 1} rows (excluding header)
                </p>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing || !fileContent}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import Products'}
            </button>

            {importResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Import Results</h3>
                <div className="space-y-1 text-sm">
                  <p>Total: {importResult.total}</p>
                  <p className="text-green-600">Successful: {importResult.successful}</p>
                  <p className="text-red-600">Failed: {importResult.failed}</p>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-600">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Bulk Export</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Export your product catalog to CSV format for backup or editing.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleExport('both')}
                disabled={exporting}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Products & Variants'}
              </button>
              
              <button
                onClick={() => handleExport('products')}
                disabled={exporting}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Products Only'}
              </button>
              
              <button
                onClick={() => handleExport('variants')}
                disabled={exporting}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Variants Only'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">CSV Format Guide</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Products:</strong> name, description, category, base_price, metal_type, purity, karat</p>
                <p><strong>Variants:</strong> product_id, size, color, finish, weight, stock_quantity, sku, price_override</p>
                <p className="mt-2 text-blue-700">Download a sample export to see the exact format.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;

