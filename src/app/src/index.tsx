import React from 'react';
import ReactDOM from 'react-dom/client';
import { AstraForgeApp } from './App';
import './styles/index.css';

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AstraForgeApp />
  </React.StrictMode>
);
