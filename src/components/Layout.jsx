import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import './Layout.css';  // <-- import here

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
        <h6><Link to="/" className="text-uppercase text-secondary sidebar-link">DashBoard</Link></h6>
        {/* Master Section */}
        <h6
          className="text-uppercase text-secondary"
          role="button"
          onClick={() => toggleSection("master")}
        >
          <h6 className="text-uppercase text-secondary sidebar-link">Master {openSections.master ? "▼" : "▶"}</h6>
        </h6>

        {openSections.master && (
          <ul className="nav flex-column mb-3">
            <li className="nav-item">
              <Link to="/machines" className="sidebar-link text-white">Machines</Link>
            </li>
            <li className="nav-item">
              <Link to="/Operations" className="sidebar-link text-white">Operations</Link>
            </li>
            

            <li className="nav-item">
              <Link to="/MachineOperations" className="sidebar-link text-white">Machine Operations</Link>
            </li>
            <li className="nav-item">
              <Link to="/components" className="sidebar-link text-white">Components</Link>
            </li>
          </ul>
        )}

        {/* Transactions Section */}
        <h6
          className="text-uppercase text-secondary"
          role="button"
          onClick={() => toggleSection("transactions")}
        >
          <h6 className="text-uppercase text-secondary sidebar-link">Transactions {openSections.transactions ? "▼" : "▶"}</h6>
        </h6>

        {openSections.transactions && (
          <ul className="nav flex-column mb-3">
            <li className="nav-item">
              <Link to="/schedules" className="sidebar-link text-white">Schedules</Link>
            </li>
            <li className="nav-item">
              <Link to="/assignments" className="sidebar-link text-white">Assignments</Link>
            </li>
            <li className="nav-item">
              <Link to="/reports" className="sidebar-link text-white">Reports</Link>
            </li>
          </ul>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4 bg-light" style={{ height: "100vh", overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
}
