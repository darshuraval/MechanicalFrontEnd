import React, { useEffect, useState } from "react";
import CrudTable from "./CrudTable";
import { API_BASE } from "../../config";

export default function ComponentSetting() {
  const [components, setComponents] = useState([]);
  const [machineOperations, setMachineOperations] = useState([]);

  // Load dropdown data
  useEffect(() => {
  async function loadDropdowns() {
    try {
      const resCom = await fetch(`${API_BASE}api/Component/GetForHelp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!resCom.ok) throw new Error(`HTTP error! status: ${resCom.status}`);
      const dataCom = await resCom.json();
      setComponents(Array.isArray(dataCom?.items?.lstResult1) ? dataCom.items.lstResult1 : []);

      const resOps = await fetch(`${API_BASE}api/MachineOperation/GetForHelp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!resOps.ok) throw new Error(`HTTP error! status: ${resOps.status}`);

      const dataOps = await resOps.json();
      setMachineOperations(Array.isArray(dataOps?.items?.lstResult1) ? dataOps.items.lstResult1 : []);
    } catch (err) {
      console.error("Error loading MachineOperations:", err);
      setMachineOperations([]); // fallback
    }
  }

  loadDropdowns();
}, []);


  return (
    <CrudTable
      title="Component Settings"
      apiBase={`${API_BASE}api/ComponentSetting`}
      hubEvent="ComponentSetting"
      endpoints={{
        list: "/GetForListing",
        save: "/AddEdit",
        delete: "/DeleteByID",
        getById: "/GetByID"
      }}
      columns={[
        { key: "ComponentID", label: "ID" },
        { key: "ComponentName", label: "Component Name" },
        { key: "ComponentType", label: "Component Type" },
        { key: "MachineOperationName", label: "Machine Operation" },
        { key: "CycleTime", label: "Cycle Time (In minutes)" },
        { key: "SetupTime", label: "Setup Time (In minutes)" },
        { key: "AddDate", label: "Created" },
        { key: "EditDate", label: "Modified" },
      ]}
      formFields={[
        {
          key: "ComponentID",
          label: "Component",
          type: "select",
          options: components.map((c) => ({
            value: c.ComponentID,
            label: c.ComponentName
          })),
          required: true
        },
        {
          key: "MachineOperationID",
          label: "Machine Operation",
          type: "select",
          options: machineOperations.map((op) => ({
            value: op.MachineOperationID,
            label: `${op.MachineName} → ${op.OperationName}`
          })),
          multiple: false,
          required: true
        },
        {
          key: "CycleTime",
          label: "Cycle Time (In minutes)",
          type: "number",
          min: 0,
          required: true
        },
        {
          key: "SetupTime",
          label: "Setup Time (In minutes)",
          type: "number",
          min: 0,
          required: true
        }
      ]}
      idKey="ComponentSettingID"
    />
  );
}
