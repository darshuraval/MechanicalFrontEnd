import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";

export default function CrudTable({ title, apiBase, endpoints, columns, formFields, idKey }) {
  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [form, setForm] = useState({});

  // Load data
  async function loadData() {
    const res = await fetch(`${apiBase}${endpoints.list}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await res.json();
    setRows(data?.items?.lstResult1 || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Open modal
  function openModal(type, row = null) {
    setModalType(type);
    if (row) {
      const recordId = row[idKey];      // pick correct primary key
      setForm({ ...row, ID: recordId }); // always normalize to "ID" for backend
    } else {
      setForm({ ID: 0 });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  // Save (Add/Edit)
  async function handleSave(e) {
    e.preventDefault();
    const payload = { ...form };

    await fetch(`${apiBase}${endpoints.save}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    closeModal();
    loadData();
  }

  // Delete
  async function handleDelete() {
    await fetch(`${apiBase}${endpoints.delete}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID: form.ID })
    });

    closeModal();
    loadData();
  }

  // Render input field
  function renderInput(field) {
    const value = form[field.key] ?? "";

    switch (field.type) {
      case "textarea":
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={value}
            required={field.required}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
          />
        );
      case "select":
        return (
          <Form.Select
            value={value}
            onChange={(e) => {
              let val = e.target.value;
              if (val === "true") val = true;
              if (val === "false") val = false;
              setForm({ ...form, [field.key]: val });
            }}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        );
      default:
        return (
          <Form.Control
            type={field.type || "text"}
            value={value}
            required={field.required}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
          />
        );
    }
  }

  return (
    <div className="container mt-4">
      <h2>{title}</h2>
      <Button onClick={() => openModal("add")} className="mb-3">
        Add {title}
      </Button>

      {/* Table */}
      <Table striped bordered hover>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[idKey]}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              <td>
                <Button
                  size="sm"
                  variant="warning"
                  className="me-1"
                  onClick={() => openModal("edit", row)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => openModal("delete", row)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal */}
      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "add" && `Add ${title}`}
            {modalType === "edit" && `Edit ${title}`}
            {modalType === "delete" && `Delete ${title}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(modalType === "add" || modalType === "edit") && (
            <Form onSubmit={handleSave}>
              {formFields.map((field) => (
                <Form.Group className="mb-3" key={field.key}>
                  <Form.Label>{field.label}</Form.Label>
                  {renderInput(field)}
                </Form.Group>
              ))}
              <Button type="submit">Save</Button>
            </Form>
          )}
          {modalType === "delete" && (
            <div>
              <p>
                Are you sure you want to delete{" "}
                <b>{form.MachineName || form.Name || form.OperationName}</b>?
              </p>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
