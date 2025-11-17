import React, { useState, useEffect } from 'react';
import { kekaApi, KekaEmployee } from '../services/kekaApi';

export default function Employees(): JSX.Element {
  const [employees, setEmployees] = useState<KekaEmployee[]>([]);
  const [departments, setDepartments] = useState<{ department: string; employee_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmployees = async (page: number = 1, department: string = '', status: string = 'active') => {
    try {
      setLoading(true);
      const response = await kekaApi.employees.getEmployees({
        page,
        limit: 10,
        department: department || undefined,
        status: status || undefined
      });

      if (response.success && response.data) {
        const result = response as any as { success: boolean; data: KekaEmployee[]; pagination: any };
        setEmployees(result.data);
        if (result.pagination) {
          setCurrentPage(result.pagination.page);
          setTotalPages(result.pagination.totalPages);
        }
      } else {
        setError(response.error || 'Failed to load employees');
      }
    } catch (err) {
      setError('Failed to load employees');
      console.error('Employees fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await kekaApi.employees.getDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Departments fetch error:', err);
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage, departmentFilter, statusFilter);
    fetchDepartments();
  }, [currentPage, departmentFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-semibold">
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="bg-red-100 text-red-800 py-1 px-3 rounded-full text-xs font-semibold">
            Inactive
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

  const handleDepartmentFilter = (department: string) => {
    setDepartmentFilter(department);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  if (loading && employees.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
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
            onClick={() => fetchEmployees(currentPage, departmentFilter, statusFilter)} 
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
        <h1 className="text-4xl font-bold text-gray-800">Employees</h1>
        <div className="flex space-x-4">
          <span className="text-sm text-gray-600">
            {employees.length} employees loaded from Keka HRIS
          </span>
        </div>
      </div>

      {/* Department Summary Cards */}
      {departments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {departments.slice(0, 4).map((dept) => (
            <div key={dept.department} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">{dept.department}</h3>
              <p className="text-2xl font-bold text-indigo-600">{dept.employee_count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={departmentFilter}
              onChange={(e) => handleDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.department} value={dept.department}>
                  {dept.department} ({dept.employee_count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="active">Active Only</option>
              <option value="">All Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Joining Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter(emp => 
                  searchQuery === '' || 
                  emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((employee) => (
                <tr key={employee.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {employee.display_name} • {employee.employee_number}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-900">{employee.email}</p>
                      <p className="text-sm text-gray-500">{employee.phone || 'No phone'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900">{employee.department || 'Not assigned'}</p>
                      <p className="text-sm text-gray-500">{employee.location || 'No location'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-900">{employee.job_title || 'Not specified'}</p>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(employee.employment_status)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'Not available'}
                      </p>
                      {employee.reports_to && (
                        <p className="text-sm text-gray-500">Reports to: {employee.reports_to}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      className="text-indigo-600 hover:text-indigo-700 text-sm mr-3"
                      onClick={() => console.log('View employee:', employee.id)}
                    >
                      View
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-700 text-sm"
                      onClick={() => console.log('Time entries:', employee.id)}
                    >
                      Timesheets
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No employees found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
