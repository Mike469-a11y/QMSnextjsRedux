import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../../styles/App.css";

const SECTIONS = [
    { key: "admin", label: "Admin Panel", icon: "⚙️" },
    { key: "hunting", label: "QMS", icon: "🎯" },
    { key: "assignment", label: "Assignment", icon: "📋" }
];

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState("hunting");

    useEffect(() => {
        if (location.pathname === "/" || location.pathname === "" || location.pathname.startsWith("/qms")) {
            setActiveSection("hunting");
        } else if (location.pathname.startsWith("/assignment")) {
            setActiveSection("assignment");
        } else if (location.pathname.startsWith("/admin")) {
            setActiveSection("admin");
        }
    }, [location]);

    const handleSectionClick = (section) => {
        setActiveSection(section);
        if (section === "assignment") {
            navigate("/assignment");
        } else if (section === "hunting") {
            navigate("/");
        } else if (section === "admin") {
            navigate("/admin");
        }
    };

    return (
        <div className="container">
            <nav className="sidebar">
                <h2>QMS App</h2>
                {SECTIONS.map((sec) => (
                    <button
                        key={sec.key}
                        onClick={() => handleSectionClick(sec.key)}
                        className={activeSection === sec.key ? "active" : ""}
                        aria-current={activeSection === sec.key ? "page" : undefined}
                    >
                        <span style={{ marginRight: '10px' }}>{sec.icon}</span>
                        {sec.label}
                    </button>
                ))}
            </nav>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;