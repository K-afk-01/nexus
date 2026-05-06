import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Landing      from './pages/Landing'
import Verify       from './pages/Verify'
import ProfileSetup from './pages/ProfileSetup'
import AppPage      from './pages/App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Landing />} />
        <Route path="/verify"         element={<Verify />} />
        <Route path="/profile-setup"  element={<ProfileSetup />} />
        <Route path="/app"            element={<AppPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
