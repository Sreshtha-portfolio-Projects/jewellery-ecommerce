import { useState, useEffect, useCallback } from 'react';
import { metalRatesService } from '../../services/metalRatesService';

const METALS = ['gold', 'silver'];

const MetalRates = () => {
  const [rates, setRates]               = useState({ gold: null, silver: null });
  const [history, setHistory]           = useState({ gold: [], silver: [] });
  const [activeTab, setActiveTab]       = useState('gold');
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage]           = useState(null);

  const showMsg = (type, text, duration = 4000) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), duration);
  };

  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await metalRatesService.getCurrentRates();
      setRates({ gold: data.gold, silver: data.silver });
    } catch {
      showMsg('error', 'Failed to load metal rates');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (metal) => {
    try {
      const data = await metalRatesService.getHistory(metal, 20);
      setHistory((prev) => ({ ...prev, [metal]: data.history || [] }));
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadRates();
    METALS.forEach((m) => loadHistory(m));
  }, [loadRates, loadHistory]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const data = await metalRatesService.triggerUpdate();
      if (data.api_success) {
        showMsg('success', 'Metal rates updated from live API');
        await loadRates();
        METALS.forEach((m) => loadHistory(m));
      } else {
        showMsg('warning', data.message || 'API fetch failed — showing last stored rates');
        await loadRates();
      }
    } catch (err) {
      showMsg('error', err?.response?.data?.message || 'Failed to update rates');
    } finally {
      setUpdating(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Recalculate all product prices using the latest stored metal rates?\n\nOnly products with "Use Live Rate" enabled will be updated.')) return;
    setRecalculating(true);
    try {
      const data = await metalRatesService.recalculateProducts();
      showMsg('success', data.message);
    } catch (err) {
      showMsg('error', err?.response?.data?.message || 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  const formatPrice = (val, decimals = 2) =>
    val != null ? `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : '—';

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const RateCard = ({ metal, rate }) => {
    const isGold   = metal === 'gold';
    const label    = isGold ? 'Gold' : 'Silver';
    const icon     = isGold ? '🥇' : '🥈';
    const gradient = isGold
      ? 'from-yellow-50 to-yellow-100 border-yellow-200'
      : 'from-gray-50 to-gray-100 border-gray-200';
    const badge    = isGold ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700';

    return (
      <div className={`bg-gradient-to-br ${gradient} border rounded-2xl p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{label}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
              {rate?.source === 'manual_seed' ? 'Seed / Manual' : 'Live API'}
            </span>
          </div>
        </div>

        {rate ? (
          <>
            <div className="mb-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Price per gram</p>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(rate.price_per_gram, 2)}</p>
            </div>
            {rate.price_per_oz && (
              <p className="text-sm text-gray-500 mb-3">
                Per troy oz: {formatPrice(rate.price_per_oz, 0)}
              </p>
            )}
            <p className="text-xs text-gray-400">Last updated: {formatDate(rate.last_updated)}</p>
          </>
        ) : (
          <p className="text-gray-400 italic">No rate stored yet</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Metal Rates</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage live gold and silver prices. Rates are fetched from MetalPriceAPI (server-side only)
          and stored in the database. Frontend never calls the external API.
        </p>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
          : message.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? '✅' : message.type === 'warning' ? '⚠️' : '❌'} {message.text}
        </div>
      )}

      {/* Rate Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {METALS.map((m) => (
            <div key={m} className="bg-gray-100 rounded-2xl p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <RateCard metal="gold"   rate={rates.gold} />
          <RateCard metal="silver" rate={rates.silver} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-10">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          {updating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Fetching from API…
            </>
          ) : (
            <>🔄 Update Metal Rates</>
          )}
        </button>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          {recalculating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Recalculating…
            </>
          ) : (
            <>💰 Recalculate Product Prices</>
          )}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
        <p className="font-semibold mb-1">How this works</p>
        <ul className="space-y-1 list-disc list-inside text-blue-700">
          <li><strong>Update Metal Rates</strong> — Calls MetalPriceAPI from the backend, converts XAU/XAG from per troy oz to per gram, stores in database.</li>
          <li><strong>Recalculate Product Prices</strong> — Applies the latest stored rates to all products that have <em>Use Live Rate</em> enabled. Products with manual rates are skipped.</li>
          <li>Orders always snapshot the rate at time of purchase. Prices are never recalculated after an order is placed.</li>
          <li>If the API is unavailable, the last stored rate continues to be used — system stays stable.</li>
        </ul>
      </div>

      {/* Rate History */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {METALS.map((m) => (
            <button
              key={m}
              onClick={() => setActiveTab(m)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === m
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {m === 'gold' ? '🥇 Gold History' : '🥈 Silver History'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {history[activeTab].length === 0 ? (
            <p className="text-center text-gray-400 py-12">No history yet — update rates to start tracking.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Date & Time</th>
                  <th className="px-5 py-3 text-right">Per Gram</th>
                  <th className="px-5 py-3 text-right">Per Troy Oz</th>
                  <th className="px-5 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history[activeTab].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-600">{formatDate(row.fetched_at)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatPrice(row.price_per_gram, 2)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {row.price_per_oz ? formatPrice(row.price_per_oz, 0) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.source === 'manual_seed'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {row.source === 'manual_seed' ? 'seed' : 'api'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetalRates;
