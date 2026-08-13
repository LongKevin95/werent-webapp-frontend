import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileCheck2, LoaderCircle, ShieldCheck, UserRoundCheck } from "lucide-react";
import { getAdminKycRequest, getAdminKycRequests, reviewAdminKycRequest } from "./lib/admin-client";
import { getApiBaseUrl } from "./lib/auth-client";

const accountStatuses = { pending:"Chờ duyệt",verified:"Đã xác thực",rejected:"Từ chối",need_more_info:"Cần bổ sung" };
const listingStatuses = { pending:"Chờ duyệt",verified_owner:"Chính chủ",verified_authorized:"Được ủy quyền",rejected:"Từ chối",need_more_info:"Cần bổ sung" };
const documentTypes = { ownership_certificate:"Sổ hồng",sale_contract:"Hợp đồng mua bán",sublease_contract:"Hợp đồng thuê lại",authorization_letter:"Giấy ủy quyền" };
const fmt=(value)=>value?new Date(value).toLocaleDateString("vi-VN"):"—";

function ReviewBox({ kind, item, onReview, busy }) {
  const choices=kind==="accounts"?[["verified","Duyệt hồ sơ"],["need_more_info","Yêu cầu bổ sung"],["rejected","Từ chối"]]:[["verified_owner","Xác thực chính chủ"],["verified_authorized","Xác thực được ủy quyền"],["need_more_info","Yêu cầu bổ sung"],["rejected","Từ chối"]];
  const [status,setStatus]=useState(choices[0][0]); const [reason,setReason]=useState(""); const needsReason=["rejected","need_more_info"].includes(status);
  return <form className="mt-5 rounded-xl border bg-slate-50 p-4" onSubmit={(e)=>{e.preventDefault();onReview({status,...(reason?{reason}:{} )})}}><h4 className="font-bold">Kết quả kiểm tra</h4><select className="mt-3 h-10 w-full rounded-lg border bg-white px-3 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>{choices.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>{needsReason?<textarea className="mt-3 min-h-20 w-full rounded-lg border p-3 text-sm" placeholder="Nhập lý do cụ thể (bắt buộc)" required value={reason} onChange={(e)=>setReason(e.target.value)}/>:null}<button className="mt-3 w-full rounded-lg bg-[#159848] py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy||item.status!=="pending"}>{busy?"Đang lưu...":item.status!=="pending"?"Hồ sơ đã xử lý":"Xác nhận kết quả"}</button></form>;
}

async function openVerificationDocument(document, accessToken, onError) {
  if (!document.url.startsWith("/api/uploads/werent/kyc")) {
    window.open(document.url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const response = await fetch(`${getApiBaseUrl()}${document.url}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error("Không thể mở giấy tờ xác thực.");
    const objectUrl = URL.createObjectURL(await response.blob());
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    onError(error.message);
  }
}

function Detail({ accessToken, item, kind, onError, onReview, busy }) {
  const [basicOpen,setBasicOpen]=useState(true); if(!item)return <aside className="p-6 text-sm text-slate-500">Chọn một hồ sơ để xem chi tiết.</aside>;
  const property=item.property; const user=item.user;
  const fields=kind==="accounts"?[["Họ tên",item.fullName],["Ngày sinh",fmt(item.dateOfBirth)],["Email",item.email],["Số điện thoại",item.phone],["Địa chỉ",item.address],["Số CCCD",item.identityNumber],["Ngày cấp",fmt(item.identityIssuedAt)]]:[["Loại BĐS",property?.propertyType],["Dự án",property?.projectName||"—"],["Địa chỉ",property?.address],["Diện tích",property?.area?`${property.area} m²`:"—"],["Phòng ngủ",property?.bedrooms??"—"],["Phòng tắm",property?.bathrooms??"—"],["Trạng thái tin",property?.status]];
  return <aside className="max-h-[calc(100vh-190px)] overflow-y-auto border-l p-5"><h3 className="text-lg font-bold">Chi tiết hồ sơ</h3><p className="mt-1 text-xs text-slate-500">Gửi lúc {new Date(item.createdAt).toLocaleString("vi-VN")}</p>
  {kind==="listings"?<div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3"><p className="text-xs text-green-700">Người đã KYC</p><p className="font-semibold">{user?.fullName}</p><p className="text-xs text-slate-500">CCCD: {user?.identityNumber||"—"}</p></div>:null}
  <button className="mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold" onClick={()=>setBasicOpen(!basicOpen)}><span>Thông tin cơ bản</span>{basicOpen?<ChevronUp className="size-4"/>:<ChevronDown className="size-4"/>}</button>{basicOpen?<dl className="mt-2 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">{fields.map(([k,v])=><div className="grid grid-cols-[105px_1fr] gap-2" key={k}><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v||"—"}</dd></div>)}</dl>:null}
  {kind==="listings"?<div className="mt-4 rounded-xl border p-4 text-sm"><p className="font-semibold">Loại giấy tờ</p><p className="mt-1 text-slate-600">{documentTypes[item.documentType]??item.documentType}</p>{item.note?<p className="mt-2 text-xs">Ghi chú: {item.note}</p>:null}</div>:null}
  <div className="mt-4"><h4 className="font-semibold">Giấy tờ đã tải lên</h4><div className="mt-2 grid gap-2">{item.documents?.map((doc,index)=><button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50" key={`${doc.publicId}-${index}`} type="button" onClick={() => openVerificationDocument(doc, accessToken, onError)}><FileCheck2 className="size-4"/>{doc.originalName||doc.kind}</button>)}</div></div>
  {item.rejectionReason?<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"><b>Lý do:</b> {item.rejectionReason}</p>:null}<ReviewBox busy={busy} item={item} kind={kind} onReview={onReview}/></aside>;
}

export default function AdminKycPage({ accessToken }) {
  const [kind,setKind]=useState("accounts"); const [status,setStatus]=useState("pending"); const [items,setItems]=useState([]); const [selected,setSelected]=useState(null); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [refresh,setRefresh]=useState(0);
  useEffect(()=>{const controller=new AbortController();queueMicrotask(()=>{if(!controller.signal.aborted){setLoading(true);setError("")}});getAdminKycRequests(accessToken,kind,{status,limit:50},{signal:controller.signal}).then((r)=>{setItems(r.data.items);const first=r.data.items[0];if(first)return getAdminKycRequest(accessToken,kind,first._id).then((detail)=>setSelected(detail.data.item));setSelected(null)}).catch((e)=>{if(e.name!=="AbortError")setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[accessToken,kind,status,refresh]);
  async function open(item){try{const r=await getAdminKycRequest(accessToken,kind,item._id);setSelected(r.data.item)}catch(e){setError(e.message)}}
  async function review(payload){setBusy(true);setError("");try{await reviewAdminKycRequest(accessToken,kind,selected._id,payload);setRefresh((v)=>v+1)}catch(e){setError(e.message)}finally{setBusy(false)}}
  const statuses=kind==="accounts"?accountStatuses:listingStatuses;
  return <div><section className="grid gap-3 sm:grid-cols-2"><button className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${kind==="accounts"?"border-green-300 bg-green-50":"bg-white"}`} onClick={()=>setKind("accounts")}><UserRoundCheck className="size-6 text-green-600"/><span><b className="block">Xác thực tài khoản</b><small className="text-slate-500">Đối chiếu CCCD, selfie và thông tin cá nhân</small></span></button><button className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${kind==="listings"?"border-green-300 bg-green-50":"bg-white"}`} onClick={()=>setKind("listings")}><ShieldCheck className="size-6 text-green-600"/><span><b className="block">Xác thực tin đăng</b><small className="text-slate-500">Kiểm tra quyền sở hữu hoặc quyền cho thuê</small></span></button></section>
  <div className="mt-4 flex flex-wrap gap-2">{Object.entries(statuses).map(([key,label])=><button className={`rounded-lg px-3 py-2 text-sm ${status===key?"bg-[#159848] text-white":"border bg-white"}`} key={key} onClick={()=>setStatus(key)}>{label}</button>)}</div>{error?<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
  <section className="mt-4 grid overflow-hidden rounded-2xl border bg-white xl:grid-cols-[minmax(0,1fr)_390px]"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Mã hồ sơ</th><th>Người gửi</th><th>{kind==="accounts"?"CCCD":"Tin đăng"}</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead><tbody>{loading?<tr><td className="p-12 text-center" colSpan="5"><LoaderCircle className="mx-auto animate-spin text-green-600"/></td></tr>:items.length?items.map((item)=><tr className={`cursor-pointer border-t hover:bg-green-50/50 ${selected?._id===item._id?"bg-green-50":""}`} key={item._id} onClick={()=>open(item)}><td className="p-4 font-semibold">#{item._id.slice(-8).toUpperCase()}</td><td>{item.user?.fullName||item.fullName}<p className="text-xs text-slate-400">{item.user?.email||item.email}</p></td><td>{kind==="accounts"?item.identityNumber:item.property?.title}</td><td>{fmt(item.createdAt)}</td><td><span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">{statuses[item.status]}</span></td></tr>):<tr><td className="p-12 text-center text-slate-500" colSpan="5">Không có hồ sơ phù hợp.</td></tr>}</tbody></table></div><Detail accessToken={accessToken} busy={busy} item={selected} kind={kind} onError={setError} onReview={review}/></section></div>;
}
