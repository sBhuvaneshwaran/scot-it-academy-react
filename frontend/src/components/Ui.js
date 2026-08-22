import React from "react";

export function Panel({title,subtitle,action,children,className=""}){
 return <section className={`panel ${className}`}><div className="panel-header"><div><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>
}
export function Badge({status}){return <span className={`badge ${String(status).toLowerCase().replace(" ","-")}`}>{status}</span>}
export function Stats({items}){return <div className="stats">{items.map((x,i)=><div className="stat-card" key={i}><div className={`stat-icon ${x.color||"blue"}`}>{x.icon}</div><div><span>{x.label}</span><h2>{x.value}</h2>{x.sub&&<small>{x.sub}</small>}</div></div>)}</div>}
export function Empty({text="No data available"}){return <div className="empty">{text}</div>}
export function Pagination({page,setPage,total,perPage=5}){const pages=Math.max(1,Math.ceil(total/perPage));if(total<=perPage)return null;return <div className="pagination"><button className="secondary small" disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page} of {pages}</span><button className="secondary small" disabled={page===pages} onClick={()=>setPage(page+1)}>Next</button></div>}