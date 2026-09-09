import React, { useEffect, useMemo, useState } from "react";
import { Panel } from "../components/Ui";
import { referralApi } from "../services/api";

const storageKey = "scot_it_referrals";
export default function ReferBy() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    referralApi
      .list()
      .then((response) => {
        const apiRows = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
          ? response.data
          : [];

        const unique = new Map();
        apiRows.filter(Boolean).forEach((row) => {
          if (!row?.name) return;
          unique.set(String(row.id || row.name), { ...row, name: row.name.trim() });
        });

        const nextRows = [...unique.values()];
        setRows(nextRows);
      })
      .catch(() => {
        setRows([]);
      });
  }, []);

  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return rows;
    return rows.filter((row) => String(row.name || "").toLowerCase().includes(value));
  }, [rows, search]);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "" });
    setFormOpen(false);
  }

  async function submitForm(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    if (editingId) {
      const updatedRow = { ...rows.find((row) => row.id === editingId), name };
      const nextRows = rows.map((row) => (row.id === editingId ? updatedRow : row));
      setRows(nextRows);

      try {
        await referralApi.update(editingId, { name });
      } catch {}
    } else {
      const newRow = { id: Date.now(), name };
      const nextRows = [...rows, newRow];
      setRows(nextRows);

      try {
        await referralApi.create({ name });
      } catch {}
    }

    resetForm();
  }

  function editRow(row) {
    setEditingId(row.id);
    setForm({ name: row.name });
    setFormOpen(true);
  }

  async function deleteRow(row) {
    const confirmed = window.confirm(`Delete "${row.name}" from referral sources?`);
    if (!confirmed) return;

    const nextRows = rows.filter((item) => item.id !== row.id);
    setRows(nextRows);

    if (editingId === row.id) {
      resetForm();
    }

    try {
      if (row.id) {
        await referralApi.remove(row.id);
      }
    } catch {}
  }

  return (
    <Panel
      title="Refer By"
      subtitle="Manage referral sources"
      action={
        <div className="referral-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search referral source"
            aria-label="Search referral source"
          />
          <button
            type="button"
            className="primary"
            onClick={() => {
              setForm({ name: "" });
              setEditingId(null);
              setFormOpen(true);
            }}
          >
            + Add Referral
          </button>
        </div>
      }
    >
      {formOpen && (
        <form className="referral-form" onSubmit={submitForm}>
          <div className="referral-form-row">
            <input
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              placeholder={editingId ? "Edit referral source" : "Referral source"}
              aria-label="Referral source"
              autoFocus
            />
            <button type="submit" className="primary">
              {editingId ? "Update" : "Add"}
            </button>
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="category-grid">
        {filteredRows.length > 0 ? (
          filteredRows.map((row) => (
            <div className="category-card referral-card" key={row.id || row.name}>
              <div className="category-icon">↗</div>
              <h3>{row.name}</h3>
              <p>Referral source</p>
              <div className="card-actions">
                <button type="button" className="icon-btn" title="Edit" aria-label={`Edit ${row.name}`} onClick={() => editRow(row)}>
                  ✎
                </button>
                <button type="button" className="icon-btn delete-btn" title="Delete" aria-label={`Delete ${row.name}`} onClick={() => deleteRow(row)}>
                  🗑
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty referral-empty">No referral sources found.</div>
        )}
      </div>
    </Panel>
  );
}