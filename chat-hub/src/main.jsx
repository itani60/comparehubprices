import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatPage from './ChatPage';
import './ChatPage.css';

const App = () => (
  <div style={{ height: '100vh', width: '100vw' }}>
    <ChatPage />
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
