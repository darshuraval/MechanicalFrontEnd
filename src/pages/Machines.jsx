import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" | "edit" | "delete"
  const [form, setForm] = useState({ Id: "", MachineName: "", Remarks: "", IsActive: true });

  // Replace with your API base
  // const apiBase = window.location.origin;
  // const apiBase = "https://localhost:7161";
  const apiBase = "https://darshan.runasp.net";

  // Load machines
  useEffect(() => {
    loadMachines();
  }, []);

  async function loadMachines() {
    try {
      const res = await fetch(`${apiBase}/MachineGetListing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setMachines(data);
    } catch (err) {
      //alert("Error loading machines");
      console.error("Error loading machines:", err);
    }
  }

  function openModal(type, machine = null) {
    setModalType(type);
    if (machine) {
      setForm({
        Id: machine.Id,
        MachineName: machine.MachineName,
        Remarks: machine.Remarks ?? "",
        IsActive: machine.IsActive
      });
    } else {
      setForm({ Id: "", MachineName: "", Remarks: "", IsActive: true });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      MachineName: form.MachineName,
      Remarks: form.Remarks,
      IsActive: form.IsActive
    };
    if (modalType === "edit") payload.Id = form.Id;

    await fetch(`${apiBase}/MachineAddEdit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    closeModal();
    loadMachines();
  }

  async function handleDelete() {
    await fetch(`${apiBase}/MachineDelete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Id: form.Id })
    });
    closeModal();
    loadMachines();
  }

  return (
    <div className="container mt-4">
      <h2>Machines</h2>
      <Button variant="primary" className="mb-3" onClick={() => openModal("add")}>
        Add Machine
      </Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Remarks</th>
            <th>Active</th>
            <th>Created</th>
            <th>Modified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((row) => (
            <tr key={row.Id}>
              <td>{row.Id}</td>
              <td>{row.MachineName}</td>
              <td>{row.Remarks ?? ""}</td>
              <td>{row.IsActive ? "Yes" : "No"}</td>
              <td>{row.CreatedDate}</td>
              <td>{row.UpdatedDate}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-1"
                  onClick={() => openModal("edit", row)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => openModal("delete", row)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "add" && "Add Machine"}
            {modalType === "edit" && "Edit Machine"}
            {modalType === "delete" && "Delete Machine"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(modalType === "add" || modalType === "edit") && (
            <Form onSubmit={handleSave}>
              <Form.Group className="mb-3">
                <Form.Label>Machine Name</Form.Label>
                <Form.Control
                  type="text"
                  value={form.MachineName}
                  required
                  onChange={(e) => setForm({ ...form, MachineName: e.target.value })}
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
              <Button variant="primary" type="submit">
                Save
              </Button>
            </Form>
          )}
          {modalType === "delete" && (
            <div>
              <p>Are you sure you want to delete <strong>{form.MachineName}</strong>?</p>
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
