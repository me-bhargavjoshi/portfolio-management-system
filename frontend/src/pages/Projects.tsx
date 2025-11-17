import React, { useState, useEffect } from 'react';
import { kekaApi, KekaProject } from '../services/kekaApi';

interface ProjectWithPagination {
  data: KekaProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Projects(): JSX.Element {
  const [projects, setProjects] = useState<KekaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async (page: number = 1, status: string = '', search: string = '') => {
    try {
      setLoading(true);
      const response = await kekaApi.projects.getProjects({
        page,
        limit: 10,
        status: status || undefined,
        search: search || undefined
      });

      if (response.success && response.data) {
        const result = response as any as { success: boolean; data: KekaProject[]; pagination: any };
        setProjects(result.data);
        if (result.pagination) {
          setCurrentPage(result.pagination.page);
          setTotalPages(result.pagination.totalPages);
        }
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (err) {
      setError('Failed to load projects');
      console.error('Projects fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage, statusFilter, searchQuery);
  }, [currentPage, statusFilter, searchQuery]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-semibold">
            Active
          </span>
        );
      case 2:
        return (
          <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-semibold">
            Completed
          </span>
        );
      case 3:
        return (
          <span className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-xs font-semibold">
            On Hold
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 py-1 px-3 rounded-full text-xs font-semibold">
            Unknown
          </span>
        );
    }
  };

  const getBillableType = (type: number) => {
    switch (type) {
      case 1:
        return 'Fixed';
      case 2:
        return 'Hourly';
      case 3:
        return 'Milestone';
      default:
        return 'Unknown';
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
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
            onClick={() => fetchProjects(currentPage, statusFilter, searchQuery)} 
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
        <h1 className="text-4xl font-bold text-gray-800">Projects</h1>
        <div className="flex space-x-4">
          <span className="text-sm text-gray-600">
            {projects.length} projects loaded from Keka
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Completed</option>
              <option value="3">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Project</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Budget</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900">{project.client_name}</p>
                      <p className="text-sm text-gray-500">{project.client_code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900">{getBillableType(project.billing_type)}</p>
                      <p className="text-sm text-gray-500">
                        {project.is_billable ? 'Billable' : 'Non-billable'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      {project.budget ? (
                        <p className="font-medium text-gray-900">${project.budget.toLocaleString()}</p>
                      ) : (
                        <p className="text-gray-500">Not set</p>
                      )}
                      {project.budgeted_time && (
                        <p className="text-sm text-gray-500">{project.budgeted_time}h budgeted</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(project.start_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        to {new Date(project.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      className="text-indigo-600 hover:text-indigo-700 text-sm mr-3"
                      onClick={() => console.log('View project:', project.id)}
                    >
                      View
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-700 text-sm"
                      onClick={() => console.log('Analytics:', project.id)}
                    >
                      Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No projects found</p>
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
