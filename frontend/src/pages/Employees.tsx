import React from 'react';

export default function Employees(): JSX.Element {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Employees</h1>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">
          + Add Employee
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Designation</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Utilization</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">John Doe</td>
              <td className="py-3 px-4">Engineering</td>
              <td className="py-3 px-4">Senior Developer</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <span className="text-sm">88%</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <button className="text-indigo-600 hover:text-indigo-700 text-sm">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center text-gray-500 mt-8">Employee management with utilization tracking to be implemented</p>
    </div>
  );
}
