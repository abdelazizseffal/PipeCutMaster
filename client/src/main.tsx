import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { MaterialSymbolsProvider } from "./components/MaterialSymbolsProvider";

createRoot(document.getElementById("root")!).render(
  <MaterialSymbolsProvider>
    <App />
  </MaterialSymbolsProvider>
);
