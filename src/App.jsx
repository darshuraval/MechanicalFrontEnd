import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Machines from "./pages/Machines";
import Operations from "./pages/Operations";
import MachineOperations from "./pages/MachineOperations";
import Components from "./pages/Components";

import Schedules from "./pages/Schedules";
import Assignments from "./pages/Assignments";
import Reports from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<h2>Welcome to Mechanical Scheduler</h2>} />
          <Route path="machines" element={<Machines />} />
          <Route path="operations" element={<Operations />} />
          <Route path="machineoperations" element={<MachineOperations />} />
          <Route path="schedules" element={<Schedules />} />

          <Route path="components" element={<Components />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
