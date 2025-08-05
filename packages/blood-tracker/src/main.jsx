import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BloodSugarTracker from "./BloodSugarTracker.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BloodSugarTracker />
  </StrictMode>,
)
