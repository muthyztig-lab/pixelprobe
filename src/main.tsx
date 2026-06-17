import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import "./styles/index.css";

// Dark is the only theme — lock it in (and clear any old stored preference).
document.documentElement.setAttribute("data-theme", "dark");
try {
  localStorage.removeItem("pixelprobe-theme");
} catch {
  /* ignore */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
