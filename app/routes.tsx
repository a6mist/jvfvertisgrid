import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Dashboard } from "./pages/dashboard";
import { Controls } from "./pages/controls";
import { Treasury } from "./pages/treasury";
import { Logs } from "./pages/logs";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "controls", Component: Controls },
      { path: "treasury", Component: Treasury },
      { path: "logs", Component: Logs },
    ],
  },
]);
