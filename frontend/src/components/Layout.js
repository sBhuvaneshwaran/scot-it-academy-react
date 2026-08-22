import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { dashboardApi } from "../services/api";

const menus = [
  ["dashboard","⌂","Dashboard"],
  ["add-enquiry","＋","Add Enquiry"],
  ["enquiry-list","☷","Enquiry List"],
  ["students","◫","Students"],
  ["follow-ups","◷","Follow-ups"],
  ["reports","▥","Reports"],
  ["admins","♙","Admins"],
  ["categories","▦","Categories"],
  ["refer-by","↗","Refer By"],
  ["settings","⚙","Settings"]
];

export default function Layout({user}) {
  const [collapsed,setCollapsed] = useState(false);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [notifications,setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const title = menus.find(x => location.pathname.includes(x[0]))?.[2] || "Dashboard";

  useEffect(() => {
    dashboardApi.notifications().then(response => {
      const values = response.data.results || response.data;
      if (Array.isArray(values)) setNotifications(values);
    }).catch(() => setNotifications([
      {name:"Vignesh M",mobile:"9876543210",pending_fee:"Rs. 12,000",paid_fee:"Rs. 8,000",due_date:"20 Aug 2026"},
      {name:"Arun Kumar",mobile:"9988776655",pending_fee:"Rs. 6,500",paid_fee:"Rs. 3,500",due_date:"18 Aug 2026"}
    ]));
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  return <div className={`app ${collapsed ? "collapsed" : ""}`}>
    <aside className="sidebar">
      <div className="logo"><h2>SCOT</h2><p>IT ACADEMY</p></div>
      <nav>{menus.map(([path,icon,label]) =>
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
            {notificationsOpen && <div className="notification-menu"><div className="notification-header"><strong>Overdue fees</strong><small>{notifications.length} students</small></div>{notifications.length === 0 ? <p className="notification-empty">No overdue fee notifications</p> : notifications.map((item,index)=><div className="notification-item" key={item.id || item.mobile || index}><strong>{item.name || item.candidate_name}</strong><small>{item.mobile} - Due {item.due_date || item.next_followup_date || "today"}</small><div><span>Pending: {item.pending_fee || item.pendingFee || "Not recorded"}</span><span>Paid: {item.paid_fee || item.paidFee || "Not recorded"}</span></div></div>)}</div>}
              {notificationsOpen && <div className="notification-menu"><div className="notification-header"><strong>Overdue fees</strong><div><small>{notifications.length} students</small><button className="notification-close" aria-label="Close notifications" onClick={()=>setNotificationsOpen(false)}>X</button></div></div>{notifications.length === 0 ? <p className="notification-empty">No overdue fee notifications</p> : notifications.map((item,index)=><div className="notification-item" key={item.id || item.mobile || index}><strong>{item.name || item.candidate_name}</strong><small>{item.mobile} - Due {item.due_date || item.next_followup_date || "today"}</small><div><span>Pending: {item.pending_fee || item.pendingFee || "Not recorded"}</span><span>Paid: {item.paid_fee || item.paidFee || "Not recorded"}</span></div></div>)}</div>}
          </div>
          <div className="profile"><div className="avatar">B</div><div><strong>{user.name}</strong><small>{user.role}</small></div></div>
          <button className="secondary logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>
      <Outlet />
    </main>
  </div>;
}