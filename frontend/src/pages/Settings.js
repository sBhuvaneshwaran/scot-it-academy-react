import React, { useState } from "react";
import { Panel } from "../components/Ui";

export default function Settings() {
	const [email, setEmail] = useState("scotitacademy@gmail.com");
	const [follow, setFollow] = useState(true);
	const [duplicateCheck, setDuplicateCheck] = useState(true);
	const [saved, setSaved] = useState(false);

	function save(event) {
		event.preventDefault();
		setSaved(true);
	}

	return <div className="settings-grid">
		<Panel title="Institute Settings" subtitle="Update academy information">
			<form onSubmit={save}>
				<div className="form-group"><label htmlFor="institute-name">Institute Name</label><input id="institute-name" defaultValue="SCOT IT Academy" /></div>
				<div className="form-group"><label htmlFor="institute-email">Email</label><input id="institute-email" type="email" value={email} onChange={event => setEmail(event.target.value)} /></div>
				<div className="form-group"><label htmlFor="institute-branch">Branch</label><input id="institute-branch" defaultValue="Keelkattalai" /></div>
				<div className="form-actions settings-actions"><button className="primary">Save Settings</button></div>
				{saved && <div className="success-message" role="status">Settings saved successfully.</div>}
			</form>
		</Panel>
		<Panel title="System Settings" subtitle="Configure notifications">
			<div className="setting-row"><div><strong>Follow-up Reminder</strong><small>Notify admins about due follow-ups</small></div><label className="switch"><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} /><span /></label></div>
			<div className="setting-row"><div><strong>Duplicate Mobile Check</strong><small>Prevent duplicate enquiry mobile numbers</small></div><label className="switch"><input type="checkbox" checked={duplicateCheck} onChange={event => setDuplicateCheck(event.target.checked)} /><span /></label></div>
		</Panel>
	</div>;
}