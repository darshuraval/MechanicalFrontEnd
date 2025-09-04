import React, { useEffect, useState } from "react";
import CrudTable from "../../components/CrudTable";
import { API_BASE } from "../../config";

export default function MachineOperation() {
  const [machines, setMachines] = useState([]);
  const [operationTypes, setOperationTypes] = useState([]);

  // Load dropdown data
  useEffect(() => {
    async function loadDropdowns() {
      const resMachines = await fetch(`${API_BASE}/Machine/GetForHelp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const dataMachines = await resMachines.json();
      setMachines(dataMachines?.items?.lstResult1 || []);

      const resOps = await fetch(`${API_BASE}/OperationType/GetForHelp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const dataOps = await resOps.json();
      setOperationTypes(dataOps?.items?.lstResult1 || []);
    }

    loadDropdowns();
  }, []);

  return (
    <CrudTable
      title="Machine Operation"
      apiBase={`${API_BASE}/MachineOperation`}
      endpoints={{
        list: "/GetForListing",
        save: "/AddEdit",
        delete: "/DeleteByID",
        getById: "/GetByID"
      }}
      columns={[
        { key: "MachineOperationID", label: "ID" },
        { key: "MachineCode", label: "Machine Code" },
        { key: "MachineName", label: "Machine Name" },
        { key: "OperationName", label: "Operation Type" },
        // { key: "AddBy", label: "Created By" },
        // { key: "EditBy", label: "Modified By" },
        { key: "AddDate", label: "Created" },
        { key: "EditDate", label: "Modified" },
      ]}
      formFields={[
        {
          key: "MachineID",
          label: "Machine",
          type: "select",
          options: machines.map((m) => ({ value: m.MachineID, label: m.MachineName })),
          required: true
        },
        {
          key: "OperationTypeID",
          label: "Operation Type",
          type: "select",
          options: operationTypes.map((o) => ({ value: o.OperationTypeID, label: o.OperationName })),
          required: true
        }
      ]}
      idKey="MachineOperationID"
    />
  );
}
