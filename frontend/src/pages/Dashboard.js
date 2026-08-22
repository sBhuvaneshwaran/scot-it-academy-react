import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { enquiryApi, categoryApi, getLocalEnquiries, getLocalCategories } from "../services/api";
import { Panel, Stats, Badge, Pagination } from "../components/Ui";

const defaultCategories = ["Development", "Cloud", "Testing", "Data Analytics / DS", "Fresher Placement"];
const fallbackRows = [
  {candidate_name: "Vignesh M", mobile: "9876543210", city: "Chennai", category: "Development", course: "Python Full Stack", next_followup_date: "2026-08-18", status: "Joined", admin: "Praveen"},
  {candidate_name: "Anitha R", mobile: "9123456780", city: "Chrompet", category: "Data Analytics / Data Science", course: "Data Analyst", next_followup_date: "2026-08-19", status: "Positive", admin: "Dhana"},
  {candidate_name: "Karthik S", mobile: "9345678901", city: "Velachery", category: "Cloud", course: "AWS Cloud", next_followup_date: "2026-08-20", status: "Hold", admin: "Bhuvaneshwari"},
  {candidate_name: "Monisha P", mobile: "9098765432", city: "Tambaram", category: "Fresher Placement", course: "Placement", next_followup_date: "2026-08-21", status: "Positive", admin: "Kokila"},
  {candidate_name: "Arun Kumar", mobile: "9988776655", city: "Chennai", category: "Testing", course: "Software Testing", next_followup_date: "2026-08-25", status: "Low", admin: "Swathy"}
];
function statusOf(row) { return String(row.status || row.final_status || row.finalStatus || "Pending").trim(); }
function keyOf(row) { return row.mobile || row.id || `${row.candidate_name || row.name}-${row.course}`; }
function categoryOf(value) { const name = typeof value === "object" ? value.name : value; return String(name || "Other").toLowerCase().includes("data analytics") ? "Data Analytics / DS" : name || "Other"; }

export default function Dashboard() {
  const [rows, setRows] = useState([]), [categories, setCategories] = useState(defaultCategories), [query, setQuery] = useState(""), [status, setStatus] = useState(""), [page, setPage] = useState(1);
  useEffect(() => {
    const local = getLocalEnquiries();
    Promise.all([enquiryApi.list(), categoryApi.list()]).then(([enquiryResponse, categoryResponse]) => {
      const incoming = enquiryResponse.data.results || enquiryResponse.data || [];
      const unique = new Map();
      [...incoming, ...local].forEach(row => unique.set(keyOf(row), row));
      const names = (categoryResponse.data.results || categoryResponse.data || []).map(item => typeof item === "string" ? item : item.name).filter(Boolean);
      setRows([...unique.values()]);
      setCategories([...new Set([...defaultCategories, ...names, ...getLocalCategories()])]);
    }).catch(() => setRows(local.length ? local : fallbackRows));
  }, []);
  const currentRows = rows.length ? rows : fallbackRows;
  const filtered = currentRows.filter(row => `${row.candidate_name || row.name} ${row.mobile} ${row.city}`.toLowerCase().includes(query.toLowerCase()) && (!status || statusOf(row) === status));
  const visibleRows = filtered.slice((page - 1) * 5, page * 5);
  const total = currentRows.length;
  const count = value => currentRows.filter(row => statusOf(row).toLowerCase() === value.toLowerCase()).length;
  const joinedCounts = categories.map(category => [category, currentRows.filter(row => statusOf(row).toLowerCase() === "joined" && categoryOf(row.category).toLowerCase() === category.toLowerCase()).length]);
  const maxCount = Math.max(1, ...joinedCounts.map(item => item[1]));
  const today = new Date().toISOString().slice(0, 10);
  const allOverdue = currentRows.filter(row => !["joined", "negative"].includes(statusOf(row).toLowerCase()) && row.next_followup_date && row.next_followup_date < today);
  const overdue = allOverdue.slice(0, 4);
  const recentRow = row => [row.admin || "Admin", row.candidate_name || row.name, row.mobile, row.city, row.category, row.course, row.next_followup_date || "", statusOf(row)];
  return <><Stats items={[["▣", "blue", "Total Enquiries", total, "Current Data"], ["✓", "green", "Positive", count("Positive"), ""], ["◷", "orange", "Pending", count("Pending"), ""], ["↓", "red", "Negative", count("Negative"), ""], ["♟", "purple", "Joined", count("Joined"), ""]].map(item => ({icon: item[0], color: item[1], label: item[2], value: item[3], sub: item[4]}))} />
    <div className="dashboard-grid"><Panel title="Joined Students by Category" subtitle="Current data"><div className="chart-bars">{joinedCounts.map(item => <div className="chart-row" key={item[0]}><label>{item[0]}</label><div className="bar"><i style={{width: `${item[1] ? Math.max(8, item[1] / maxCount * 100) : 0}%`}} /></div><b>{item[1]}</b></div>)}</div></Panel><Panel title="Overdue Follow-ups" subtitle={`${allOverdue.length} follow-ups overdue`}>{overdue.length ? overdue.map((row, index) => <div className="follow-item" key={`${keyOf(row)}-${index}`}><div><strong>{row.candidate_name || row.name}</strong><small>{row.course}</small><small>Due {row.next_followup_date}</small></div><Badge status={statusOf(row)} /></div>) : <div className="empty">No overdue follow-ups.</div>}{allOverdue.length > 4 && <Link className="link-btn" to="/follow-ups">View all follow-ups</Link>}</Panel></div>
    <Panel title="Recent Enquiries" action={<a className="link-btn" href="/enquiry-list">View All</a>} className="table-panel"><div className="dashboard-filters"><input placeholder="Search candidate, mobile or city..." value={query} onChange={event => {setQuery(event.target.value); setPage(1);}} /><select value={status} onChange={event => {setStatus(event.target.value); setPage(1);}}><option value="">All Status</option>{["Positive", "Pending", "Low", "Hold", "Negative", "Joined"].map(item => <option key={item}>{item}</option>)}</select></div><div className="table-scroll"><table><thead><tr>{["Admin", "Candidate", "Mobile", "City", "Category", "Course", "Follow-up", "Status"].map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={`${keyOf(row)}-${index}`}>{recentRow(row).slice(0, 7).map((value, cell) => <td key={cell}>{value}</td>)}<td><Badge status={statusOf(row)} /></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="empty">No enquiries match these filters.</div>}<Pagination page={page} setPage={setPage} total={filtered.length} /></Panel></>;
}
