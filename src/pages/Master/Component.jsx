import React from "react";
import CrudTable from "../../components/CrudTable";
import { API_BASE } from "../../config";

export default function Component() {
  return (
    <CrudTable
      title="Component"
      apiBase={`${API_BASE}api/Component`}
      endpoints={{
        list: "/GetForListing",
        save: "/AddEdit",
        delete: "/DeleteByID",
        getById: "/GetByID"
      }}
      columns={[
        { key: "ComponentID", label: "ID" },
        { key: "ComponentName", label: "Name" },
        { key: "ComponentType", label: "Type" },
        { key: "Details", label: "Details" },
        { key: "Remarks", label: "Remarks" },
        { key: "IsActive", label: "Active", render: (v) => (v ? "Yes" : "No") },
        { key: "AddDate", label: "Created" },
        { key: "EditDate", label: "Modified" }
      ]}
      formFields={[
        { key: "ComponentName", label: "Component Name", type: "text", required: true },
        { key: "ComponentType", label: "Component Type", type: "text", required: true },
        { key: "Details", label: "Details", type: "textarea" },
        { key: "Remarks", label: "Remarks", type: "textarea" },
        {
          key: "IsActive",
          label: "Active",
          type: "select",
          options: [
            { value: true, label: "Yes" },
            { value: false, label: "No" }
          ]
        }
      ]}
      idKey="ComponentID"
      />
    );
}
