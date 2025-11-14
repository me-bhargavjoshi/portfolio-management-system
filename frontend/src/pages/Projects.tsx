import React from 'react';

export default function Projects(): JSX.Element {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Projects</h1>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">
          + New Project
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Project Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Account</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">Digital Transformation</td>
              <td className="py-3 px-4">TechCorp Inc</td>
              <td className="py-3 px-4">
                <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-semibold">
                  Active
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </td>
              <td className="py-3 px-4">
                <button className="text-indigo-600 hover:text-indigo-700 text-sm">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center text-gray-500 mt-8">Projects list to be implemented with full CRUD operations</p>
    </div>
  );
}
