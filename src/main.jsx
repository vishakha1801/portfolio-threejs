import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// THREE.Clock was deprecated in r163 in favour of THREE.Timer.
// React Three Fiber uses it internally — not our code. Filter the noise
// until R3F ships an update that switches to Timer.
const _warn = console.warn.bind(console);
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
  _warn(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
