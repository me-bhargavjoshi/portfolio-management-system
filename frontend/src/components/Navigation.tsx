import React from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: 'dashboard' | 'projects' | 'employees' | 'timesheets') => void;
  onLogout: () => void;
}

export default function Navigation({ currentPage, onNavigate, onLogout }: NavigationProps): JSX.Element {
  const navItems = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Projects', path: 'projects' },
    { label: 'Employees', path: 'employees' },
    { label: 'Timesheets', path: 'timesheets' },
  ];

  return (
    <nav className="w-64 bg-gray-900 text-white p-6 min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Portfolio Mgmt</h1>
        <p className="text-gray-400 text-sm">IT Delivery</p>
      </div>

      <ul className="flex-1 space-y-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <button
              onClick={() => onNavigate(item.path as 'dashboard' | 'projects' | 'employees' | 'timesheets')}
              className={`w-full text-left px-4 py-2 rounded transition text-sm font-medium ${
                currentPage === item.path
                  ? 'bg-indigo-600'
                  : 'hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition text-sm font-medium text-red-400"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
