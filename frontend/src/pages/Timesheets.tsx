import React, { useState, useEffect } from 'react';
import { kekaApi, KekaTimeEntry } from '../services/kekaApi';

export default function Timesheets(): JSX.Element {
  const [timeEntries, setTimeEntries] = useState<KekaTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      // For now, get recent entries. In a full implementation, we'd filter by date/project/employee
      const response = await kekaApi.dashboard.getRecentTimeEntries(50);

      if (response.success && response.data) {
        setTimeEntries(response.data);
      } else {
        setError(response.error || 'Failed to load timesheet entries');
      }
    } catch (err) {
      setError('Failed to load timesheet entries');
      console.error('Timesheets fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchTimeEntries();
    }
  }, [startDate, endDate, selectedProject, selectedEmployee]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-semibold">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-xs font-semibold">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 py-1 px-3 rounded-full text-xs font-semibold">
            Rejected
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 py-1 px-3 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const getBillableBadge = (isBillable: boolean) => {
    return isBillable ? (
      <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded text-xs font-semibold">
        Billable
      </span>
    ) : (
      <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded text-xs font-semibold">
        Non-billable
      </span>
    );
  };

  const formatHours = (hours: number): string => {
    return parseFloat(hours.toString()).toFixed(2);
  };

  const calculateTotalHours = (): number => {
    return timeEntries.reduce((total, entry) => total + entry.hours_worked, 0);
  };

  const calculateBillableHours = (): number => {
    return timeEntries
      .filter(entry => entry.is_billable)
      .reduce((total, entry) => total + entry.hours_worked, 0);
  };

  const getUniqueProjects = (): string[] => {
    const projects = new Set(timeEntries.map(entry => entry.project_name).filter(Boolean));
    return Array.from(projects);
  };

  const getUniqueEmployees = (): string[] => {
    const employees = new Set(timeEntries.map(entry => entry.employee_name).filter(Boolean));
    return Array.from(employees);
  };

  const filteredEntries = timeEntries.filter(entry => {
    if (selectedProject && entry.project_name !== selectedProject) return false;
    if (selectedEmployee && entry.employee_name !== selectedEmployee) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timesheets...</p>
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
            onClick={() => fetchTimeEntries()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Timesheets</h1>
        <div className="text-sm text-gray-600">
          {filteredEntries.length} entries from Keka HRIS
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Hours</h3>
          <p className="text-3xl font-bold text-indigo-600">{formatHours(calculateTotalHours())}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Billable Hours</h3>
          <p className="text-3xl font-bold text-green-600">{formatHours(calculateBillableHours())}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Entries</h3>
          <p className="text-3xl font-bold text-blue-600">{filteredEntries.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Billability</h3>
          <p className="text-3xl font-bold text-purple-600">
            {calculateTotalHours() > 0 
              ? Math.round((calculateBillableHours() / calculateTotalHours()) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {getUniqueProjects().map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {getUniqueEmployees().map((employee) => (
                <option key={employee} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Project</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Hours</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Comments</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">
                      {new Date(entry.effort_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.effort_date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{entry.employee_name}</p>
                      <p className="text-sm text-gray-500">{entry.employee_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900">{entry.project_name}</p>
                      <p className="text-sm text-gray-500">{entry.client_name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-900">{entry.task_name || 'General'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-indigo-600">{formatHours(entry.hours_worked)}h</p>
                  </td>
                  <td className="py-3 px-4">
                    {getBillableBadge(entry.is_billable)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {entry.entry_comments || 'No comments'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No timesheet entries found for the selected criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}