import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// 導入Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// 導入Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// 註冊Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker 註冊成功:', registration);
      })
      .catch(error => {
        console.log('Service Worker 註冊失敗:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);