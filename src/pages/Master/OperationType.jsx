import React from "react";
import CrudTable from "../../components/CrudTable";
import { API_BASE } from "../../config";

export default function OperationType() {
  return (
    <CrudTable
      title="Operation Types"
      apiBase={`${API_BASE}/OperationType`}
      endpoints={{
        list: "/GetForListing",
        save: "/AddEdit",
        delete: "/DeleteByID",
        getById: "/GetByID",
      }}
      columns={[
        { key: "OperationTypeID", label: "ID" },
        { key: "OperationName", label: "Operation Name" },
        { key: "IsActive", label: "Active", render: v => (v ? "Yes" : "No") },
        // { key: "AddBy", label: "Created By", render: v => (v ? new Date(v).toLocaleString() : "-") },
        // { key: "EditBy", label: "Modified By", render: v => (v ? new Date(v).toLocaleString() : "-") },
        { key: "AddDate", label: "Created", render: v => (v ? new Date(v).toLocaleString() : "-") },
        { key: "EditDate", label: "Modified", render: v => (v ? new Date(v).toLocaleString() : "-") },
      ]}
      formFields={[
        { key: "OperationName", label: "Operation Name", type: "text", required: true },
        // { key: "IsActive", label: "Active", type: "select", options: [
        //   { value: true, label: "Active" },
        //   { value: false, label: "Inactive" },
        // ]},
      ]}
        idKey="OperationTypeID"
      />
  );
}
