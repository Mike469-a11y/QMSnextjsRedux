import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { queryClient } from './api/queryClient';
import App from "./App";
import ErrorBoundary from './components/common/ErrorBoundary';
import "./styles/App.css";
import "./styles/components.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);