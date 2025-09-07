import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Modal, Form, Spinner } from "react-bootstrap";
import * as signalR from "@microsoft/signalr";
import { API_BASE_SOCKET } from "../../config";

export default function CrudTable({ title, apiBase, hubEvent, endpoints, columns, formFields, idKey }) {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [form, setForm] = useState({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const connectionRef = useRef(null);

  // Load data
  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}${endpoints.list}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      let list = data?.items?.lstResult1;
      if (Array.isArray(list)) setRows(list);
      else if (list) setRows([list]);
      else setRows([]);
      setFilteredRows(list || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setRows([]);
      setFilteredRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Setup SignalR
  useEffect(() => {
    loadData();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(API_BASE_SOCKET)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log("SignalR Connected for", hubEvent);
        connection.invoke("JoinGroup", hubEvent);
        connection.on("RefreshData", () => loadData());
      })
      .catch((err) => console.error("SignalR connection error:", err));

    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.invoke("LeaveGroup", hubEvent).catch(() => {});
        connectionRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Real-time search
  useEffect(() => {
    if (!searchText) setFilteredRows(rows);
    else {
      const lower = searchText.toLowerCase();
      setFilteredRows(
        rows.filter((row) =>
          columns.some((col) => {
            const val = row[col.key];
            return val != null && val.toString().toLowerCase().includes(lower);
          })
        )
      );
    }
  }, [searchText, rows]);

  // Open modal
  function openModal(type, row = null) {
    setModalType(type);
    if (row) setForm({ ...row, ID: row[idKey] });
    else {
      const initForm = { ID: 0 };
      formFields.forEach((f) => (initForm[f.key] = f.type === "boolean" ? false : ""));
      setForm(initForm);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  // Save record
  async function handleSave(e) {
    e.preventDefault();
    try {
      const payload = {};
      formFields.forEach((f) => {
        let val = form[f.key];
        if (f.type === "int") val = Number(val);
        else if (f.type === "float") val = parseFloat(val);
        else if (f.type === "boolean") val = Boolean(val);
        payload[f.key] = val;
      });
      payload.ID = form.ID || 0;

      await fetch(`${apiBase}${endpoints.save}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      closeModal();
      loadData();
    } catch (err) {
      console.error("Error saving record:", err);
    }
  }

  // Delete record
  async function handleDelete() {
    try {
      await fetch(`${apiBase}${endpoints.delete}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: form.ID })
      });
      closeModal();
      loadData();
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  }

  // Render input
  function renderInput(f) {
    const value = form[f.key];
    switch (f.type) {
      case "textarea":
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={value}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          />
        );
      case "select":
        return (
          <Form.Select
            value={value}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          >
            <option value="">-select-</option>
            {f.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        );
      case "boolean":
        return (
          <Form.Check
            type="checkbox"
            checked={!!value}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
            label=""
          />
        );
      default:
        return (
          <Form.Control
            type={f.type || "text"}
            value={value}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          />
        );
    }
  }

  const isSaveDisabled = formFields.some(
    (f) => f.type === "select" && (!form[f.key] && form[f.key] !== 0)
  );

  return (
    <div className="container mt-4">
      <h2>{title}</h2>
      <div className="d-flex justify-content-between mb-2">
        <Button onClick={() => openModal("add")}>Add {title}</Button>
        <Form.Control
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: "250px" }}
        />
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center">
                <Spinner animation="border" size="sm" /> Fetching...
              </td>
            </tr>
          ) : filteredRows.length > 0 ? (
            filteredRows.map((row) => (
              <tr key={row[idKey]}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
                ))}
                <td>
                  <Button size="sm" variant="warning" className="me-1" onClick={() => openModal("edit", row)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => openModal("delete", row)}>Delete</Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="text-center">No records found</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "add" ? `Add ${title}` : modalType === "edit" ? `Edit ${title}` : `Delete ${title}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(modalType === "add" || modalType === "edit") && (
            <Form onSubmit={handleSave}>
              {formFields.map((f) => (
                <Form.Group key={f.key} className="mb-3">
                  <Form.Label>{f.label}</Form.Label>
                  {renderInput(f)}
                </Form.Group>
              ))}
              <Button type="submit" disabled={isSaveDisabled}>Save</Button>
            </Form>
          )}
          {modalType === "delete" && (
            <div>
              <p>Are you sure you want to delete <b>{form.MachineName || form.Name || form.OperationName}</b>?</p>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
