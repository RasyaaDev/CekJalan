import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import { PenyediaWarga } from './lib/auth'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PenyediaWarga>
        <App />
      </PenyediaWarga>
    </BrowserRouter>
  </React.StrictMode>,
)
