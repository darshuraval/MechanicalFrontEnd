import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import "./Layout.css";

export default function Layout() {
  const [openSections, setOpenSections] = useState({
    master: false,
    transactions: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white p-3 vh-100" style={{ width: "250px" }}>
        <h2 className="mb-4">Mechanical Scheduler</h2>

        {/* Dashboard Link */}
        <h6>
          <Link to="/" className="text-uppercase text-secondary sidebar-link">
            Dashboard
          </Link>
        </h6>

        {/* Master Section */}
        <h6
          className="text-uppercase text-secondary sidebar-link"
          role="button"
          onClick={() => toggleSection("master")}
        >
          <span>Master {openSections.master ? "▼" : "▶"}</span>
        </h6>

        {openSections.master && (
          <ul className="nav flex-column mb-3">
            <li className="nav-item">
              <Link to="/Machine" className="sidebar-link text-white">
                Machine
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/OperationType" className="sidebar-link text-white">
                Operation Type
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/MachineOperation" className="sidebar-link text-white">
                Machine Operation
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/components" className="sidebar-link text-white">
                Components
              </Link>
            </li>
          </ul>
        )}

        {/* Transactions Section */}
        <h6
          className="text-uppercase text-secondary sidebar-link"
          role="button"
          onClick={() => toggleSection("transactions")}
        >
          <span>Transactions {openSections.transactions ? "▼" : "▶"}</span>
        </h6>

        {openSections.transactions && (
          <ul className="nav flex-column mb-3">
            <li className="nav-item">
              <Link to="/schedules" className="sidebar-link text-white">
                Schedules
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/assignments" className="sidebar-link text-white">
                Assignments
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/reports" className="sidebar-link text-white">
                Reports
              </Link>
            </li>
          </ul>
        )}
      </div>

      {/* Main Content */}
      <div
        className="flex-grow-1 p-4 bg-light"
        style={{ height: "100vh", overflowY: "auto" }}
      >
        <Outlet />
      </div>
    </div>
  );
}
