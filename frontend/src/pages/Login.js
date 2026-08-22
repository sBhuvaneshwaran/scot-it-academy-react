import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {authApi} from "../services/api";

export default function Login(){
  const [username,setUsername]=useState("bhuvanesh");
  const [password,setPassword]=useState("scotitacademy@123");
  const [error,setError]=useState("");
  const navigate=useNavigate();

  async function submit(e){
    e.preventDefault(); setError("");
    try {
      const res=await authApi.login({username,password});
      localStorage.setItem("access_token", res.data.access || "demo-token");
      navigate("/dashboard");
    } catch {
      if(username==="bhuvanesh" && password==="scotitacademy@123"){
        localStorage.setItem("access_token","demo-token");
        navigate("/dashboard");
      } else setError("Invalid username or password. Please try again.");
    }
  }
  return <div className="login-screen"><div className="login-card">
    <div className="login-logo"><h2>SCOT</h2><p>IT ACADEMY</p></div>
    <h3>Admin Login</h3>
    <form onSubmit={submit}>
      <div className="login-field"><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" required/></div>
      <div className="login-field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" required/></div>
      <div className="login-error">{error}</div><button className="primary login-btn">Login</button>
    </form>
  </div></div>;
}