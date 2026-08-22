import React, { useEffect, useState } from "react";
import { studentApi, saveLocalEnquiry } from "../services/api";
import { Panel, Pagination } from "../components/Ui";

const demo = [
  { name: "Vignesh M", status: "Joined", course: "Python Full Stack", paidFee: 22000, balanceFee: 8000, dueDate: "2026-08-10", mobile: "9876543210", email: "vignesh@gmail.com", city: "Chennai", joinDate: "18 Aug 2026" },
  { name: "Anitha R", status: "Joined", course: "Data Analyst", paidFee: 18000, balanceFee: 6000, dueDate: "2026-08-25", mobile: "9123456780", email: "anitha@gmail.com", city: "Chrompet", joinDate: "19 Aug 2026" },
  { name: "Monisha P", status: "Joined", course: "Placement", paidFee: 15000, balanceFee: 5000, dueDate: "2026-08-30", mobile: "9098765432", email: "monisha@gmail.com", city: "Tambaram", joinDate: "21 Aug 2026" },
  { name: "Kavya S", status: "Joined", course: "Data Analytics", paidFee: 20000, balanceFee: 9000, dueDate: "2026-08-04", mobile: "9988776655", email: "9988776655", city: "Velachery", joinDate: "17 Aug 2026" }
];
const initialForm = { name: "", course: "", mobile: "", email: "", city: "", paidFee: "", balanceFee: "", dueDate: "", joinDate: "", status: "Joined" };
const joinedOnly = student => String(student.status || student.final_status || student.finalStatus || "").toLowerCase() === "joined";
const normalize = student => ({ ...student, name: student.name || student.candidate_name, paidFee: student.paidFee ?? student.paid_fee ?? 0, balanceFee: student.balanceFee ?? student.balance_fee ?? 0, dueDate: student.dueDate || student.due_date, joinDate: student.joinDate || student.join_date });

export default function Students() {
  const [students, setStudents] = useState(demo);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let local = [];
    try { local = JSON.parse(localStorage.getItem("scot_it_students") || "[]"); } catch {}
    studentApi.list().then(response => setStudents([...((response.data.results || response.data).filter(joinedOnly).map(normalize)), ...local.filter(joinedOnly).map(normalize)]))
      .catch(() => setStudents([...demo, ...local].filter(joinedOnly).map(normalize)));
  }, []);

  const visibleStudents = students.slice((page - 1) * 5, page * 5);
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function addStudent(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const student = { ...form, paidFee: Number(form.paidFee), balanceFee: Number(form.balanceFee), status: "Joined" };
    let savedByApi = false;
    try { await studentApi.create(student); savedByApi = true; setMessage("Student added successfully."); }
    catch { setMessage("Student added in demo mode. Connect Django API to persist it."); }
    const saved = normalize({ ...student, id: `local-${Date.now()}` });
    setStudents([...students, saved]);
    if (!savedByApi) {
      localStorage.setItem("scot_it_students", JSON.stringify([...JSON.parse(localStorage.getItem("scot_it_students") || "[]"), saved]));
      saveLocalEnquiry({ candidate_name: student.name, name: student.name, mobile: student.mobile, city: student.city, course: student.course, category: student.category, status: "Joined", paid_fee: student.paidFee, balance_fee: student.balanceFee, next_followup_date: student.dueDate, comments: "Added from Students page." });
    }
    setSaving(false);
    setForm(initialForm);
  }

  return <>
    <Panel title="Students Details" subtitle="Joined students and their fee details" action={<button className="primary" onClick={() => { setFormOpen(true); setMessage(""); }}>+ Add Student</button>}>
      <div className="table-scroll"><table><thead><tr>{["#", "Student Name", "Course", "Paid Fee", "Balance Fee", "Due Date", "Action"].map(header => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{visibleStudents.map((student, index) => <tr key={student.id || student.name}><td>{(page - 1) * 5 + index + 1}</td><td><strong>{student.name}</strong></td><td>{student.course}</td><td>₹{Number(student.paidFee).toLocaleString("en-IN")}</td><td>₹{Number(student.balanceFee).toLocaleString("en-IN")}</td><td>{student.dueDate}</td><td><button className="primary small" onClick={() => setSelected(student)}>View</button></td></tr>)}</tbody>
      </table></div>
      <Pagination page={page} setPage={setPage} total={students.length} />
    </Panel>
    {formOpen && <div className="modal-backdrop" onClick={() => setFormOpen(false)}><form className="modal edit-modal" onSubmit={addStudent} onClick={event => event.stopPropagation()}><div className="modal-header"><div><h3>Add Student</h3><p>Add a joined student and fee details</p></div><button type="button" className="modal-close" onClick={() => setFormOpen(false)}>X</button></div><div className="form-grid">{[["name", "Student Name"], ["course", "Course"], ["mobile", "Mobile Number"], ["email", "Email"], ["city", "City"], ["paidFee", "Paid Fee"], ["balanceFee", "Balance Fee"]].map(([name, label]) => <div className="form-group" key={name}><label>{label}</label><input name={name} value={form[name]} onChange={change} required={name === "name" || name === "course"} /></div>)}<div className="form-group"><label>Category</label><select name="category" value={form.category || ""} onChange={change} required><option value="">Select Category</option>{["Development", "Cloud", "Testing", "Data Analytics / Data Science", "Fresher Placement", "Experienced Placement", "Oracle SQL", "UI/UX Design", "Documents / Test Only"].map(category => <option key={category}>{category}</option>)}</select></div><div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={form.dueDate} onChange={change} required /></div><div className="form-group"><label>Join Date</label><input type="date" name="joinDate" value={form.joinDate} onChange={change} required /></div></div>{message && <div className="success-message">{message}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={() => setFormOpen(false)}>Close</button><button className="primary" disabled={saving}>{saving ? "Saving..." : "Add Student"}</button></div></form></div>}
    {selected && <div className="student-detail-modal"><div className="student-detail-content"><div className="student-modal-header"><h3>Student Details</h3><button className="secondary small" onClick={() => setSelected(null)}>Close</button></div><div className="student-details-grid">{[["Student Name", selected.name], ["Course", selected.course], ["Mobile", selected.mobile], ["Email", selected.email], ["City", selected.city], ["Paid Fee", `₹${Number(selected.paidFee).toLocaleString("en-IN")}`], ["Balance Fee", `₹${Number(selected.balanceFee).toLocaleString("en-IN")}`], ["Due Date", selected.dueDate], ["Join Date", selected.joinDate]].map(item => <div className="detail-box" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></div>)}</div></div></div>}
  </>;
}
