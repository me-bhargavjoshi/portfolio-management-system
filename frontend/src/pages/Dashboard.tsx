import React from 'react';

export default function Dashboard(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Projects</h3>
          <p className="text-3xl font-bold text-indigo-600">24</p>
          <p className="text-green-600 text-xs mt-2">↑ 12% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Employees</h3>
          <p className="text-3xl font-bold text-green-600">156</p>
          <p className="text-gray-600 text-xs mt-2">Billable: 134</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Utilization Rate</h3>
          <p className="text-3xl font-bold text-blue-600">82%</p>
          <p className="text-orange-600 text-xs mt-2">↓ 3% from last week</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Effort Variance</h3>
          <p className="text-3xl font-bold text-purple-600">+5.2%</p>
          <p className="text-red-600 text-xs mt-2">Actual vs Estimated</p>
        </div>
      </div>

      {/* Variance Analysis Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Projected vs Estimated vs Actual</h2>
        <div className="text-center text-gray-500 py-8">
          <p>Interactive variance analysis chart to be implemented</p>
        </div>
      </div>

      {/* Resource Utilization Heatmap */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resource Utilization Heatmap</h2>
        <div className="text-center text-gray-500 py-8">
          <p>Utilization heatmap by employee and department to be implemented</p>
        </div>
      </div>
    </div>
  );
}
