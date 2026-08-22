import axios from "axios";
import dummyData from "../data/dummyData";

const useDummyData = process.env.REACT_APP_USE_BACKEND !== "true";
const clone = value => JSON.parse(JSON.stringify(value));
const nextId = rows => Math.max(...rows.map(row => Number(row.id) || 0), 0) + 1;
const dummyStorageKey = "scot_it_dummy_data";
try { Object.assign(dummyData, JSON.parse(localStorage.getItem(dummyStorageKey) || "{}")); } catch {}
const persistDummyData = () => localStorage.setItem(dummyStorageKey, JSON.stringify(dummyData));

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: data => useDummyData ? Promise.resolve({data: {access: "dummy-token"}}) : api.post("/auth/login/", data),
  me: () => api.get("/auth/me/")
};

export const dashboardApi = {
  summary: () => useDummyData ? Promise.resolve({data: {recent: dummyData.enquiries.map(row => [row.admin, row.candidate_name, row.mobile, row.city, row.category, row.course, row.next_followup_date, row.status]), follow: dummyData.enquiries.map(row => ({...row, name: row.candidate_name})), categories: dummyData.categories.map(category => [category, dummyData.enquiries.filter(row => row.category === category && row.status === "Joined").length, 0])}}) : api.get("/dashboard/"),
  notifications: () => useDummyData ? Promise.resolve({data: clone(dummyData.notifications).map(row => ({...row, name: row.student_name}))}) : api.get("/notifications/")
};
export const enquiryApi = {
  list: params => useDummyData ? Promise.resolve({data: clone(dummyData.enquiries)}) : api.get("/enquiries/", { params }),
  create: data => { if (!useDummyData) return api.post("/enquiries/", data); const row = {...data, id: nextId(dummyData.enquiries)}; dummyData.enquiries.push(row); persistDummyData(); return Promise.resolve({data: clone(row)}); },
  detail: id => useDummyData ? Promise.resolve({data: clone(dummyData.enquiries.find(row => String(row.id) === String(id)) || {})}) : api.get(`/enquiries/${id}/`),
  update: (id, data) => { if (!useDummyData) return api.patch(`/enquiries/${id}/`, data); const row = dummyData.enquiries.find(item => String(item.id) === String(id)); if (row) Object.assign(row, data); persistDummyData(); return Promise.resolve({data: clone(row || data)}); },
  remove: id => { if (!useDummyData) return api.delete(`/enquiries/${id}/`); dummyData.enquiries = dummyData.enquiries.filter(row => String(row.id) !== String(id)); persistDummyData(); return Promise.resolve({data: {deleted: true}}); }
};
export const studentApi = {
  list: params => useDummyData ? Promise.resolve({data: clone(dummyData.students)}) : api.get("/students/", { params }),
  detail: id => useDummyData ? Promise.resolve({data: clone(dummyData.students.find(row => String(row.id) === String(id)) || {})}) : api.get(`/students/${id}/`),
  create: data => { if (!useDummyData) return api.post("/students/", data); const student = {...data, id: nextId(dummyData.students), status: "Joined"}; dummyData.students.push(student); dummyData.enquiries.push({id: nextId(dummyData.enquiries), candidate_name: student.name, mobile: student.mobile, city: student.city, category: student.category, course: student.course, status: "Joined", next_followup_date: student.dueDate, comments: "Added from Students page."}); persistDummyData(); return Promise.resolve({data: clone(student)}); }
};

const localEnquiryKey = "scot_it_enquiries";
export function getLocalEnquiries() {
  try {
    const rows = JSON.parse(localStorage.getItem(localEnquiryKey) || "[]");
    return rows.map((row, index) => row.id?.toString().startsWith("local-") ? {...row, record_id: row.id, id: `ST-${String(index + 1).padStart(3, "0")}`} : row);
  } catch { return []; }
}
export function saveLocalEnquiry(enquiry) {
  const rows = getLocalEnquiries();
  const next = {...enquiry, id: enquiry.id || `ST-${String(rows.length + 1).padStart(3, "0")}`};
  localStorage.setItem(localEnquiryKey, JSON.stringify([...rows.filter(row => row.id !== next.id), next]));
  return next;
}
export function removeLocalEnquiry(id) {
  const rows = getLocalEnquiries().filter(row => row.id !== id && row.record_id !== id);
  localStorage.setItem(localEnquiryKey, JSON.stringify(rows));
}
export function getLocalCategories() {
  try { return JSON.parse(localStorage.getItem("scot_it_categories") || "[]"); } catch { return []; }
}
export function saveLocalCategory(name) {
  const categories = getLocalCategories();
  if (!categories.includes(name)) localStorage.setItem("scot_it_categories", JSON.stringify([...categories, name]));
}
export function renameLocalCategory(previous, next) {
  const categories = getLocalCategories().map(name => name === previous ? next : name);
  localStorage.setItem("scot_it_categories", JSON.stringify([...new Set(categories)]));
}
export function removeLocalCategory(name) {
  localStorage.setItem("scot_it_categories", JSON.stringify(getLocalCategories().filter(item => item !== name)));
}
export const followUpApi = { list: params => useDummyData ? Promise.resolve({data: clone(dummyData.enquiries)}) : api.get("/follow-ups/", { params }) };
export const reportApi = { summary: params => api.get("/reports/", { params }) };
export const adminApi = {
  list: () => useDummyData ? Promise.resolve({data: clone(dummyData.admins).map(name => ({id: name, name, role: "Administrator", status: "Active"}))}) : api.get("/admins/"),
  create: data => { if (!useDummyData) return api.post("/admins/", data); if (!dummyData.admins.includes(data.name)) dummyData.admins.push(data.name); persistDummyData(); return Promise.resolve({data: {id: data.name, ...data, role: "Administrator", status: "Active"}}); },
  update: (id, data) => { if (!useDummyData) return api.patch(`/admins/${id}/`, data); const index = dummyData.admins.findIndex(name => name === id); if (index >= 0) dummyData.admins[index] = data.name; persistDummyData(); return Promise.resolve({data: {id: data.name, ...data}}); },
  remove: id => { if (!useDummyData) return api.delete(`/admins/${id}/`); dummyData.admins = dummyData.admins.filter(name => name !== id); persistDummyData(); return Promise.resolve({data: {deleted: true}}); }
};
export const categoryApi = {
  list: () => useDummyData ? Promise.resolve({data: clone(dummyData.categories).map(name => ({id: name, name}))}) : api.get("/categories/"),
  create: data => { if (!useDummyData) return api.post("/categories/", data); if (!dummyData.categories.includes(data.name)) dummyData.categories.push(data.name); persistDummyData(); return Promise.resolve({data: {id: data.name, ...data}}); },
  update: (id, data) => { if (!useDummyData) return api.patch(`/categories/${id}/`, data); const index = dummyData.categories.findIndex(name => name === id); if (index >= 0) dummyData.categories[index] = data.name; persistDummyData(); return Promise.resolve({data: {id: data.name, ...data}}); },
  remove: id => { if (!useDummyData) return api.delete(`/categories/${id}/`); dummyData.categories = dummyData.categories.filter(name => name !== id); persistDummyData(); return Promise.resolve({data: {deleted: true}}); }
};
export const referralApi = { list: () => api.get("/referrals/"), create: data => api.post("/referrals/", data) };
export const settingsApi = { get: () => api.get("/settings/"), update: data => api.patch("/settings/", data) };

export default api;