import "./bootstrap";
import ReactDOM from "react-dom/client";
import { TemplateApp } from "@/template-app";

const mountElement = document.getElementById("app");

if (mountElement) {
  ReactDOM.createRoot(mountElement).render(<TemplateApp />);
}
