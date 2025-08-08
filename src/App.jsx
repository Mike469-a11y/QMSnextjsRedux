import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useSelector } from 'react-redux';
import Layout from "./components/Layout";
import Qms from "./pages/Qms";
import Assignment from "./pages/Assignment";
import QmsDetailsPage from "./pages/QmsDetailsPage";
import AdminPanel from "./components/admin/AdminPanel";
import UserManagement from "./components/admin/UserManagement";
import AddUser from "./components/admin/AddUser";
import PerformanceTracking from "./components/admin/PerformanceTracking";
import Approval from "./pages/Approval";
import SubmittedData from "./pages/SubmittedData";
import Sourcing from "./pages/Sourcing";
import SourcingDetails from "./pages/SourcingDetails";
import Submission from "./pages/Submission";
import Execution from "./pages/Execution";
import OrderComplete from "./pages/OrderComplete";
import NotFound from "./pages/NotFound";
import "./styles/App.css";

// Create the router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Qms />,
      },
      {
        path: "qms",
        element: <Qms />,
      },
      {
        path: "qms/:id",
        element: <QmsDetailsPage />,
      },
      {
        path: "assignment",
        element: <Assignment />,
      },
      {
        path: "approval",
        element: <Approval />,
      },
      {
        path: "submitted-data",
        element: <SubmittedData />,
      },
      {
        path: "sourcing",
        element: <Sourcing />,
      },
      {
        path: "sourcing/:id",
        element: <SourcingDetails />,
      },
      {
        path: "submission",
        element: <Submission />,
      },
      {
        path: "execution",
        element: <Execution />,
      },
      {
        path: "order-complete",
        element: <OrderComplete />,
      },
      {
        path: "admin",
        element: <AdminPanel />,
      },
      {
        path: "admin/usermanagement",
        element: <UserManagement />,
      },
      {
        path: "admin/usermanagement/add",
        element: <AddUser />,
      },
      {
        path: "admin/tracking-performance",
        element: <PerformanceTracking />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  const currentUser = useSelector((state) => state.user.currentUser);
  
  return <RouterProvider router={router} />;
}

export default App;