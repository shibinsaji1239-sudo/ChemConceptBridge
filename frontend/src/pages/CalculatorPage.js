import React from 'react';
import Navbar from '../components/Layout/Navbar';
import ChemistryCalculator from '../components/ChemistryCalculator/ChemistryCalculator';

const CalculatorPage = () => {
  const userRole = localStorage.getItem('userRole') || null;
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={userRole} />
      <div style={{ maxWidth: 1100, margin: '80px auto 40px', padding: '0 16px' }}>
        <div className="dashboard-card">
          <h3 style={{ marginBottom: 12 }}>Chemistry Calculator</h3>
          <ChemistryCalculator />
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
