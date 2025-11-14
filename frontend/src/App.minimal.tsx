import React from 'react';

export default function AppMinimal(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">🎉 Frontend is Working!</h1>
      <p className="text-lg mt-4">If you see this, the issue is with routing/state management.</p>
      <p className="text-lg mt-4">Checking localStorage token: {localStorage.getItem('token') ? 'YES' : 'NO'}</p>
    </div>
  );
}
