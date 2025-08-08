import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Qms from "./components/pages/Qms";
import Assignment from "./components/pages/Assignment";
import QmsDetailsPage from "./components/pages/QmsDetailsPage";
import AdminPanel from "./components/admin/AdminPanel";
import UserManagement from "./components/admin/UserManagement";
import AddUser from "./components/admin/AddUser";
import PerformanceTracking from "./components/admin/PerformanceTracking";
import Approval from "./components/pages/Approval";
import SubmittedData from "./components/pages/SubmittedData";
import Sourcing from "./components/pages/Sourcing";
import SourcingDetails from "./components/pages/SourcingDetails"; // NEW IMPORT
import Submission from "./components/pages/Submission";
import Execution from "./components/pages/Execution";
import OrderComplete from "./components/pages/OrderComplete";
import "./styles/App.css";

// Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-07-26 04:21:57
// Current User's Login: MFakheem

// Sidebar with updated navigation structure
const Sidebar = ({ activeSection, onSectionClick, adminDropdown, setAdminDropdown }) => (
  <nav className="sidebar">
    <h2>QMS App</h2>
    <div>
      <button
        onClick={() => {
          setAdminDropdown(!adminDropdown);
          onSectionClick("admin");
        }}
        className={activeSection.startsWith("admin") ? "active" : ""}
        aria-current={activeSection.startsWith("admin") ? "page" : undefined}
      >
        Admin Panel
      </button>
      {adminDropdown && (
        <div className="sidebar-submenu">
          <button
            style={{ paddingLeft: 32, fontSize: "1rem" }}
            onClick={() => onSectionClick("usermanagement")}
            className={activeSection === "usermanagement" ? "active" : ""}
            aria-current={activeSection === "usermanagement" ? "page" : undefined}
          >
            User Management
          </button>
          <button
            style={{ paddingLeft: 32, fontSize: "1rem" }}
            onClick={() => onSectionClick("trackingperformance")}
            className={activeSection === "trackingperformance" ? "active" : ""}
            aria-current={activeSection === "trackingperformance" ? "page" : undefined}
          >
            Tracking Performance
          </button>
        </div>
      )}
    </div>
    <button
      onClick={() => onSectionClick("assignment")}
      className={activeSection === "assignment" ? "active" : ""}
      aria-current={activeSection === "assignment" ? "page" : undefined}
    >
      Assignment
    </button>
    <button
      onClick={() => onSectionClick("approval")}
      className={activeSection === "approval" ? "active" : ""}
      aria-current={activeSection === "approval" ? "page" : undefined}
    >
      Approval
    </button>
    <button
      onClick={() => onSectionClick("submitteddata")}
      className={activeSection === "submitteddata" ? "active" : ""}
      aria-current={activeSection === "submitteddata" ? "page" : undefined}
    >
      Submitted Data
    </button>
    <button
      onClick={() => onSectionClick("hunting")}
      className={activeSection === "hunting" ? "active" : ""}
      aria-current={activeSection === "hunting" ? "page" : undefined}
    >
      Hunting
    </button>
    <button
      onClick={() => onSectionClick("sourcing")}
      className={activeSection === "sourcing" ? "active" : ""}
      aria-current={activeSection === "sourcing" ? "page" : undefined}
    >
      Sourcing
    </button>
    <button
      onClick={() => onSectionClick("submission")}
      className={activeSection === "submission" ? "active" : ""}
      aria-current={activeSection === "submission" ? "page" : undefined}
    >
      Submission
    </button>
    <button
      onClick={() => onSectionClick("execution")}
      className={activeSection === "execution" ? "active" : ""}
      aria-current={activeSection === "execution" ? "page" : undefined}
    >
      Execution
    </button>
    <button
      onClick={() => onSectionClick("ordercomplete")}
      className={activeSection === "ordercomplete" ? "active" : ""}
      aria-current={activeSection === "ordercomplete" ? "page" : undefined}
    >
      Order Complete
    </button>
  </nav>
);

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = React.useState("hunting");
  const [adminDropdown, setAdminDropdown] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/qms") {
      setActiveSection("hunting");
      setAdminDropdown(false);
    } else if (location.pathname === "/assignment") {
      setActiveSection("assignment");
      setAdminDropdown(false);
    } else if (location.pathname === "/admin") {
      setActiveSection("admin");
      setAdminDropdown(true);
    } else if (location.pathname === "/admin/usermanagement") {
      setActiveSection("usermanagement");
      setAdminDropdown(true);
    } else if (location.pathname === "/admin/usermanagement/add") {
      setActiveSection("usermanagement");
      setAdminDropdown(true);
    } else if (location.pathname === "/admin/tracking-performance") {
      setActiveSection("trackingperformance");
      setAdminDropdown(true);
    } else if (location.pathname === "/approval") {
      setActiveSection("approval");
      setAdminDropdown(false);
    } else if (location.pathname === "/submitted-data") {
      setActiveSection("submitteddata");
      setAdminDropdown(false);
    } else if (location.pathname === "/sourcing") {
      setActiveSection("sourcing");
      setAdminDropdown(false);
    } else if (location.pathname.startsWith("/sourcing/")) {
      // NEW: Handle sourcing details pages
      setActiveSection("sourcing");
      setAdminDropdown(false);
    } else if (location.pathname === "/submission") {
      setActiveSection("submission");
      setAdminDropdown(false);
    } else if (location.pathname === "/execution") {
      setActiveSection("execution");
      setAdminDropdown(false);
    } else if (location.pathname === "/order-complete") {
      setActiveSection("ordercomplete");
      setAdminDropdown(false);
    }
  }, [location]);

  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (section === "assignment") {
      navigate("/assignment");
      setAdminDropdown(false);
    } else if (section === "hunting") {
      navigate("/qms");
      setAdminDropdown(false);
    } else if (section === "admin") {
      navigate("/admin");
      setAdminDropdown((d) => !d);
    } else if (section === "usermanagement") {
      navigate("/admin/usermanagement");
      setAdminDropdown(true);
    } else if (section === "trackingperformance") {
      navigate("/admin/tracking-performance");
      setAdminDropdown(true);
    } else if (section === "approval") {
      navigate("/approval");
      setAdminDropdown(false);
    } else if (section === "submitteddata") {
      navigate("/submitted-data");
      setAdminDropdown(false);
    } else if (section === "sourcing") {
      navigate("/sourcing");
      setAdminDropdown(false);
    } else if (section === "submission") {
      navigate("/submission");
      setAdminDropdown(false);
    } else if (section === "execution") {
      navigate("/execution");
      setAdminDropdown(false);
    } else if (section === "ordercomplete") {
      navigate("/order-complete");
      setAdminDropdown(false);
    }
  };

  return (
    <div className="container">
      <Sidebar
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        adminDropdown={adminDropdown}
        setAdminDropdown={setAdminDropdown}
      />
      <main className="main-content">
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/usermanagement" element={<UserManagement />} />
          <Route path="/admin/usermanagement/add" element={<AddUser />} />
          <Route path="/admin/tracking-performance" element={<PerformanceTracking />} />
          <Route path="/qms" element={<Qms />} />
          <Route path="/qms/:id" element={<QmsDetailsPage />} />
          <Route path="/assignment" element={<Assignment />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/submitted-data" element={<SubmittedData />} />
          <Route path="/sourcing" element={<Sourcing />} />
          <Route path="/sourcing/:id" element={<SourcingDetails />} /> {/* NEW ROUTE */}
          <Route path="/submission" element={<Submission />} />
          <Route path="/execution" element={<Execution />} />
          <Route path="/order-complete" element={<OrderComplete />} />
          <Route path="/" element={<Qms />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;