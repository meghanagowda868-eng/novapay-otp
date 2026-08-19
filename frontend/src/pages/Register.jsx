import React from 'react';
import RegistrationForm from '../components/RegistrationForm';

export default function Register({ addToast }) {
  return (
    <div style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
      <RegistrationForm addToast={addToast} />
    </div>
  );
}
