import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Form } from "react-bootstrap";

export default function Operations() {
  const [operations, setOperations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" | "edit" | "delete"
  const [form, setForm] = useState({ ID: "", Name: "", Type: "", Remarks: "", IsActive: true });

  // Replace with your API base
  // const apiBase = window.location.origin;
  // const apiBase = "https://localhost:7161";
  const apiBase = "https://darshan.runasp.net";


  // Load operations
  useEffect(() => {
    loadOperations();
  }, []);

  async function loadOperations() {
    try {
      const res = await fetch(`${apiBase}/OperationsGetListing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setOperations(data);
    } catch (err) {
      //alert("Error loading operations");
    }
  }

  function openModal(type, operation = null) {
    setModalType(type);
    if (operation) {
      setForm({
        ID: operation.ID,
        Name: operation.Name,
        Type: operation.Type ?? "",
        Remarks: operation.Remarks ?? "",
        IsActive: operation.IsActive
      });
    } else {
      setForm({ ID: "", Name: "", Type: "", Remarks: "", IsActive: true });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      Name: form.Name,
      Type: form.Type,
      Remarks: form.Remarks,
      IsActive: form.IsActive
    };
    if (modalType === "edit") payload.ID = form.ID;

    await fetch(`${apiBase}/OperationsAddEdit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    closeModal();
    loadOperations();
  }

  async function handleDelete() {
    await fetch(`${apiBase}/OperationsDelete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID: form.ID })
    });
    closeModal();
    loadOperations();
  }

  return (
    <div className="container mt-4">
      <h2>Operations</h2>
      <Button variant="primary" className="mb-3" onClick={() => openModal("add")}>Add Operation</Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Remarks</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((row) => (
            <tr key={row.ID}>
              <td>{row.ID}</td>
              <td>{row.Name}</td>
              <td>{row.Type ?? ""}</td>
              <td>{row.Remarks ?? ""}</td>
              <td>{row.IsActive ? "Yes" : "No"}</td>
              <td>
                <Button variant="warning" size="sm" className="me-1" onClick={() => openModal("edit", row)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => openModal("delete", row)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "add" && "Add Operation"}
            {modalType === "edit" && "Edit Operation"}
            {modalType === "delete" && "Delete Operation"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(modalType === "add" || modalType === "edit") && (
            <Form onSubmit={handleSave}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={form.Name}
                  required
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  value={form.Type}
                  onChange={(e) => setForm({ ...form, Type: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  type="text"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Active</Form.Label>
                <Form.Select
                  value={form.IsActive ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, IsActive: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Form.Group>
              <Button variant="primary" type="submit">Save</Button>
            </Form>
          )}
          {modalType === "delete" && (
            <div>
              <p>Are you sure you want to delete <strong>{form.Name}</strong>?</p>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}