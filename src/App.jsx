import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Machine from "./pages/Master/Machine";
import OperationType from "./pages/Master/OperationType";
import MachineOperation from "./pages/Master/MachineOperation";
import Components from "./pages/Master/Components";

import Schedules from "./pages/Transaction/Schedules";
import Assignments from "./pages/Transaction/Assignments";
import Reports from "./pages/Transaction/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<h2>Welcome to Mechanical Scheduler</h2>} />
          <Route path="Machine" element={<Machine />} />
          <Route path="OperationType" element={<OperationType />} />
          <Route path="MachineOperation" element={<MachineOperation />} />
          <Route path="Schedules" element={<Schedules />} />

          <Route path="Components" element={<Components />} />
          <Route path="Assignments" element={<Assignments />} />
          <Route path="Reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
