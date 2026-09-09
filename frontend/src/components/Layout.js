import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { dashboardApi, studentApi } from "../services/api";

const menus = (user) => [
  ["dashboard","⌂","Dashboard"],
  ["add-enquiry","＋","Add Enquiry"],
  ["enquiry-list","☷","Enquiry List"],
  ["students","◫","Students"],
  ["follow-ups","◷","Follow-ups"],
  ["reports","▥","Reports"],
  ...(user?.role?.toLowerCase() === "owner" ? [["admins","♙","Admins"]] : []),
  ["categories","▦","Categories"],
  ["refer-by","↗","Refer By"],
  // ["settings","⚙","Settings"]
  ...(user?.role?.toLowerCase() === "owner" ? [["settings","⚙","Settings"]] : []),
];

export default function Layout({user}) {
  const [collapsed,setCollapsed] = useState(false);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [notifications,setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const menuList = menus(user);
  const title = menuList.find(x => location.pathname.includes(x[0]))?.[2] || "Dashboard";

  useEffect(() => {
    const toNumber = value => {
      if (value === null || value === undefined || value === "") return 0;
      const text = String(value).replace(/[₹,\s]/g, "");
      const parsed = Number(text);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const normalizeDueDate = value => {
      if (!value) return "";
      const text = String(value).trim();
      if (!text) return "";
      const iso = text.includes("T") ? text : `${text}T00:00:00`;
      return new Date(iso);
    };

    const isExpiredOverdue = (row) => {
      const balance = toNumber(
        row.balance_fee ??
        row.balanceFee ??
        row.pending_fee ??
        row.pendingFee ??
        row.pending ??
        row.amount_due ??
        row.due_amount ??
        0
      );

      const dueDate = normalizeDueDate(
        row.due_date ??
        row.dueDate ??
        row.next_followup_date ??
        row.nextFollowupDate ??
        row.date
      );

      if (!dueDate || Number.isNaN(dueDate.getTime())) return false;
      if (!(balance > 0)) return false;

      return dueDate < new Date();
    };

    Promise.allSettled([
      dashboardApi.notifications(),
      studentApi.list()
    ]).then(([notificationResult, studentResult]) => {
      const notificationRows = notificationResult.status === "fulfilled"
        ? (notificationResult.value?.data?.results || notificationResult.value?.data || [])
        : [];

      const studentRows = studentResult.status === "fulfilled"
        ? (studentResult.value?.data?.results || studentResult.value?.data || [])
        : [];

      const rows = [
        ...notificationRows,
        ...studentRows
      ].filter((row) => row && (row.name || row.candidate_name || row.student_name)).map((row) => ({
        ...row,
        name: row.name || row.candidate_name || row.student_name,
        pending_fee: row.pending_fee ?? row.pendingFee ?? row.balance_fee ?? row.balanceFee ?? row.amount_due ?? row.due_amount,
        paid_fee: row.paid_fee ?? row.paidFee ?? row.paid_fee ?? row.paidFee,
        due_date: row.due_date ?? row.dueDate ?? row.next_followup_date ?? row.nextFollowupDate ?? row.date,
        mobile: row.mobile || row.mobile_no || ""
      }));

      const uniqueRows = Array.from(
        new Map(
          rows.map((row) => {
            const key = String(
              row.id ??
              `${row.name || row.candidate_name || row.student_name || "student"}-${row.mobile || row.mobile_no || row.email || "unknown"}`
            ).toLowerCase();
            return [key, row];
          })
        ).values()
      );

      const overdue = uniqueRows
        .filter((row) => isExpiredOverdue(row))
        .map((row) => ({
          ...row,
          name: row.name || row.candidate_name || row.student_name,
          mobile: row.mobile || row.mobile_no || "",
          pending_fee: row.pending_fee ?? row.pendingFee ?? row.balance_fee ?? row.balanceFee ?? row.amount_due ?? row.due_amount ?? "Not recorded",
          paid_fee: row.paid_fee ?? row.paidFee ?? row.paid_fee ?? "Not recorded",
          due_date: row.due_date ?? row.dueDate ?? row.next_followup_date ?? row.nextFollowupDate ?? row.date ?? "today"
        }));

      setNotifications(overdue);
    }).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    // Close sidebar on route change (for mobile view)
    setCollapsed(false);
  }, [location.pathname]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("scot_it_current_user");
    navigate("/login");
  }

  return <div className={`app ${collapsed ? "collapsed" : ""}`}>
    <div className="sidebar-overlay" onClick={() => setCollapsed(false)} />
    <aside className="sidebar">
      <div className="logo"><h2>SCOT</h2><p>IT ACADEMY</p></div>
      <nav>{menuList.map(([path,icon,label]) =>
        <NavLink key={path} to={`/${path}`} className="menu-item">
          <span>{icon}</span><b>{label}</b>
        </NavLink>
      )}</nav>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="mobile-title"><button className="secondary menu-toggle" onClick={()=>setCollapsed(!collapsed)}>☰</button>
          <div><h1>{title}</h1><p>SCOT IT Academy Enquiry Follow-up System</p></div>
        </div>
        <div className="profile-wrap">
          <div className="notification-wrap">
            <button className="notification-btn" aria-label="Open overdue fee notifications" onClick={()=>setNotificationsOpen(!notificationsOpen)}>🔔{notifications.length > 0 && <span>{notifications.length}</span>}</button>
            {notificationsOpen && <div className="notification-menu"><div className="notification-header"><strong>Overdue fees</strong><div><small>{notifications.length} students</small><button className="notification-close" aria-label="Close notifications" onClick={()=>{ setNotifications([]); setNotificationsOpen(false); }}>X</button></div></div>{notifications.length === 0 ? <p className="notification-empty">No overdue fee notifications</p> : notifications.map((item,index)=><div className="notification-item" key={item.id || item.mobile || index}><strong>{item.name || item.candidate_name}</strong><small>{item.mobile} - Due {item.due_date || item.next_followup_date || "today"}</small><div><span>Pending: {item.pending_fee || item.pendingFee || "Not recorded"}</span><span>Paid: {item.paid_fee || item.paidFee || "Not recorded"}</span></div></div>)}</div>}
          </div>
          <div className="profile"><div className="avatar">B</div><div><strong>{user.name}</strong><small>{user.role}</small></div></div>
          <button className="secondary logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>
      <Outlet />
    </main>
  </div>;
}