import React, { useState } from "react";
import { Panel } from "../components/Ui";

const defaults = ["John Doe", "Rajesh", "SCOT Students", "Online", "Others"];
const storageKey = "scot_it_referrals";

function loadReferrals() {
	try {
		const stored = localStorage.getItem(storageKey);
		const names = stored === null ? defaults : JSON.parse(stored);
		return [...new Set(names)].map((name, index) => ({id: `${name}-${index}`, name}));
	} catch {
		return defaults.map((name, index) => ({id: `${name}-${index}`, name}));
	}
}

function saveReferrals(rows) {
	localStorage.setItem(storageKey, JSON.stringify(rows.map(row => row.name)));
}

export default function ReferBy() {
	const [rows, setRows] = useState(loadReferrals);
	const [name, setName] = useState("");
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState(null);
	const [formOpen, setFormOpen] = useState(false);

	function submit(event) {
		event.preventDefault();
		const value = name.trim();
		if (!value || rows.some(row => row.name.toLowerCase() === value.toLowerCase() && row.id !== editing?.id)) return;

		const nextRows = editing
			? rows.map(row => row.id === editing.id ? {...row, name: value} : row)
			: [...rows, {id: `${value}-${Date.now()}`, name: value}];
		setRows(nextRows);
		saveReferrals(nextRows);
		setName("");
		setEditing(null);
		setFormOpen(false);
	}

	function remove(row) {
		if (!window.confirm(`Delete referral source ${row.name}?`)) return;
		const nextRows = rows.filter(item => item.id !== row.id);
		setRows(nextRows);
		saveReferrals(nextRows);
		if (editing?.id === row.id) {
			setEditing(null);
			setName("");
			setFormOpen(false);
		}
	}

	function startEditing(row) {
		setEditing(row);
		setName(row.name);
		setFormOpen(true);
	}

	const visible = rows.filter(row => row.name.toLowerCase().includes(query.toLowerCase()));

	return <Panel title="Refer By" subtitle="Manage referral sources" action={<div className="category-toolbar">
		<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search referral sources..." aria-label="Search referral sources" />
		<button className="primary" onClick={() => { setEditing(null); setName(""); setFormOpen(true); }}>+ Add Referral</button>
	</div>}>
		{(formOpen || editing) && <form className="category-form" onSubmit={submit}>
			{editing && <strong>Editing: {editing.name}</strong>}
			<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder={editing ? "Edit referral source" : "Referral source"} required />
			<button className="primary">{editing ? "Update Referral" : "Add Referral"}</button>
			<button type="button" className="secondary" onClick={() => { setEditing(null); setFormOpen(false); setName(""); }}>Close</button>
		</form>}
		<div className="category-grid">{visible.map(row => <div className="category-card" key={row.id}>
			<div className="category-icon">↗</div>
			<h3>{row.name}</h3>
			<p>Referral source</p>
			<div className="card-actions">
				<button className="icon-btn" title="Edit" aria-label={`Edit ${row.name}`} onClick={() => startEditing(row)}>✎</button>
				<button className="icon-btn delete-btn" title="Delete" aria-label={`Delete ${row.name}`} onClick={() => remove(row)}>🗑</button>
			</div>
		</div>)}</div>
		{visible.length === 0 && <div className="empty">No referral sources found.</div>}
	</Panel>;
}