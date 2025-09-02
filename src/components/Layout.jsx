import { useState } from "react";

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="d-flex flex-column vh-100">
      {/* Header */}
      <header className="bg-primary text-white d-flex justify-content-between align-items-center px-3 py-2">
        <h1 className="h4 m-0">Mechanical Scheduler</h1>
        <nav className="d-none d-md-flex gap-3">
          <a href="#" className="text-white text-decoration-none">Dashboard</a>
          <a href="#" className="text-white text-decoration-none">Machines</a>
          <a href="#" className="text-white text-decoration-none">Schedules</a>
          <a href="#" className="text-white text-decoration-none">Reports</a>
        </nav>
        <button
          className="btn btn-sm btn-dark d-md-none"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        {open && (
          <aside className="bg-light border-end p-3" style={{ width: "220px" }}>
            <ul className="list-unstyled">
              <li><a href="#" className="text-decoration-none d-block py-1">Dashboard</a></li>
              <li><a href="#" className="text-decoration-none d-block py-1">Machines</a></li>
              <li><a href="#" className="text-decoration-none d-block py-1">Schedules</a></li>
              <li><a href="#" className="text-decoration-none d-block py-1">Reports</a></li>
            </ul>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-grow-1 p-3 bg-light">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-secondary text-white text-center py-2">
        © {new Date().getFullYear()} Mechanical Scheduler
      </footer>
    </div>
  );
}
