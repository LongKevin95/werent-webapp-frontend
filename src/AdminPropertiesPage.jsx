import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Ruler,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { getApiBaseUrl } from "./lib/auth-client";
import { getAdminProperties, reviewAdminProperty } from "./lib/admin-client";

const statusMeta = {
  active: { label: "Đã đăng", className: "border-[#BFE4C8] bg-[#ECF8EF] text-[#218B40]" },
  draft: { label: "Nháp", className: "border-[#D9DEE5] bg-[#F3F5F7] text-[#667085]" },
  hidden: { label: "Đã ẩn", className: "border-[#D8DEE7] bg-[#F1F4F7] text-[#526070]" },
  pending: { label: "Chờ duyệt", className: "border-[#FFD596] bg-[#FFF7E8] text-[#C87500]" },
  rejected: { label: "Bị từ chối", className: "border-[#FFC7CC] bg-[#FFF1F2] text-[#D83745]" },
};

function formatCurrency(value) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
}

function formatDateTime(value) {
  if (!value) return { date: "—", time: "" };
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("vi-VN").format(date),
    time: new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function resolveImageUrl(value) {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value;
  return `${getApiBaseUrl()}${value.startsWith("/") ? "" : "/"}${value}`;
}

function getInitials(value = "") {
  return value
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] ?? statusMeta.draft;
  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function ReviewReasonModal({ action, isSubmitting, onClose, onSubmit, property }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const isReject = action === "rejected";

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!reason.trim()) {
      setError(`Vui lòng nhập lý do ${isReject ? "từ chối" : "ẩn"} tin.`);
      return;
    }
    onSubmit(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17211B]/55 p-4" onMouseDown={onClose}>
      <form
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(18,32,23,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <span className={`flex size-11 items-center justify-center rounded-full ${isReject ? "bg-[#FFF0F1] text-[#E23C49]" : "bg-[#EFF2F6] text-[#526070]"}`}>
            {isReject ? <XCircle className="size-5" /> : <EyeOff className="size-5" />}
          </span>
          <button aria-label="Đóng" className="flex size-9 items-center justify-center rounded-lg text-[#7A848E] hover:bg-[#F3F5F3]" disabled={isSubmitting} type="button" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#20262E]">{isReject ? "Từ chối tin đăng" : "Ẩn tin đăng"}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6B7580]">
          “{property.title}”. Lý do sẽ được lưu cùng lịch sử kiểm duyệt và hiển thị cho người đăng.
        </p>
        <label className="mt-5 block text-sm font-semibold text-[#37404A]" htmlFor="moderation-reason">
          Lý do <span className="text-[#D83D48]">*</span>
        </label>
        <textarea
          autoFocus
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[#DDE3DE] px-4 py-3 text-sm outline-none focus:border-[#31A451] focus:ring-2 focus:ring-[#31A451]/15"
          id="moderation-reason"
          maxLength={1000}
          placeholder={isReject ? "Ví dụ: Hình ảnh không đúng với nội dung mô tả..." : "Ví dụ: Tin có dấu hiệu trùng lặp, cần xác minh..."}
          value={reason}
          onChange={(event) => { setReason(event.target.value); setError(""); }}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-[#D33C48]">{error}</span>
          <span className="text-[#929AA3]">{reason.length}/1000</span>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button className="h-10 rounded-xl border border-[#DCE2DD] px-4 text-sm font-semibold text-[#5E6872]" disabled={isSubmitting} type="button" onClick={onClose}>Hủy</button>
          <button className={`flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white ${isReject ? "bg-[#E23C49]" : "bg-[#526070]"}`} disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isReject ? "Xác nhận từ chối" : "Xác nhận ẩn"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PropertyDetailModal({ onAction, onClose, property }) {
  const image = resolveImageUrl(property.images?.[0]?.url);
  const owner = property.owner ?? {};
  const details = [
    [Ruler, property.area ? `${property.area} m²` : "Chưa cập nhật"],
    [BedDouble, property.bedrooms ? `${property.bedrooms} phòng ngủ` : "Chưa cập nhật"],
    [Bath, property.bathrooms ? `${property.bathrooms} phòng tắm` : "Chưa cập nhật"],
    [Building2, property.propertyType || "Chưa cập nhật"],
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#17211B]/55 p-4" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-[0_30px_80px_rgba(18,32,23,0.28)]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8ECE9] bg-white px-5 py-4">
          <div><h2 className="text-lg font-bold text-[#20262E]">Chi tiết tin đăng</h2><p className="text-xs text-[#818A94]">ID: {(property.id ?? property._id)?.slice(-10)}</p></div>
          <button aria-label="Đóng" className="flex size-9 items-center justify-center rounded-lg text-[#75808A] hover:bg-[#F2F5F2]" type="button" onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="p-5 sm:p-6">
          {image ? <img alt={property.title} className="h-64 w-full rounded-2xl object-cover" src={image} /> : <div className="flex h-52 items-center justify-center rounded-2xl bg-[#EEF4EF] text-[#85A18B]"><Building2 className="size-12" /></div>}
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="text-xl font-bold text-[#20262E]">{property.title}</h3><p className="mt-2 flex items-center gap-1.5 text-sm text-[#66717C]"><MapPin className="size-4 text-[#31A451]" />{[property.district, property.city].filter(Boolean).join(", ") || property.address}</p></div>
            <StatusBadge status={property.status} />
          </div>
          <p className="mt-4 text-xl font-bold text-[#239542]">{formatCurrency(property.price)} <span className="text-sm font-normal text-[#69737E]">/tháng</span></p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {details.map(([Icon, value]) => <div key={value} className="rounded-xl border border-[#E7ECE8] bg-[#FAFCFA] p-3 text-xs text-[#59646E]"><Icon className="mb-2 size-4 text-[#2F9D4C]" />{value}</div>)}
          </div>
          <div className="mt-5 rounded-xl border border-[#E6EBE7] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#8A929B]">Người đăng</p><div className="mt-3 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-[#E5F3E8] text-xs font-bold text-[#2D9348]">{getInitials(owner.fullName)}</span><div><p className="text-sm font-semibold text-[#323A43]">{owner.fullName || "Chưa cập nhật"}</p><p className="mt-0.5 text-xs text-[#7C858F]">{owner.email || owner.phone || "Không có thông tin liên hệ"}</p></div></div></div>
          {property.description ? <div className="mt-5"><p className="text-sm font-bold text-[#323A43]">Mô tả</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#65707A]">{property.description}</p></div> : null}
          {property.moderationReason || property.rejectionReason ? <div className="mt-5 rounded-xl border border-[#F1D0D3] bg-[#FFF7F7] p-4 text-sm text-[#AD3D46]"><p className="font-bold">Lý do kiểm duyệt gần nhất</p><p className="mt-1 leading-6">{property.moderationReason || property.rejectionReason}</p></div> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#E8ECE9] pt-5">
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#C9E4D0] px-4 text-sm font-semibold text-[#249144] disabled:opacity-40" disabled={property.status === "active"} type="button" onClick={() => onAction(property, "active")}><CheckCircle2 className="size-4" />Duyệt</button>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#F0C9CD] px-4 text-sm font-semibold text-[#D43B47] disabled:opacity-40" disabled={property.status === "rejected"} type="button" onClick={() => onAction(property, "rejected")}><XCircle className="size-4" />Từ chối</button>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#D9DFE6] px-4 text-sm font-semibold text-[#586574] disabled:opacity-40" disabled={property.status === "hidden"} type="button" onClick={() => onAction(property, "hidden")}><EyeOff className="size-4" />Ẩn tin</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPropertiesPage({ accessToken, onCountsChange, onStatusChange, status = "" }) {
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filterOptions, setFilterOptions] = useState({ cities: [], propertyTypes: [] });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    window.queueMicrotask(() => { setIsLoading(true); setError(""); });
    getAdminProperties(accessToken, { city, dateFrom, dateTo, limit: 10, page, propertyType, search: debouncedSearch, status }, { signal: controller.signal })
      .then((response) => {
        setProperties(response.data.items);
        setPagination(response.data.pagination);
        setFilterOptions(response.data.filters ?? { cities: [], propertyTypes: [] });
        onCountsChange(response.data.statusCounts ?? {});
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "Không thể tải danh sách tin đăng.");
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [accessToken, city, dateFrom, dateTo, debouncedSearch, onCountsChange, page, propertyType, refreshVersion, status]);

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages ?? 1;
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [page, pagination.totalPages]);

  function resetFilters() {
    setSearch(""); setPropertyType(""); setCity(""); setDateFrom(""); setDateTo(""); setPage(1); onStatusChange(""); setRefreshVersion((value) => value + 1);
  }

  function beginAction(property, action) {
    if (action === "active") { void submitReview(property, action); return; }
    setReviewTarget(property); setReviewAction(action);
  }

  async function submitReview(property, action, reason) {
    setIsReviewing(true); setError("");
    try {
      const response = await reviewAdminProperty(accessToken, property.id ?? property._id, { status: action, ...(reason ? { reason } : {}) });
      setNotice(response.message); setReviewTarget(null); setReviewAction(""); setSelectedProperty(null); setRefreshVersion((value) => value + 1);
      window.setTimeout(() => setNotice(""), 3500);
    } catch (requestError) {
      setError(requestError.message || "Không thể cập nhật trạng thái tin đăng.");
    } finally { setIsReviewing(false); }
  }

  return (
    <div className="space-y-4">
      {notice ? <div className="rounded-xl border border-[#CBE7D1] bg-[#EFF9F1] px-4 py-3 text-sm text-[#247D3E]">{notice}</div> : null}
      {error ? <div className="rounded-xl border border-[#F0C9CD] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B83C46]">{error}</div> : null}

      <section className="overflow-hidden rounded-xl border border-[#E5EAE6] bg-white shadow-[0_8px_30px_rgba(38,57,43,0.04)]">
        <div className="grid gap-4 border-b border-[#E8ECE9] p-4 lg:grid-cols-[2.2fr_repeat(4,1fr)] lg:p-5">
          <label className="relative"><span className="sr-only">Tìm kiếm tin đăng</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8D97A2]" /><input className="h-11 w-full rounded-lg border border-[#DDE3DE] pl-10 pr-3 text-sm outline-none focus:border-[#31A451] focus:ring-2 focus:ring-[#31A451]/15" placeholder="Tìm theo tiêu đề, mô tả, người đăng..." type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select aria-label="Trạng thái" className="h-11 rounded-lg border border-[#DDE3DE] bg-white px-3 text-sm text-[#4E5964] outline-none" value={status} onChange={(event) => { onStatusChange(event.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
          <select aria-label="Loại tin" className="h-11 rounded-lg border border-[#DDE3DE] bg-white px-3 text-sm text-[#4E5964] outline-none" value={propertyType} onChange={(event) => { setPropertyType(event.target.value); setPage(1); }}><option value="">Tất cả loại tin</option>{filterOptions.propertyTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select aria-label="Khu vực" className="h-11 rounded-lg border border-[#DDE3DE] bg-white px-3 text-sm text-[#4E5964] outline-none" value={city} onChange={(event) => { setCity(event.target.value); setPage(1); }}><option value="">Tất cả khu vực</option>{filterOptions.cities.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <label className="relative"><span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-[#79838D]">Từ ngày</span><CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7D8791]" /><input className="h-11 w-full rounded-lg border border-[#DDE3DE] pl-10 pr-2 text-xs text-[#4E5964] outline-none" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#E8ECE9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5"><p className="text-sm text-[#67717B]">Tổng cộng: <strong className="text-[#26303A]">{pagination.total ?? 0}</strong> tin đăng</p><div className="flex items-center gap-2"><label className="relative hidden sm:block"><span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-[#79838D]">Đến ngày</span><input className="h-9 rounded-lg border border-[#DDE3DE] px-3 text-xs text-[#4E5964] outline-none" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label><button className="flex h-9 items-center gap-2 rounded-lg border border-[#DDE3DE] px-3 text-xs font-semibold text-[#53606C] hover:bg-[#F7F9F7]" type="button" onClick={resetFilters}><RefreshCw className="size-3.5" />Làm mới</button></div></div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead className="bg-[#FAFBFA] text-[11px] font-semibold text-[#59646E]"><tr><th className="w-12 px-4 py-3.5">#</th><th className="px-3 py-3.5">Tin đăng</th><th className="px-3 py-3.5">Người đăng</th><th className="px-3 py-3.5">Loại tin</th><th className="px-3 py-3.5">Khu vực</th><th className="px-3 py-3.5">Giá thuê</th><th className="px-3 py-3.5">Ngày đăng</th><th className="px-3 py-3.5">Trạng thái</th><th className="px-3 py-3.5 text-center">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-[#EDF0ED]">
              {isLoading ? <tr><td className="px-5 py-20 text-center" colSpan="9"><LoaderCircle className="mx-auto size-6 animate-spin text-[#31A451]" /><p className="mt-2 text-sm text-[#78828C]">Đang tải danh sách tin đăng...</p></td></tr> : properties.length === 0 ? <tr><td className="px-5 py-20 text-center" colSpan="9"><Building2 className="mx-auto size-8 text-[#A5AEA7]" /><p className="mt-3 text-sm font-medium text-[#59636D]">Không tìm thấy tin đăng phù hợp.</p></td></tr> : properties.map((property, index) => {
                const owner = property.owner ?? {};
                const createdAt = formatDateTime(property.createdAt);
                const image = resolveImageUrl(property.images?.[0]?.url);
                return <tr key={property.id ?? property._id} className="hover:bg-[#FCFDFC]"><td className="px-4 py-3 text-xs text-[#53606C]">{(page - 1) * 10 + index + 1}</td><td className="px-3 py-3"><button className="flex max-w-[320px] items-center gap-3 text-left" type="button" onClick={() => setSelectedProperty(property)}>{image ? <img alt="" className="h-14 w-[76px] shrink-0 rounded-lg object-cover" src={image} /> : <span className="flex h-14 w-[76px] shrink-0 items-center justify-center rounded-lg bg-[#EDF3EE] text-[#7D9C84]"><Building2 className="size-5" /></span>}<span className="min-w-0"><span className="line-clamp-2 text-xs font-semibold leading-5 text-[#2A333C]">{property.title}</span><span className="mt-1 block text-[11px] text-[#71808C]">{property.area ? `${property.area} m²` : "—"} • {property.bedrooms ?? 0}PN • {property.bathrooms ?? 0}WC</span></span></button></td><td className="px-3 py-3"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-[#E4F2E7] text-[10px] font-bold text-[#2D9248]">{getInitials(owner.fullName)}</span><div><p className="text-xs font-medium text-[#34404B]">{owner.fullName || "Chưa cập nhật"}</p><p className="mt-0.5 text-[10px] text-[#87909A]">ID: {(owner.id ?? owner._id)?.slice(-7) || "—"}</p></div></div></td><td className="px-3 py-3"><span className="inline-flex rounded-md border border-[#C5E6CD] bg-[#EFF9F1] px-2 py-1 text-[10px] font-semibold text-[#238D41]">{property.propertyType}</span></td><td className="max-w-[150px] px-3 py-3 text-xs text-[#48545F]">{[property.district, property.city].filter(Boolean).join(", ") || property.address}</td><td className="px-3 py-3"><p className="text-xs font-bold text-[#18913A]">{formatCurrency(property.price)}</p><p className="mt-1 text-[10px] text-[#6E7882]">/tháng</p></td><td className="px-3 py-3 text-xs text-[#44515D]"><p>{createdAt.date}</p><p className="mt-1 text-[10px] text-[#6E7984]">{createdAt.time}</p></td><td className="px-3 py-3"><StatusBadge status={property.status} /></td><td className="px-3 py-3"><div className="flex items-center justify-center gap-1"><button aria-label={`Duyệt ${property.title}`} className="flex size-9 items-center justify-center rounded-lg text-[#18A047] hover:bg-[#ECF8EF] disabled:opacity-30" disabled={isReviewing || property.status === "active"} title="Duyệt tin" type="button" onClick={() => beginAction(property, "active")}><CheckCircle2 className="size-[18px]" /></button><button aria-label={`Từ chối ${property.title}`} className="flex size-9 items-center justify-center rounded-lg text-[#F02F3F] hover:bg-[#FFF0F1] disabled:opacity-30" disabled={isReviewing || property.status === "rejected"} title="Từ chối tin" type="button" onClick={() => beginAction(property, "rejected")}><XCircle className="size-[18px]" /></button><button aria-label={`Ẩn ${property.title}`} className="flex size-9 items-center justify-center rounded-lg text-[#53647A] hover:bg-[#F1F4F7] disabled:opacity-30" disabled={isReviewing || property.status === "hidden"} title="Ẩn tin" type="button" onClick={() => beginAction(property, "hidden")}><EyeOff className="size-[18px]" /></button><button aria-label={`Xem ${property.title}`} className="flex size-9 items-center justify-center rounded-lg text-[#53647A] hover:bg-[#EFF5FB]" title="Xem chi tiết" type="button" onClick={() => setSelectedProperty(property)}><Eye className="size-[18px]" /></button></div></td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#E8ECE9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5"><p className="text-xs text-[#77818B]">Hiển thị 10 tin / trang</p><div className="flex items-center gap-2"><button aria-label="Trang trước" className="flex size-9 items-center justify-center rounded-lg border border-[#DDE3DE] text-[#66717B] disabled:opacity-35" disabled={page <= 1 || isLoading} type="button" onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" /></button>{pageNumbers.map((value) => <button key={value} className={`flex size-9 items-center justify-center rounded-lg border text-xs font-semibold ${value === page ? "border-[#28A34B] bg-[#28A34B] text-white" : "border-[#DDE3DE] text-[#4F5A65]"}`} type="button" onClick={() => setPage(value)}>{value}</button>)}<button aria-label="Trang sau" className="flex size-9 items-center justify-center rounded-lg border border-[#DDE3DE] text-[#66717B] disabled:opacity-35" disabled={page >= (pagination.totalPages ?? 1) || isLoading} type="button" onClick={() => setPage((value) => value + 1)}><ChevronRight className="size-4" /></button></div></div>
      </section>

      {selectedProperty ? <PropertyDetailModal property={selectedProperty} onAction={beginAction} onClose={() => setSelectedProperty(null)} /> : null}
      {reviewTarget ? <ReviewReasonModal action={reviewAction} isSubmitting={isReviewing} property={reviewTarget} onClose={() => { if (!isReviewing) { setReviewTarget(null); setReviewAction(""); } }} onSubmit={(reason) => submitReview(reviewTarget, reviewAction, reason)} /> : null}
    </div>
  );
}
