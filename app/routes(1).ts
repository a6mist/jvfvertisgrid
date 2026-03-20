import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { InvoicePaymentPage } from "./components/InvoicePaymentPage";
import { InvoiceGenerator } from "./components/InvoiceGenerator";
import { InvoiceManagement } from "./components/InvoiceManagement";
import { HomePage } from "./components/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/pay/:invoiceId",
    Component: InvoicePaymentPage,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: InvoiceGenerator,
      },
      {
        path: "invoices",
        Component: InvoiceManagement,
      },
    ],
  },
]);
