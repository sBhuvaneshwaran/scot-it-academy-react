import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddEnquiry from "./pages/AddEnquiry";
import EnquiryList from "./pages/EnquiryList";
import Students from "./pages/Students";
import FollowUps from "./pages/FollowUps";
import Reports from "./pages/Reports";
import Admins from "./pages/Admins";
import Categories from "./pages/Categories";
import ReferBy from "./pages/ReferBy";
import Settings from "./pages/Settings";

const demoUser = { username: "bhuvanesh", name: "Bhuvanesh", role: "Administrator" };

function Protected() {
  const token = localStorage.getItem("access_token");
  return token ? <Layout user={demoUser} /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-enquiry" element={<AddEnquiry />} />
          <Route path="/enquiry-list" element={<EnquiryList />} />
          <Route path="/students" element={<Students />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/refer-by" element={<ReferBy />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}