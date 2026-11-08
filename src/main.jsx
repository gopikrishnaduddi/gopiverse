import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// wait briefly for web fonts so the generated fallback posters use them
const fontsReady = Promise.race([
  Promise.all([document.fonts.load('40px Anton'), document.fonts.load('700 12px Manrope')]).catch(() => {}),
  new Promise((r) => setTimeout(r, 2500)),
])
fontsReady.then(() => {
  createRoot(document.getElementById('root')).render(
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  )
})
