import React,{useEffect,useState} from "react";
import {enquiryApi,categoryApi,adminApi,getLocalCategories,saveLocalEnquiry} from "../services/api";
import {Panel} from "../components/Ui";

const initial={branch:"",admin:"",enquiry_date:"2026-08-20",candidate_name:"",mobile:"",city:"Chennai",degree:"",passed_year:"",category:"",course:"Python Full Stack",comments:"",next_followup_date:"",status:"Pending",referred_by:"",referral_contact:""};
export default function AddEnquiry(){
 const [form,setForm]=useState(initial); const [msg,setMsg]=useState(""); const [categories,setCategories]=useState(["Testing","Cloud","Development","Oracle SQL","UI/UX Design","Data Analytics / Data Science","Fresher Placement","Experienced Placement","Documents / Test Only",...getLocalCategories()]); const [admins,setAdmins]=useState([]);
 useEffect(()=>{categoryApi.list().then(response=>{const values=response.data.results||response.data||[];setCategories([...new Set([...categories,...values.map(item=>typeof item==="string"?item:item.name).filter(Boolean)])]);}).catch(()=>{})},[]);
 useEffect(()=>{adminApi.list().then(response=>{const values=response.data.results||response.data||[];setAdmins(values.map(item=>typeof item==="string"?item:item.name).filter(Boolean));}).catch(()=>{})},[]);
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){e.preventDefault();try{await enquiryApi.create(form);setMsg("Enquiry saved successfully!");setForm(initial)}catch{saveLocalEnquiry(form);setMsg("Enquiry saved locally. Connect Django API to save it to the database.");setForm(initial)}}
 return <Panel title="New Candidate Enquiry" subtitle="Enter candidate information and follow-up details"><form onSubmit={submit}>
  <h4>Candidate Information</h4><div className="form-grid">
   <Select name="branch" label="Branch *" value={form.branch} onChange={change} options={["Keelkattalai","Velachery"]}/>
  <Select name="admin" label="Admin *" value={form.admin} onChange={change} options={admins}/>
   <Input name="enquiry_date" label="Enquiry Date *" type="date" value={form.enquiry_date} onChange={change}/>
   <Input name="candidate_name" label="Candidate Name *" value={form.candidate_name} onChange={change} placeholder="Enter candidate name"/>
   <Input name="mobile" label="Mobile Number *" value={form.mobile} onChange={change} maxLength="10" placeholder="10 digit mobile number"/>
   <Input name="city" label="City / Place" value={form.city} onChange={change}/>
   <Input name="degree" label="Degree *" value={form.degree} onChange={change} placeholder="B.E / B.Tech / BCA"/>
   <Select name="passed_year" label="Passed Out Year *" value={form.passed_year} onChange={change} options={["2026","2025","2024","2023","2022","2021"]}/>
  </div>
  <h4>Enquiry Information</h4><div className="form-grid">
    <Select name="category" label="Category *" value={form.category} onChange={change} options={categories}/>
   <Input name="course" label="Type / Course" value={form.course} onChange={change}/>
   <div className="form-group full"><label>Comments / Last Discussion</label><textarea name="comments" value={form.comments} onChange={change} placeholder="Enter last discussion details..."/></div>
  </div>
  <h4>Follow-up Information</h4><div className="form-grid">
   <Input name="next_followup_date" label="Next Follow-up Date *" type="date" value={form.next_followup_date} onChange={change}/>
   <Select name="status" label="Final Status *" value={form.status} onChange={change} options={["Positive","Pending","Low","Hold","Negative","Joined"]}/>
   <Select name="referred_by" label="Referred By" value={form.referred_by} onChange={change} options={["John Doe","Rajesh","SCOT Students","Online","Others"]}/>
   <Input name="referral_contact" label="Referral Contact" value={form.referral_contact} onChange={change} maxLength="10"/>
  </div>
  {msg&&<div className="success-message">{msg}</div>}<div className="form-actions"><button type="reset" className="secondary" onClick={()=>setForm(initial)}>Clear</button><button className="primary">Save Enquiry</button></div>
 </form></Panel>
}
function Input({name,label,...p}){return <div className="form-group"><label>{label}</label><input name={name} required={label.includes("*")} {...p}/></div>}
function Select({name,label,value,onChange,options}){return <div className="form-group"><label>{label}</label><select name={name} required={label.includes("*")} value={value} onChange={onChange}><option value="">Select {label.replace(" *","")}</option>{options.map(x=><option key={x}>{x}</option>)}</select></div>}