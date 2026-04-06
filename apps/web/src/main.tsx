import React from 'react';
import ReactDOM from 'react-dom/client';
import { reatomContext } from '@reatom/react';
import { appRender } from './app/router';
import { AppProviders } from './app/providers';
import './app/styles/global.css';

// App component that renders based on route render() methods
function App() {
  return <>{appRender()}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <reatomContext.Provider value={undefined}>
      <AppProviders>
        <App />
      </AppProviders>
    </reatomContext.Provider>
  </React.StrictMode>
);
