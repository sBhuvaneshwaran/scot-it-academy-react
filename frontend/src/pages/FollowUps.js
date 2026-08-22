import React, { useEffect, useState } from "react";
import { enquiryApi, getLocalEnquiries } from "../services/api";
import { Panel, Stats, Badge, Pagination } from "../components/Ui";

const fallbackEnquiries = [
  { candidate: "Vignesh M", course: "Python Full Stack", discussion: "Joined student", date: "18 Aug", status: "Joined" },
  { candidate: "Anitha R", course: "Data Analyst", discussion: "Requested course fee details", date: "19 Aug", status: "Positive" },
  { candidate: "Karthik S", course: "AWS Cloud", discussion: "Will discuss with family", date: "20 Aug", status: "Hold" },
  { candidate: "Monisha P", course: "Placement", discussion: "Positive response", date: "21 Aug", status: "Positive" },
  { candidate: "Arun Kumar", course: "Software Testing", discussion: "Asked to call next week", date: "22 Aug", status: "Low" }
];

function normalize(item) {
  return {
    ...item,
    candidate: item.candidate || item.name || item.candidate_name,
    course: item.course || item.type || "",
    discussion: item.discussion || item.comments || item.last_discussion || "No discussion recorded",
    date: item.date || item.followup_date || item.next_followup_date || "",
    status: String(item.status || item.final_status || item.finalStatus || item.student_status || "Pending").trim()
  };
}

export default function FollowUps() {
  const [rows, setRows] = useState(fallbackEnquiries);
  const [page, setPage] = useState(1);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const localRows = getLocalEnquiries().map(normalize);
    enquiryApi.list()
      .then(response => setRows([...(response.data.results || response.data || []).map(normalize), ...localRows]))
      .catch(() => setRows(localRows.length ? localRows : fallbackEnquiries));
  }, []);

  const activeRows = rows.filter(row => {
    const status = String(row.status).trim().toLowerCase();
    return !["joined", "negative"].includes(status) && row.date;
  });
  const todayRows = activeRows.filter(row => row.date.slice(0, 10) === today);
  const overdueRows = activeRows.filter(row => row.date.slice(0, 10) < today);
  const upcomingRows = activeRows.filter(row => row.date.slice(0, 10) > today);
  const visibleRows = activeRows.slice((page - 1) * 5, page * 5);

  return <>
    <Stats items={[
      { icon: "◷", color: "orange", label: "Today's Follow-ups", value: todayRows.length },
      { icon: "!", color: "red", label: "Overdue", value: overdueRows.length },
      { icon: "→", color: "blue", label: "Upcoming", value: upcomingRows.length }
    ]} />
    <Panel title="Follow-up Schedule" subtitle="Current follow-up data">
      <div className="table-scroll"><table><thead><tr>{["Candidate", "Course", "Last Discussion", "Date", "Status", "Action"].map(header => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{visibleRows.map((row, index) => <tr key={`${row.candidate}-${row.date}-${index}`}><td>{row.candidate}</td><td>{row.course}</td><td>{row.discussion}</td><td>{row.date}</td><td><Badge status={row.status} /></td><td><button className="primary small">Follow-up</button></td></tr>)}</tbody>
      </table></div>
      {activeRows.length === 0 && <div className="empty">No current follow-ups.</div>}
      <Pagination page={page} setPage={setPage} total={activeRows.length} />
    </Panel>
  </>;
}
