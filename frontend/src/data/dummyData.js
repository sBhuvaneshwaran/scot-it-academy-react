export const dummyData = {
  admins: ["John", "Priya", "Prakesh", "Rajesh", "Vadivel", "Raju", "Aravind", "Archana"],
  categories: ["Development", "Cloud", "Testing", "Data Analytics / Data Science", "Fresher Placement", "Experienced Placement", "Oracle SQL", "UI/UX Design", "Documents / Test Only"],
  enquiries: [
    {id: 1, branch: "Keelkattalai", admin: "Praveen", enquiry_date: "2026-08-18", candidate_name: "Vignesh M", mobile: "9876543210", city: "Chennai", degree: "B.E 2024", category: "Development", course: "Python Full Stack", comments: "Joined the weekday batch.", next_followup_date: "2026-08-18", status: "Joined", paid_fee: 22000, balance_fee: 8000},
    {id: 2, branch: "Velachery", admin: "Dhana", enquiry_date: "2026-08-19", candidate_name: "Anitha R", mobile: "9123456780", city: "Chrompet", degree: "BCA 2025", category: "Data Analytics / Data Science", course: "Data Analyst", comments: "Requested course fee details.", next_followup_date: "2026-08-19", status: "Positive"},
    {id: 3, branch: "Velachery", admin: "Bhuvaneshwari", enquiry_date: "2026-08-20", candidate_name: "Karthik S", mobile: "9345678901", city: "Velachery", degree: "B.Tech 2023", category: "Cloud", course: "AWS Cloud", comments: "Will discuss with family.", next_followup_date: "2026-08-20", status: "Hold"},
    {id: 4, branch: "Keelkattalai", admin: "Kokila", enquiry_date: "2026-08-21", candidate_name: "Monisha P", mobile: "9098765432", city: "Tambaram", degree: "MBA 2024", category: "Fresher Placement", course: "Placement", comments: "Positive response on the follow-up call.", next_followup_date: "2026-08-21", status: "Positive"},
    {id: 5, branch: "Velachery", admin: "Swathy", enquiry_date: "2026-08-22", candidate_name: "Arun Kumar", mobile: "9988776655", city: "Chennai", degree: "B.E 2025", category: "Testing", course: "Software Testing", comments: "Asked to call next week.", next_followup_date: "2026-08-25", status: "Low"}
  ],
  students: [
    {id: 1, candidate_name: "Vignesh M", mobile: "9876543210", email: "vignesh@gmail.com", city: "Chennai", category: "Development", course: "Python Full Stack", paid_fee: 22000, balance_fee: 8000, due_date: "2026-08-10", join_date: "2026-08-18", status: "Joined"}
  ],
  notifications: [{student_name: "Vignesh M", mobile: "9876543210", pending_fee: 8000, paid_fee: 22000, due_date: "2026-08-10"}]
};

export default dummyData;
