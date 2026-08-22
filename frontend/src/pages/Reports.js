import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { enquiryApi, getLocalEnquiries } from "../services/api";
import { Panel, Stats } from "../components/Ui";

const fallback = [
  {candidate_name: "Vignesh M", status: "Joined", enquiry_date: "2026-08-18"},
  {candidate_name: "Anitha R", status: "Positive", enquiry_date: "2026-08-19"},
  {candidate_name: "Karthik S", status: "Hold", enquiry_date: "2026-08-20"},
  {candidate_name: "Monisha P", status: "Positive", enquiry_date: "2026-08-21"},
  {candidate_name: "Arun Kumar", status: "Low", enquiry_date: "2026-08-22"}
];
function statusOf(row) { return String(row.status || row.final_status || row.finalStatus || "Pending").trim(); }
function dateOf(row) { return row.enquiry_date || row.created_at || row.date || ""; }

export default function Reports() {
  const [rows, setRows] = useState(fallback);
  useEffect(() => {
    const local = getLocalEnquiries();
    enquiryApi.list().then(response => setRows([...(response.data.results || response.data || []), ...local])).catch(() => setRows(local.length ? local : fallback));
  }, []);
  const unique = [...new Map(rows.map(row => [row.mobile || row.id || row.candidate_name, row])).values()];
  const total = unique.length;
  const count = value => unique.filter(row => statusOf(row).toLowerCase() === value.toLowerCase()).length;
  const months = [...Array(8)].map((_, index) => { const date = new Date(); date.setMonth(date.getMonth() - (7 - index)); return {label: date.toLocaleString("en-US", {month: "short"}), month: date.getMonth(), year: date.getFullYear()}; });
  const monthly = months.map(month => unique.filter(row => { const value = dateOf(row); return value && new Date(value).getMonth() === month.month && new Date(value).getFullYear() === month.year; }).length);
  const maxMonthly = Math.max(1, ...monthly);
  function downloadExcel() {
    const headers = ["Candidate", "Mobile", "City", "Category", "Course", "Status", "Enquiry Date"];
    const values = unique.map(row => [row.candidate_name || row.name || "", row.mobile || "", row.city || "", row.category || "", row.course || "", statusOf(row), dateOf(row)]);
    const csv = [headers, ...values].map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], {type: "text/csv;charset=utf-8"}));
    link.download = "scot-enquiry-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function downloadPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("SCOT IT Academy - Enquiry Report", 14, 18);
    pdf.setFontSize(11); pdf.text(`Total Enquiries: ${total}`, 14, 32); pdf.text(`Positive: ${count("Positive")}`, 14, 40); pdf.text(`Joined: ${count("Joined")}`, 14, 48); pdf.text(`Conversion: ${total ? ((count("Joined") / total) * 100).toFixed(2) : "0.00"}%`, 14, 56);
    pdf.setFontSize(14); pdf.text("Status Summary", 14, 72);
    ["Positive", "Pending", "Negative", "Joined", "Hold", "Low"].forEach((value, index) => pdf.text(`${value}: ${count(value)}`, 20, 82 + index * 8));
    pdf.setFontSize(14); pdf.text("Enquiries", 14, 140); pdf.setFontSize(9);
    unique.forEach((row, index) => { const y = 150 + index * 8; if (y < 285) pdf.text(`${row.candidate_name || row.name || ""} | ${row.category || ""} | ${statusOf(row)} | ${dateOf(row)}`, 14, y); });
    pdf.save("scot-enquiry-report.pdf");
  }
  return <><div className="report-header"><div><h2>Enquiry Reports</h2><p>Current enquiry performance and conversion</p></div><div><button className="secondary" onClick={downloadExcel}>Export Excel</button> <button className="primary" onClick={downloadPdf}>Export PDF</button></div></div><Stats items={[{label:"Total Enquiries",value:total,icon:"▣"},{label:"Positive",value:count("Positive"),icon:"✓",color:"green"},{label:"Joined",value:count("Joined"),icon:"♟",color:"purple"},{label:"Conversion",value:`${total ? ((count("Joined") / total) * 100).toFixed(2) : "0.00"}%`,icon:"%",color:"orange"}]}/><div className="dashboard-grid"><Panel title="Monthly Enquiries"><div className="monthly-chart">{months.map((month, index) => <div key={`${month.year}-${month.month}`}><span>{month.label}</span><i style={{height:`${Math.max(5, monthly[index] / maxMonthly * 100)}%`}}/><b>{monthly[index]}</b></div>)}</div></Panel><Panel title="Status Summary"><div className="report-list">{["Positive", "Pending", "Negative", "Joined", "Hold", "Low"].map(value => <div key={value}><span>{value}</span><strong>{count(value)}</strong></div>)}</div></Panel></div></>;
}
