import React, { useEffect, useState } from "react";
import { Panel } from "../components/Ui";
import { categoryApi } from "../services/api";

const toRecord = item => typeof item === "string" ? {id: item, name: item} : item;

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  useEffect(() => { categoryApi.list().then(response => { const values = (response.data.results || response.data || []).map(toRecord); setRows(values); }).catch(() => setRows([])); }, []);
  const visible = rows.filter(category => category.name.toLowerCase().includes(query.toLowerCase()));
  async function add(event) { event.preventDefault(); const value = name.trim(); if (!value || rows.some(item => item.name.toLowerCase() === value.toLowerCase())) return; await categoryApi.create({name: value}); setName(""); setFormOpen(false); await reload(); }
  async function update(event) { event.preventDefault(); const value = name.trim(); if (!value || !editing) return; await categoryApi.update(editing.id, {name: value}); setEditing(null); setName(""); await reload(); }
  async function reload() { const response = await categoryApi.list(); setRows((response.data.results || response.data || []).map(toRecord)); }
  async function remove(category) { if (!window.confirm(`Delete category ${category.name}?`)) return; await categoryApi.remove(category.id); setRows(rows.filter(item => item.id !== category.id)); }
  return <Panel title="Categories" subtitle="Manage enquiry categories" action={<div className="category-toolbar"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search categories..." /><button className="primary" onClick={() => { setEditing(null); setName(""); setFormOpen(true); }}>+ Add Category</button></div>}>
    {(formOpen || editing) && <form className="category-form" onSubmit={editing ? update : add}>{editing && <strong>Editing: {editing.name}</strong>}<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder={editing ? "Edit category name" : "New category name"} required /><button className="primary">{editing ? "Update Category" : "Add Category"}</button><button type="button" className="secondary" onClick={() => { setEditing(null); setFormOpen(false); setName(""); }}>Close</button></form>}
    <div className="category-grid">{visible.map(category => <div className="category-card" key={category.id}><div className="category-icon">▦</div><h3>{category.name}</h3><p>Enquiry category</p><div className="card-actions"><button className="icon-btn" title="Edit" aria-label={`Edit ${category.name}`} onClick={() => { setEditing(category); setName(category.name); }}>✎</button><button className="icon-btn delete-btn" title="Delete" aria-label={`Delete ${category.name}`} onClick={() => remove(category)}>🗑</button></div></div>)}</div>{visible.length === 0 && <div className="empty">No categories found.</div>}
  </Panel>;
}
