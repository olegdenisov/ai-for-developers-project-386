import ReactDOM from 'react-dom/client';
import { reatomContext, reatomComponent } from '@reatom/react';
import { appRender } from './app/router';
import { AppProviders } from './app/providers';
import './app/styles/global.css';

// App component that renders based on route render() methods
// Оборачиваем в reatomComponent для реактивности к атомам роутера
const App = reatomComponent(function App() {
  return <>{appRender()}</>;
}, 'App');

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <reatomContext.Provider value={null}>
    <AppProviders>
      <App />
    </AppProviders>
  </reatomContext.Provider>
  // </React.StrictMode>
);
