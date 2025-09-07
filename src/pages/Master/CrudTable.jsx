import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Spinner } from "react-bootstrap";

export default function CrudTable({ title, apiBase, endpoints, columns, formFields, idKey }) {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [form, setForm] = useState({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // Load data
  async function loadData() {
    try {
      setLoading(true); // start loading
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
      setLoading(false); // end loading
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Real-time search
  useEffect(() => {
    if (!searchText) setFilteredRows(rows);
    else {
      const lowerSearch = searchText.toLowerCase();
      setFilteredRows(
        rows.filter((row) =>
          columns.some((col) => {
            const val = row[col.key];
            return val !== null && val !== undefined && val.toString().toLowerCase().includes(lowerSearch);
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
      formFields.forEach(f => initForm[f.key] = f.type === "select" ? "" : "");
      setForm(initForm);
    }
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); }

  // Save (Add/Edit)
  async function handleSave(e) {
    e.preventDefault();
    try {
      const payload = {};
      formFields.forEach((field) => {
        let value = form[field.key];
        if (field.type === "int") value = Number(value);
        else if (field.type === "float") value = parseFloat(value);
        payload[field.key] = value;
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

  // Delete
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

  // Render input field
  function renderInput(field) {
    const value = form[field.key] ?? "";
    switch (field.type) {
      case "textarea":
        return <Form.Control as="textarea" rows={3} value={value} required={field.required} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />;
      case "select":
        return (
          <Form.Select value={value} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>
            <option value="">-select-</option>
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Form.Select>
        );
      default:
        return <Form.Control type={field.type || "text"} value={value} min={field.min} max={field.max} step={field.step} required={field.required} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />;
    }
  }

  const isSaveDisabled = formFields.some(f => f.type === "select" && (!form[f.key] && form[f.key] !== 0));

  return (
    <div className="container mt-4">
      <h2>{title}</h2>

      <div className="d-flex justify-content-between mb-2">
        <Button onClick={() => openModal("add")}>Add {title}</Button>
        <Form.Control type="text" placeholder="Search..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: "250px" }} />
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
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
            filteredRows.map(row => (
              <tr key={row[idKey]}>
                {columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>)}
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
          <Modal.Title>{modalType === "add" ? `Add ${title}` : modalType === "edit" ? `Edit ${title}` : `Delete ${title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(modalType === "add" || modalType === "edit") && (
            <Form onSubmit={handleSave}>
              {formFields.map(field => (
                <Form.Group className="mb-3" key={field.key}>
                  <Form.Label>{field.label}</Form.Label>
                  {renderInput(field)}
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
