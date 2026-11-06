import React from "react";
import ReactDOM from "react-dom/client";
import { StudioLayout } from "./studio/components/StudioLayout";
import "../style.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <StudioLayout />
    </React.StrictMode>
  );
} else {
  console.error("Root element #root not found in document.");
}
