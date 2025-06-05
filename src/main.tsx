import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { PlaylistProvider } from './context/PlaylistContext'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <PlaylistProvider>
        <App />
        <Toaster position="top-right" />
      </PlaylistProvider>
    </AuthProvider>
  </React.StrictMode>
);
