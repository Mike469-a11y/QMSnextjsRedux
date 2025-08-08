import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { setActiveSection, setAdminDropdown, toggleAdminDropdown } from '../store/slices/uiSlice';

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
  const dispatch = useDispatch();
  
  // Get state from Redux store
  const { activeSection, adminDropdown } = useSelector((state) => state.ui);
  const currentUser = useSelector((state) => state.user.currentUser);

  React.useEffect(() => {
    let section = "hunting";
    let dropdown = false;

    if (location.pathname === "/" || location.pathname === "/qms") {
      section = "hunting";
    } else if (location.pathname === "/assignment") {
      section = "assignment";
    } else if (location.pathname === "/admin") {
      section = "admin";
      dropdown = true;
    } else if (location.pathname === "/admin/usermanagement") {
      section = "usermanagement";
      dropdown = true;
    } else if (location.pathname === "/admin/usermanagement/add") {
      section = "usermanagement";
      dropdown = true;
    } else if (location.pathname === "/admin/tracking-performance") {
      section = "trackingperformance";
      dropdown = true;
    } else if (location.pathname === "/approval") {
      section = "approval";
    } else if (location.pathname === "/submitted-data") {
      section = "submitteddata";
    } else if (location.pathname === "/sourcing") {
      section = "sourcing";
    } else if (location.pathname.startsWith("/sourcing/")) {
      section = "sourcing";
    } else if (location.pathname === "/submission") {
      section = "submission";
    } else if (location.pathname === "/execution") {
      section = "execution";
    } else if (location.pathname === "/order-complete") {
      section = "ordercomplete";
    }

    dispatch(setActiveSection(section));
    dispatch(setAdminDropdown(dropdown));
  }, [location, dispatch]);

  const handleSectionClick = (section) => {
    dispatch(setActiveSection(section));
    
    if (section === "assignment") {
      navigate("/assignment");
      dispatch(setAdminDropdown(false));
    } else if (section === "hunting") {
      navigate("/qms");
      dispatch(setAdminDropdown(false));
    } else if (section === "admin") {
      navigate("/admin");
      dispatch(toggleAdminDropdown());
    } else if (section === "usermanagement") {
      navigate("/admin/usermanagement");
      dispatch(setAdminDropdown(true));
    } else if (section === "trackingperformance") {
      navigate("/admin/tracking-performance");
      dispatch(setAdminDropdown(true));
    } else if (section === "approval") {
      navigate("/approval");
      dispatch(setAdminDropdown(false));
    } else if (section === "submitteddata") {
      navigate("/submitted-data");
      dispatch(setAdminDropdown(false));
    } else if (section === "sourcing") {
      navigate("/sourcing");
      dispatch(setAdminDropdown(false));
    } else if (section === "submission") {
      navigate("/submission");
      dispatch(setAdminDropdown(false));
    } else if (section === "execution") {
      navigate("/execution");
      dispatch(setAdminDropdown(false));
    } else if (section === "ordercomplete") {
      navigate("/order-complete");
      dispatch(setAdminDropdown(false));
    }
  };

  return (
    <div className="container">
      <Sidebar
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        adminDropdown={adminDropdown}
        setAdminDropdown={(value) => dispatch(setAdminDropdown(value))}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;