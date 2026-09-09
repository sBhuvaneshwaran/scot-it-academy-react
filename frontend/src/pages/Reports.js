import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { enquiryApi, studentApi, getLocalEnquiries } from "../services/api";
import { Panel, Stats } from "../components/Ui";

function statusOf(row) { return String(row.status || row.final_status || row.finalStatus || "Pending").trim(); }
function dateOf(row) { return row.enquiry_date || row.created_at || row.date || ""; }

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Reports() {
  const [rows, setRows] = useState([]);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (Jan=0, Aug=7)
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    Promise.all([
      enquiryApi.list(),
      studentApi.list()
    ]).then(([enqRes, studRes]) => {
      const enqs = enqRes.data.results || enqRes.data || [];
      const studs = studRes.data.results || studRes.data || [];

      // Normalize student records to match enquiry format with "Joined" status
      const normalizedStuds = studs.map(s => ({
        candidate_name: s.name || s.candidate_name || "",
        mobile: s.mobile || "",
        city: s.city || "",
        category: s.category || "",
        course: s.course || "",
        status: "Joined",
        enquiry_date: s.joinDate || s.join_date || s.dueDate || s.due_date || ""
      }));

      setRows([...enqs, ...normalizedStuds]);
    }).catch(() => setRows([]));
  }, []);

  const unique = [...new Map(rows.map(row => [row.mobile || row.id || row.candidate_name, row])).values()];

  // ── Year-filtered rows: used for Stats cards (yearly totals) ──────────────
  const yearRows = selectedYear > currentYear
    ? [] // future year — no data
    : unique.filter(row => {
        const d = dateOf(row);
        return d && new Date(d).getFullYear() === selectedYear;
      });
  const total = yearRows.length;
  const count = value => yearRows.filter(row => statusOf(row).toLowerCase() === value.toLowerCase()).length;

  // ── Month-filtered rows: used for Status Summary (monthly totals) ─────────
  //   Current year → current month only (resets to 0 when a new month starts)
  //   Past year    → entire year
  //   Future year  → empty (nothing started)
  const monthRows =
    selectedYear > currentYear ? [] :
    selectedYear === currentYear
      ? unique.filter(row => {
          const d = dateOf(row);
          if (!d) return false;
          const date = new Date(d);
          return date.getFullYear() === selectedYear && date.getMonth() === currentMonth;
        })
      : yearRows; // past year → show full year in status summary
  const monthCount2 = monthRows.length;
  const countMonth = value => monthRows.filter(row => statusOf(row).toLowerCase() === value.toLowerCase()).length;

  // Build year list: historical years from data + current year, newest first (no hardcoded upcoming years)
  const dataYears = unique
    .map(row => { const d = dateOf(row); return d ? new Date(d).getFullYear() : null; })
    .filter(Boolean);
  const availableYears = [...new Set([...dataYears, currentYear])]
    .filter(y => !isNaN(y))
    .sort((a, b) => b - a);

  // Month visibility rules (based on real calendar):
  //   Past year   → all 12 months shown
  //   Current year → Jan through current month only (auto-grows each new month)
  //   Future year  → 0 months shown (none have started yet; bars appear when the month begins)
  const monthCount =
    selectedYear < currentYear ? 12 :
    selectedYear === currentYear ? currentMonth + 1 :
    0; // future year — no months have started yet

  const visibleMonths = MONTH_LABELS.slice(0, monthCount).map((label, index) => ({
    label, month: index, year: selectedYear
  }));

  const monthly = visibleMonths.map(m => yearRows.filter(row => {
    const d = dateOf(row);
    if (!d) return false;
    const date = new Date(d);
    return date.getMonth() === m.month && date.getFullYear() === m.year;
  }).length);

  const maxMonthly = Math.max(1, ...monthly);
  const yearTotal = monthly.reduce((sum, n) => sum + n, 0);

  function downloadExcel() {
    const headers = ["Candidate", "Mobile", "City", "Category", "Course", "Status", "Enquiry Date"];
    const values = unique.map(row => [
      row.candidate_name || row.name || "", row.mobile || "", row.city || "",
      row.category || "", row.course || "", statusOf(row), dateOf(row)
    ]);
    const csv = [headers, ...values]
      .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], {type: "text/csv;charset=utf-8"}));
    link.download = "scot-enquiry-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function downloadPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text("SCOT IT Academy - Enquiry Report", 14, 18);
    pdf.setFontSize(11);
    pdf.text(`Total Enquiries: ${total}`, 14, 32);
    pdf.text(`Positive: ${count("Positive")}`, 14, 40);
    pdf.text(`Joined: ${count("Joined")}`, 14, 48);
    pdf.text(`Conversion: ${total ? ((count("Joined") / total) * 100).toFixed(2) : "0.00"}%`, 14, 56);
    pdf.setFontSize(14); pdf.text("Status Summary", 14, 72);
    ["Positive","Pending","Negative","Joined","Hold","Low"].forEach((value, index) =>
      pdf.text(`${value}: ${count(value)}`, 20, 82 + index * 8)
    );
    pdf.setFontSize(14); pdf.text("Enquiries", 14, 140); pdf.setFontSize(9);
    unique.forEach((row, index) => {
      const y = 150 + index * 8;
      if (y < 285) pdf.text(
        `${row.candidate_name || row.name || ""} | ${row.category || ""} | ${statusOf(row)} | ${dateOf(row)}`,
        14, y
      );
    });
    pdf.save("scot-enquiry-report.pdf");
  }

  // Year dropdown — top-right corner of the panel via the "action" prop
  const yearSelect = (
    <select
      value={selectedYear}
      onChange={e => setSelectedYear(Number(e.target.value))}
      style={{
        padding: "6px 12px",
        border: "1px solid #d9e2ec",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        background: "#fff",
        color: "#172033",
        cursor: "pointer",
        outline: "none",
        minWidth: "90px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}
    >
      {availableYears.map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  );

  return (
    <>
      <div className="report-header">
        <div>
          <h2>Enquiry Reports</h2>
          <p>Current enquiry performance and conversion</p>
        </div>
        <div>
          <button className="secondary" onClick={downloadExcel}>Export Excel</button>{" "}
          <button className="primary" onClick={downloadPdf}>Export PDF</button>
        </div>
      </div>

      <Stats items={[
        {label: "Total Enquiries", value: total, icon: "▣", sub: `Year ${selectedYear}`},
        {label: "Positive", value: count("Positive"), icon: "✓", color: "green", sub: `Year ${selectedYear}`},
        {label: "Joined", value: count("Joined"), icon: "♟", color: "purple", sub: `Year ${selectedYear}`},
        {label: "Conversion", value: `${total ? ((count("Joined")/total)*100).toFixed(2) : "0.00"}%`, icon: "%", color: "orange", sub: `Year ${selectedYear}`}
      ]}/>

      <div className="dashboard-grid">
        <Panel
          title="Monthly Enquiries"
          subtitle={selectedYear > currentYear
            ? `No data yet — ${selectedYear} hasn't started`
            : `${yearTotal} enquir${yearTotal === 1 ? "y" : "ies"} in ${selectedYear}`}
          action={yearSelect}
        >
          {visibleMonths.length > 0 ? (
            <div className="monthly-chart">
              {visibleMonths.map((month, index) => (
                <div key={`${month.year}-${month.month}`}>
                  <span>{month.label}</span>
                  <i style={{height: `${Math.max(5, monthly[index] / maxMonthly * 100)}%`}}/>
                  <b>{monthly[index]}</b>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              height: "200px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "#a0aec0", gap: "8px"
            }}>
              <span style={{fontSize: "36px"}}>📅</span>
              <strong style={{fontSize: "15px", color: "#718096"}}>{selectedYear} hasn't started yet</strong>
              <p style={{fontSize: "13px", color: "#a0aec0"}}>Monthly bars will appear automatically when {selectedYear} begins.</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Status Summary"
          subtitle={
            selectedYear > currentYear
              ? `No data — ${selectedYear} hasn't started`
              : selectedYear === currentYear
                ? `${MONTH_LABELS[currentMonth]} ${currentYear} · resets each month`
                : `Full year ${selectedYear}`
          }
        >
          <div className="report-list">
            {["Positive","Pending","Negative","Joined","Hold","Low"].map(value => (
              <div key={value}>
                <span>{value}</span>
                <strong>{countMonth(value)}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
