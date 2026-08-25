import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { registerSW } from "virtual:pwa-register";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";

// Tự động đăng ký Service Worker để ứng dụng hoạt động ngoại tuyến (Offline) 100%
registerSW({ immediate: true });

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "355465717765-7rnpgg2m270563ohcskprnqiej2duaco.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
