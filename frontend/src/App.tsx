function App(): JSX.Element {
  return (
    <div style={{ padding: '100px', textAlign: 'center', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '48px', color: '#00aa00', margin: '20px 0' }}>
        ✅ SUCCESS! Frontend Works!
      </h1>
      <p style={{ fontSize: '24px', color: '#333', margin: '20px 0' }}>
        If you're reading this without infinite loops, we're good!
      </p>
      <p style={{ fontSize: '16px', color: '#666', margin: '40px 0' }}>
        No React Router, no complex state, just plain React.
      </p>
    </div>
  );
}

export default App;
