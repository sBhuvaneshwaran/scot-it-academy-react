import React, { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { Panel } from "../components/Ui";

const fallback = ["John", "Priya", "Prakesh", "Rajesh", "Vadivel", "Raju", "Aravind", "Archana"];

export default function Admins() {
  const [rows, setRows] = useState(fallback.map(name => ({id: name, name, role: "Administrator", status: "Active"})));
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const load = () => adminApi.list().then(response => setRows((response.data.results || response.data || []).map(item => typeof item === "string" ? {id: item, name: item, role: "Administrator", status: "Active"} : item))).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const visible = rows.filter(admin => admin.name.toLowerCase().includes(query.toLowerCase()));
  async function add(event) { event.preventDefault(); const value = name.trim(); if (!value) return; await adminApi.create({name: value}); setName(""); setFormOpen(false); load(); }
  async function update() { const value = name.trim(); if (!value) return; await adminApi.update(editing.id, {name: value}); setEditing(null); setName(""); load(); }
  async function remove(admin) { if (!window.confirm(`Delete admin ${admin.name}?`)) return; await adminApi.remove(admin.id); load(); }
  return <Panel title="Admins" subtitle="Manage enquiry administrators" action={<div className="inline-form"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search admin..." /><button className="primary" onClick={() => {setName("");setFormOpen(true);}}>+ Add Admin</button>{editing && <><input value={name} onChange={event => setName(event.target.value)} placeholder="Edit admin name" /><button className="primary" onClick={update}>Update Admin</button><button className="secondary" onClick={() => {setEditing(null);setName("");}}>Cancel</button></>}</div>}>
    <div className="category-grid">{visible.map(admin => <div className="category-card" key={admin.id}><div className="category-icon">♙</div><h3>{admin.name}</h3><p>{admin.role || "Administrator"}</p><span className="badge positive">{admin.status || "Active"}</span><div className="card-actions"><button className="icon-btn" title="Edit" aria-label={`Edit ${admin.name}`} onClick={() => {setEditing(admin);setName(admin.name);}}>✎</button><button className="icon-btn delete-btn" title="Delete" aria-label={`Delete ${admin.name}`} onClick={() => remove(admin)}>🗑</button></div></div>)}</div>
    {visible.length === 0 && <div className="empty">No admins found.</div>}
    {formOpen && <div className="modal-backdrop" onClick={() => setFormOpen(false)}><form className="modal" onSubmit={add} onClick={event => event.stopPropagation()}><div className="modal-header"><div><h3>Add Admin</h3><p>Create a new enquiry administrator</p></div><button type="button" className="modal-close" onClick={() => setFormOpen(false)}>X</button></div><div className="form-group"><label>Admin Name</label><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Enter admin name" required /></div><div className="form-actions"><button type="button" className="secondary" onClick={() => setFormOpen(false)}>Close</button><button className="primary">Add Admin</button></div></form></div>}
  </Panel>;
}
