import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/i18n.ts";
import Web3Provider from "./providers/Web3Provider";

createRoot(document.getElementById("root")!).render(
  <Web3Provider>
    <App />
  </Web3Provider>
);
