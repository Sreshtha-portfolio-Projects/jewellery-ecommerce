const KPICard = ({ title, value, change, changeType, icon, trend }) => {
  const isPositive = changeType === 'positive';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-beige-100 rounded-lg">
          <span className="text-2xl">{icon}</span>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trendIcon}</span>
            <span>{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default KPICard;
