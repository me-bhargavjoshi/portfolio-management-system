import React, { useState, useEffect } from 'react';
import { kekaApi, DashboardMetrics, KekaTimeEntry, ProjectAnalytics } from '../services/kekaApi';

export default function Dashboard(): JSX.Element {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentEntries, setRecentEntries] = useState<KekaTimeEntry[]>([]);
  const [topProjects, setTopProjects] = useState<ProjectAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [metricsRes, recentRes, projectsRes] = await Promise.all([
          kekaApi.dashboard.getDashboardMetrics(),
          kekaApi.dashboard.getRecentTimeEntries(10),
          kekaApi.dashboard.getTopProjects(5)
        ]);

        if (metricsRes.success && metricsRes.data) {
          setMetrics(metricsRes.data);
        }

        if (recentRes.success && recentRes.data) {
          setRecentEntries(recentRes.data);
        }

        if (projectsRes.success && projectsRes.data) {
          setTopProjects(projectsRes.data);
        }

        if (!metricsRes.success) {
          setError(metricsRes.error || 'Failed to load dashboard metrics');
        }

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatHours = (hours: number | null | undefined): string => {
    if (hours === null || hours === undefined) return '0.0';
    return parseFloat(hours.toString()).toFixed(1);
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Portfolio Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards with Real Data */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-indigo-600">{formatNumber(metrics?.active_projects)}</p>
          <p className="text-gray-600 text-xs mt-2">Total Clients: {formatNumber(metrics?.total_clients)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Employees</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(metrics?.active_employees)}</p>
          <p className="text-gray-600 text-xs mt-2">Total Tasks: {formatNumber(metrics?.total_tasks)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Hours This Month</h3>
          <p className="text-3xl font-bold text-blue-600">{formatHours(metrics?.current_month_hours)}</p>
          <p className="text-gray-600 text-xs mt-2">Total: {formatHours(metrics?.total_hours_logged)} hrs</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Recent Activity</h3>
          <p className="text-3xl font-bold text-purple-600">{formatNumber(metrics?.last_week_entries)}</p>
          <p className="text-gray-600 text-xs mt-2">Entries last 7 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Time Entries */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Time Entries</h2>
          <div className="space-y-3">
            {recentEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{entry.employee_name}</p>
                  <p className="text-sm text-gray-600">{entry.project_name}</p>
                  <p className="text-xs text-gray-500">{entry.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">{formatHours(entry.hours_worked)}h</p>
                  <p className="text-xs text-gray-500">{new Date(entry.effort_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {recentEntries.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent time entries found</p>
            )}
          </div>
        </div>

        {/* Top Projects by Hours */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Projects by Hours</h2>
          <div className="space-y-3">
            {topProjects.map((project, index) => (
              <div key={project.project_id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-400 mr-3">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-800">{project.project_name}</p>
                    <p className="text-sm text-gray-600">{project.client_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatHours(project.actual_hours)}h</p>
                  <p className="text-xs text-gray-500">
                    {project.employees_worked} employees
                  </p>
                </div>
              </div>
            ))}
            {topProjects.length === 0 && (
              <p className="text-gray-500 text-center py-4">No project data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Budget & Time Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Active Budget</h3>
            <p className="text-2xl font-bold text-green-600">
              ${formatNumber(metrics?.total_active_budget)}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Budgeted Hours</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatHours(metrics?.total_budgeted_hours)}h
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Hours This Year</h3>
            <p className="text-2xl font-bold text-purple-600">
              {formatHours(metrics?.current_year_hours)}h
            </p>
          </div>
        </div>
        
        {metrics?.last_timesheet_date && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Last timesheet entry: {new Date(metrics.last_timesheet_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
