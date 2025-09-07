import React from "react";
import CrudTable from "./CrudTable";
import { API_BASE } from "../../config";

export default function Machine() {
  return (
    <CrudTable
      title="Machine"
      apiBase={`${API_BASE}api/Machine`}
      hubEvent="Machine"
      endpoints={{
        list: "/GetForListing",
        save: "/AddEdit",
        delete: "/DeleteByID",
        getById: "/GetByID"
      }}
      columns={[
        { key: "MachineID", label: "ID" },
        { key: "MachineCode", label: "Code" },
        { key: "MachineName", label: "Name" },
        { key: "Details", label: "Details" },
        { key: "Remarks", label: "Remarks" },
        { key: "IsActive", label: "Active", render: (v) => (v ? "Yes" : "No") },
        { key: "AddDate", label: "Created" },
        { key: "EditDate", label: "Modified" }
      ]}
      formFields={[
        { key: "MachineCode", label: "Machine Code", type: "text", required: true },
        { key: "MachineName", label: "Machine Name", type: "text", required: true },
        { key: "Details", label: "Details", type: "textarea" },
        { key: "Remarks", label: "Remarks", type: "textarea" },
        { key: "IsActive", label: "Active", type: "boolean" } // checkbox
      ]}
      idKey="MachineID"
    />
  );
}
