import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Download,
  FileWarning,
  Headphones,
  Home,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import AdminPropertiesPage from "./AdminPropertiesPage";
import bannerImg from "./assets/banner-img.png";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
} from "./lib/admin-client";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "user",
  isActive: true,
};

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AdminSidebar({
  activeSection,
  currentUser,
  isSidebarOpen,
  onBack,
  onLogout,
  onPropertyStatusChange,
  onSectionChange,
  propertyCounts,
  propertyStatus,
}) {
  const propertyItems = [
    { key: "", label: "Tất cả tin đăng", count: propertyCounts.all, tone: "gray" },
    { key: "pending", label: "Chờ phê duyệt", count: propertyCounts.pending, tone: "amber" },
    { key: "active", label: "Đã đăng", count: propertyCounts.active, tone: "green" },
    { key: "rejected", label: "Bị từ chối", count: propertyCounts.rejected, tone: "red" },
    { key: "hidden", label: "Đã ẩn", count: propertyCounts.hidden, tone: "gray" },
  ];
  const menuItems = [
    { icon: ShieldCheck, label: "Quản lý xác thực (KYC)" },
    { icon: FileWarning, label: "Quản lý báo cáo" },
    { icon: CreditCard, label: "Gói dịch vụ & Thanh toán" },
    { icon: BarChart3, label: "Thống kê & Báo cáo" },
    { icon: Settings, label: "Cài đặt hệ thống" },
    { icon: Bell, label: "Nhật ký hoạt động" },
  ];

  function selectPropertyStatus(nextStatus) {
    onSectionChange("properties");
    onPropertyStatusChange(nextStatus);
  }

  return (
    <aside className={`border-b border-[#E5EAE6] bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[242px] lg:border-b-0 lg:border-r ${isSidebarOpen ? "lg:block" : "lg:hidden"}`}>
      <div className="flex h-full flex-col">
        <button
          className="flex items-center gap-3 px-5 py-5 text-left"
          type="button"
          onClick={onBack}
        >
          <span className="flex size-10 items-center justify-center text-[#159848]">
            <Home className="size-9 fill-[#159848] stroke-white" />
          </span>
          <span>
            <span className="block text-[21px] font-bold leading-none text-[#129747]">
              WeRent
            </span>
            <span className="mt-1 block text-[11px] text-[#64707B]">Admin</span>
          </span>
        </button>

        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:flex-1 lg:overflow-y-auto lg:pb-5">
          <button className={`flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition lg:w-full ${activeSection === "overview" ? "bg-[#EAF6ED] font-semibold text-[#178E42]" : "text-[#3E4B59] hover:bg-[#F5F8F5]"}`} type="button" onClick={() => onSectionChange("overview")}><LayoutDashboard className="size-4" />Tổng quan</button>
          <button className={`mt-1 flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition lg:w-full ${activeSection === "users" ? "bg-[#EAF6ED] font-semibold text-[#178E42]" : "text-[#3E4B59] hover:bg-[#F5F8F5]"}`} type="button" onClick={() => onSectionChange("users")}><Users className="size-4" /><span className="flex-1">Quản lý người dùng</span><ChevronDown className="size-3.5" /></button>

          <div className="mt-1 min-w-max lg:min-w-0">
            <button className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition lg:w-full ${activeSection === "properties" ? "bg-[#EAF6ED] font-semibold text-[#178E42]" : "text-[#3E4B59] hover:bg-[#F5F8F5]"}`} type="button" onClick={() => selectPropertyStatus(propertyStatus)}><Building2 className="size-4" /><span className="flex-1">Quản lý tin đăng</span><ChevronDown className={`size-3.5 transition ${activeSection === "properties" ? "rotate-180" : ""}`} /></button>
            {activeSection === "properties" ? <div className="ml-1 mt-1 border-l border-[#DDE8DF] pl-3">{propertyItems.map((item) => <button key={item.label} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] ${propertyStatus === item.key ? "bg-[#F0F8F2] font-semibold text-[#168B40]" : "text-[#53606D] hover:bg-[#F7F9F7]"}`} type="button" onClick={() => selectPropertyStatus(item.key)}><span className="flex-1">{item.label}</span>{Number.isFinite(item.count) ? <span className={`min-w-7 rounded-full border px-1.5 py-0.5 text-center text-[10px] font-semibold ${item.tone === "amber" ? "border-[#FFD08B] bg-[#FFF7E8] text-[#C46F00]" : item.tone === "green" ? "border-[#BCE4C6] bg-[#ECF8EF] text-[#16883B]" : item.tone === "red" ? "border-[#FFC2C8] bg-[#FFF0F1] text-[#DB3342]" : "border-[#D8DEE5] bg-[#F2F4F6] text-[#596674]"}`}>{item.count}</span> : null}</button>)}</div> : null}
          </div>

          <div className="mt-2 space-y-1">
            {menuItems.map(({ icon: Icon, label }) => <button key={label} className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-[#3E4B59] opacity-80" disabled type="button" title="Tính năng sẽ được phát triển sau"><Icon className="size-4" />{label}</button>)}
          </div>
        </nav>

        <div className="hidden p-4 lg:block">
          <button className="flex w-full items-center gap-3 rounded-xl border border-[#DDE4DE] p-3 text-left hover:bg-[#F8FAF8]" type="button"><span className="flex size-9 items-center justify-center rounded-full bg-[#EEF3F8] text-[#53657A]"><Headphones className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#34404C]">Trung tâm hỗ trợ</span><span className="mt-1 block text-[10px] text-[#7A858F]">Hỗ trợ giải đáp thắc mắc</span></span><ChevronRight className="size-4 text-[#607087]" /></button>
          <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-[#7A858F] hover:bg-[#F5F7F5]" type="button" onClick={onLogout}><LogOut className="size-3.5" />Đăng xuất {currentUser.fullName}</button>
        </div>
      </div>
    </aside>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <article className="rounded-2xl border border-[#E9EDE9] bg-white p-4 shadow-[0_8px_26px_rgba(45,70,51,0.04)] sm:p-5">
      <div className="flex items-center gap-4">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="size-6" />
        </span>
        <div>
          <p className="text-xs text-[#6D7680]">{label}</p>
          <p className="mt-1 text-[25px] font-bold leading-none text-[#20262E]">
            {Number(value ?? 0).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>
    </article>
  );
}

const trafficValues = [1250, 1610, 1180, 1420, 1210, 1510, 1290, 1980, 1400, 1760];
const trafficLabels = ["01/07", "02/07", "03/07", "04/07", "05/07", "06/07", "07/07", "08/07", "09/07", "10/07"];

function TrafficChart() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    function drawChart() {
      const context = canvas.getContext("2d");
      const bounds = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(Math.floor(bounds.width * ratio), 1);
      canvas.height = Math.max(Math.floor(bounds.height * ratio), 1);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const width = bounds.width;
      const height = bounds.height;
      const padding = { top: 14, right: 14, bottom: 8, left: 4 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const maxValue = 2500;
      const points = trafficValues.map((value, index) => ({
        x: padding.left + (chartWidth * index) / (trafficValues.length - 1),
        y: padding.top + chartHeight - (value / maxValue) * chartHeight,
      }));

      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, padding.top, 0, height);
      gradient.addColorStop(0, "rgba(48, 159, 78, 0.20)");
      gradient.addColorStop(1, "rgba(48, 159, 78, 0.015)");

      context.beginPath();
      context.moveTo(points[0].x, height);
      points.forEach((point, index) => {
        if (index === 0) {
          context.lineTo(point.x, point.y);
          return;
        }
        const previous = points[index - 1];
        const midX = (previous.x + point.x) / 2;
        context.bezierCurveTo(midX, previous.y, midX, point.y, point.x, point.y);
      });
      context.lineTo(points.at(-1).x, height);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();

      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
          return;
        }
        const previous = points[index - 1];
        const midX = (previous.x + point.x) / 2;
        context.bezierCurveTo(midX, previous.y, midX, point.y, point.x, point.y);
      });
      context.strokeStyle = "#329F4F";
      context.lineWidth = 2.2;
      context.lineCap = "round";
      context.stroke();

      points.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 4, 0, Math.PI * 2);
        context.fillStyle = "#329F4F";
        context.fill();
        context.beginPath();
        context.arc(point.x, point.y, 2, 0, Math.PI * 2);
        context.fillStyle = "#FFFFFF";
        context.fill();
      });
    }

    const resizeObserver = new ResizeObserver(drawChart);
    resizeObserver.observe(canvas);
    drawChart();
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2">
      <div className="flex h-[226px] flex-col justify-between pb-7 pt-1 text-right text-[10px] text-[#75808A]">
        {["2,500", "2,000", "1,500", "1,000", "500", "0"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div>
        <div className="relative h-[200px] border-b border-[#DDE3DE] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(20%-1px),#EEF1EE_calc(20%-1px),#EEF1EE_20%)]">
          <canvas ref={canvasRef} className="absolute inset-0 size-full" />
        </div>
        <div className="mt-2 grid grid-cols-10 text-center text-[10px] text-[#65707A]">
          {trafficLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
    </div>
  );
}

function DashboardStatCard({ icon: Icon, label, value, change, color }) {
  return (
    <article className="rounded-xl border border-[#E5EAE5] bg-white px-5 py-5 shadow-[0_5px_18px_rgba(39,58,44,0.035)]">
      <div className="flex items-center gap-4">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#505A64]">{label}</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-[26px] font-bold leading-none text-[#17202A]">
              {Number(value ?? 0).toLocaleString("vi-VN")}
            </p>
            <span className="pb-0.5 text-[11px] font-semibold text-[#2FA250]">↑ {change}</span>
          </div>
          <p className="mt-2 text-[10px] text-[#7A848E]">So với 23/06 - 30/06</p>
        </div>
      </div>
    </article>
  );
}

const latestProperties = [
  { title: "Căn hộ 2PN Vinhomes Ocean Park", location: "Quận Gia Lâm, Hà Nội", date: "10/07/2025", status: "Đã duyệt", tone: "green", position: "33% center" },
  { title: "Nhà nguyên căn hẻm 5m", location: "Quận Tân Bình, TP.HCM", date: "10/07/2025", status: "Chờ duyệt", tone: "yellow", position: "58% center" },
  { title: "Căn hộ studio đầy đủ nội thất", location: "Quận Bình Thạnh, TP.HCM", date: "09/07/2025", status: "Đã duyệt", tone: "green", position: "73% center" },
  { title: "Phòng trọ gần ĐH Bách Khoa", location: "Quận Hai Bà Trưng, Hà Nội", date: "09/07/2025", status: "Từ chối", tone: "red", position: "86% center" },
];

const viewingRequests = [
  { name: "Trần Minh Tuấn", property: "Căn hộ 2PN Vinhomes Ocean Park", date: "10/07/2025 - 14:30", initials: "TT" },
  { name: "Lê Hoàng Anh", property: "Nhà nguyên căn hẻm 5m", date: "10/07/2025 - 10:15", initials: "LA" },
  { name: "Phạm Quỳnh Chi", property: "Căn hộ studio đầy đủ nội thất", date: "09/07/2025 - 16:45", initials: "PC" },
  { name: "Nguyễn Văn Nam", property: "Phòng trọ gần ĐH Bách Khoa", date: "09/07/2025 - 09:20", initials: "NN" },
];

function DashboardOverview({ summary }) {
  const cards = [
    { icon: Users, label: "Người dùng", value: summary.totalUsers, change: "12.5%", color: "bg-[#E6F4E8] text-[#2E9C4C]" },
    { icon: Building2, label: "Tin đăng", value: summary.totalProperties, change: "8.3%", color: "bg-[#E7F1FC] text-[#3E88DD]" },
    { icon: CalendarDays, label: "Yêu cầu xem phòng", value: 596, change: "15.6%", color: "bg-[#FFF2DD] text-[#EE991C]" },
    { icon: CreditCard, label: "Giao dịch thành công", value: summary.totalPayments, change: "10.2%", color: "bg-[#F0EAFE] text-[#7C55DF]" },
  ];

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <DashboardStatCard key={card.label} {...card} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.28fr_1fr]">
        <article className="rounded-xl border border-[#E5EAE5] bg-white p-5 shadow-[0_5px_18px_rgba(39,58,44,0.035)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[#242B33]">Lượt truy cập</h2>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-[#DFE5DF] px-3 text-xs text-[#57616B]" type="button">
              7 ngày qua <ChevronRight className="size-3.5 rotate-90" />
            </button>
          </div>
          <TrafficChart />
        </article>

        <article className="rounded-xl border border-[#E5EAE5] bg-white p-5 shadow-[0_5px_18px_rgba(39,58,44,0.035)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[#242B33]">Tin đăng mới nhất</h2>
            <button className="text-xs font-semibold text-[#2E9D4D]" type="button">Xem tất cả</button>
          </div>
          <div className="mt-4 divide-y divide-[#EDF0ED]">
            {latestProperties.map((property) => (
              <div key={property.title} className="flex items-center gap-3 py-2.5 first:pt-0">
                <img
                  alt=""
                  className="h-11 w-14 shrink-0 rounded-lg object-cover"
                  src={bannerImg}
                  style={{ objectPosition: property.position }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#313942]">{property.title}</p>
                  <p className="mt-1 truncate text-[10px] text-[#79838D]">{property.location}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-[#69737D]">{property.date}</p>
                  <span className={`mt-1 inline-flex rounded-md px-2 py-1 text-[9px] font-semibold ${
                    property.tone === "green"
                      ? "bg-[#EAF7ED] text-[#2E9149]"
                      : property.tone === "yellow"
                        ? "bg-[#FFF3DF] text-[#C77B0E]"
                        : "bg-[#FFF0F0] text-[#D04C4C]"
                  }`}>
                    {property.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.28fr_1fr]">
        <article className="rounded-xl border border-[#E5EAE5] bg-white p-5 shadow-[0_5px_18px_rgba(39,58,44,0.035)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[#242B33]">Yêu cầu xem phòng mới</h2>
            <button className="text-xs font-semibold text-[#2E9D4D]" type="button">Xem tất cả</button>
          </div>
          <div className="mt-3 divide-y divide-[#EDF0ED]">
            {viewingRequests.map((request, index) => (
              <div key={request.name} className="grid grid-cols-[minmax(0,1fr)_150px_76px] items-center gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index % 2 === 0 ? "bg-[#E1F1E5] text-[#2E9149]" : "bg-[#E7EFF8] text-[#3D74A8]"}`}>
                    {request.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#303840]">{request.name}</p>
                    <p className="mt-1 truncate text-[10px] text-[#79838D]">{request.property}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#57616B]">{request.date}</p>
                <span className="rounded-md bg-[#EAF3FF] px-2 py-1 text-center text-[9px] font-semibold text-[#3474B6]">Chờ xử lý</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#E5EAE5] bg-white p-5 shadow-[0_5px_18px_rgba(39,58,44,0.035)]">
          <h2 className="text-[15px] font-bold text-[#242B33]">Thống kê theo danh mục</h2>
          <div className="mt-6 grid items-center gap-5 sm:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)]">
            <div className="relative mx-auto size-40 rounded-full bg-[conic-gradient(#2F9E4D_0_39.9%,#3C85DD_39.9%_65.1%,#F5A11D_65.1%_85%,#F04E43_85%_95%,#D9DEE1_95%_100%)]">
              <div className="absolute inset-[25px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-[22px] font-bold text-[#1E252D]">{Number(summary.totalProperties ?? 1284).toLocaleString("vi-VN")}</span>
                <span className="mt-1 text-[10px] text-[#6C7680]">Tin đăng</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["#2F9E4D", "Căn hộ chung cư", "512 (39.9%)"],
                ["#3C85DD", "Nhà nguyên căn", "324 (25.2%)"],
                ["#F5A11D", "Phòng trọ", "256 (19.9%)"],
                ["#F04E43", "Nhà mặt phố", "128 (10.0%)"],
                ["#D9DEE1", "Khác", "64 (5.0%)"],
              ].map(([color, label, value]) => (
                <div key={label} className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-2 text-[10px] text-[#4D5761]">
                  <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function UserFormModal({ user, onClose, onSubmit }) {
  const isEditing = Boolean(user);
  const [form, setForm] = useState(() =>
    user
      ? {
          fullName: user.fullName ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          password: "",
          role: user.roles?.includes("admin") ? "admin" : "user",
          isActive: user.isActive !== false,
        }
      : emptyForm,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!form.email.trim() && !form.phone.trim()) {
      setError("Cần có ít nhất một email hoặc số điện thoại.");
      return;
    }

    if (!isEditing && form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (isEditing && form.password && form.password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(form.password ? { password: form.password } : {}),
        roles: [form.role],
        isActive: form.isActive,
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message || "Không thể lưu tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <form
        aria-labelledby="admin-user-form-title"
        className="max-h-[calc(100dvh-32px)] w-full max-w-[610px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-[0_30px_80px_rgba(26,41,31,0.22)] sm:p-7"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-user-form-title" className="text-xl font-bold text-[#242A32]">
              {isEditing ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
            </h2>
            <p className="mt-1 text-sm text-[#78818B]">
              {isEditing
                ? "Cập nhật thông tin, quyền và trạng thái người dùng."
                : "Tạo tài khoản để sử dụng trên hệ thống WeRent."}
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F3F5F3] text-[#68717A]"
            disabled={isSubmitting}
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-[#F0CDCD] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B43E3E]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[#4A535D]">Họ và tên *</span>
            <input
              autoFocus
              className="h-11 w-full rounded-xl border border-[#DEE4DE] px-4 text-sm outline-none transition focus:border-[#36A255] focus:ring-2 focus:ring-[#36A255]/15"
              name="fullName"
              value={form.fullName}
              onChange={updateField}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-[#4A535D]">Email</span>
            <input
              className="h-11 w-full rounded-xl border border-[#DEE4DE] px-4 text-sm outline-none transition focus:border-[#36A255] focus:ring-2 focus:ring-[#36A255]/15"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-[#4A535D]">Số điện thoại</span>
            <input
              className="h-11 w-full rounded-xl border border-[#DEE4DE] px-4 text-sm outline-none transition focus:border-[#36A255] focus:ring-2 focus:ring-[#36A255]/15"
              inputMode="tel"
              name="phone"
              value={form.phone}
              onChange={updateField}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-[#4A535D]">
              {isEditing ? "Mật khẩu mới" : "Mật khẩu *"}
            </span>
            <input
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-[#DEE4DE] px-4 text-sm outline-none transition focus:border-[#36A255] focus:ring-2 focus:ring-[#36A255]/15"
              name="password"
              placeholder={isEditing ? "Để trống nếu không đổi" : "Tối thiểu 8 ký tự"}
              type="password"
              value={form.password}
              onChange={updateField}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-[#4A535D]">Vai trò *</span>
            <select
              className="h-11 w-full rounded-xl border border-[#DEE4DE] bg-white px-4 text-sm outline-none transition focus:border-[#36A255] focus:ring-2 focus:ring-[#36A255]/15"
              name="role"
              value={form.role}
              onChange={updateField}
            >
              <option value="user">Người dùng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </label>
        </div>

        <label className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-[#F6F8F6] px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-[#3D464F]">Tài khoản hoạt động</span>
            <span className="mt-0.5 block text-xs text-[#7C858F]">Cho phép người dùng đăng nhập vào hệ thống.</span>
          </span>
          <input
            checked={form.isActive}
            className="size-5 accent-[#31A451]"
            name="isActive"
            type="checkbox"
            onChange={updateField}
          />
        </label>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-xl border border-[#DCE2DC] px-5 text-sm font-semibold text-[#5E6771]"
            disabled={isSubmitting}
            type="button"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#31A451] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(49,164,81,0.2)] disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa tài khoản.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[440px] rounded-[24px] bg-white p-6 shadow-[0_30px_80px_rgba(26,41,31,0.22)]">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#D65050]">
          <Trash2 className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-[#252B33]">Xóa tài khoản?</h2>
        <p className="mt-2 text-sm leading-6 text-[#6D7680]">
          Tài khoản <strong className="text-[#353D46]">{user.fullName}</strong> sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.
        </p>
        {error ? <p className="mt-3 text-sm text-[#B43E3E]">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-10 rounded-xl border border-[#DCE2DC] px-4 text-sm font-semibold text-[#5E6771]"
            disabled={isDeleting}
            type="button"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-[#D95050] px-4 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isDeleting}
            type="button"
            onClick={handleDelete}
          >
            {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ accessToken, currentUser, onBack, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [propertyStatus, setPropertyStatus] = useState("");
  const [propertyCounts, setPropertyCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formUser, setFormUser] = useState(undefined);
  const [showForm, setShowForm] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const formUserId = formUser?.id ?? formUser?._id ?? "";
  const deleteUserId = deleteUser?.id ?? deleteUser?._id ?? "";

  const stats = useMemo(
    () => [
      { icon: Users, label: "Tổng người dùng", value: summary.totalUsers, color: "bg-[#E5F4E8] text-[#2E9D4D]" },
      { icon: UserRoundCheck, label: "Đang hoạt động", value: summary.activeUsers, color: "bg-[#E8F2FF] text-[#397FD0]" },
      { icon: ShieldCheck, label: "Quản trị viên", value: summary.adminUsers, color: "bg-[#F0EAFE] text-[#7954D8]" },
      { icon: Plus, label: "Mới trong tháng", value: summary.newUsersThisMonth, color: "bg-[#FFF2DD] text-[#D98A17]" },
    ],
    [summary],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (activeSection !== "users") return undefined;

    const controller = new AbortController();
    window.queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setIsLoading(true);
        setError("");
      }
    });

    getAdminUsers(
      accessToken,
      { search: debouncedSearch, role, status, page, limit: 8 },
      { signal: controller.signal },
    )
      .then((response) => {
        setUsers(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Không thể tải danh sách người dùng.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [accessToken, activeSection, debouncedSearch, page, refreshVersion, role, status]);

  useEffect(() => {
    getAdminDashboard(accessToken)
      .then((response) => setSummary(response.data.summary))
      .catch(() => setSummary({}));
  }, [accessToken, refreshVersion]);

  function refresh(message) {
    setNotice(message);
    setRefreshVersion((value) => value + 1);
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function handleFormSubmit(payload) {
    if (formUserId) {
      const response = await updateAdminUser(accessToken, formUserId, payload);
      refresh(response.message);
      return;
    }

    const response = await createAdminUser(accessToken, payload);
    setPage(1);
    refresh(response.message);
  }

  async function handleDelete() {
    if (!deleteUserId) return;

    const response = await deleteAdminUser(accessToken, deleteUserId);
    if (users.length === 1 && page > 1) setPage((value) => value - 1);
    refresh(response.message);
  }

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#20262E]">
      <AdminSidebar
        activeSection={activeSection}
        currentUser={currentUser}
        isSidebarOpen={isSidebarOpen}
        onBack={onBack}
        onLogout={onLogout}
        onPropertyStatusChange={setPropertyStatus}
        onSectionChange={setActiveSection}
        propertyCounts={propertyCounts}
        propertyStatus={propertyStatus}
      />

      {showForm ? (
        <UserFormModal
          user={formUser}
          onClose={() => {
            setShowForm(false);
            setFormUser(undefined);
          }}
          onSubmit={handleFormSubmit}
        />
      ) : null}
      {deleteUser ? (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
        />
      ) : null}

      <main className={isSidebarOpen ? "lg:ml-[242px]" : ""}>
        <header className="border-b border-[#E9EDE9] bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <button aria-label={isSidebarOpen ? "Thu gọn menu" : "Mở menu"} className="mt-0.5 hidden size-9 items-center justify-center rounded-lg text-[#435572] hover:bg-[#F3F6F4] lg:flex" type="button" onClick={() => setIsSidebarOpen((value) => !value)}><Menu className="size-5" /></button>
              <div>
              <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#1F252D]">
                {activeSection === "overview"
                  ? "Tổng quan"
                  : activeSection === "users"
                    ? "Quản lý người dùng"
                    : "Quản lý tin đăng"}
              </h1>
              <p className="mt-1 text-sm text-[#747D87]">
                {activeSection === "overview"
                  ? "Theo dõi hoạt động và hiệu suất của hệ thống."
                  : activeSection === "users"
                    ? "Quản lý tài khoản và quyền truy cập trên hệ thống."
                    : "Quản lý và kiểm duyệt tất cả tin đăng trên hệ thống."}
              </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE5DD] bg-white px-4 text-sm font-semibold text-[#4D5862] hover:bg-[#F7FAF7] lg:hidden"
                type="button"
                onClick={onBack}
              >
                <ChevronLeft className="size-4" /> Trang chủ
              </button>
              {activeSection === "overview" ? (
                <>
                  <button className="flex h-11 items-center gap-2 rounded-xl border border-[#DDE3DD] bg-white px-4 text-sm text-[#4F5963]" type="button">
                    <CalendarDays className="size-4" /> 01/07/2025 - 10/07/2025
                    <ChevronRight className="size-3.5 rotate-90" />
                  </button>
                  <button className="flex h-11 items-center gap-2 rounded-xl border border-[#A8D5B2] bg-white px-4 text-sm font-semibold text-[#2E9149]" type="button">
                    <Download className="size-4" /> Xuất báo cáo
                  </button>
                </>
              ) : activeSection === "users" ? (
                <button
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#31A451] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(49,164,81,0.2)]"
                  type="button"
                  onClick={() => {
                    setFormUser(undefined);
                    setShowForm(true);
                  }}
                >
                  <Plus className="size-4" /> Thêm người dùng
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-5 px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          {activeSection === "overview" ? (
            <DashboardOverview summary={summary} />
          ) : activeSection === "properties" ? (
            <AdminPropertiesPage
              accessToken={accessToken}
              status={propertyStatus}
              onCountsChange={setPropertyCounts}
              onStatusChange={setPropertyStatus}
            />
          ) : (
            <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
          </section>

          {notice ? (
            <div className="rounded-xl border border-[#CFE8D3] bg-[#F0F9F2] px-4 py-3 text-sm text-[#277C40]">{notice}</div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-[#E7EBE7] bg-white shadow-[0_10px_35px_rgba(40,61,46,0.045)]">
            <div className="border-b border-[#E9EDE9] p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#262D35]">Danh sách tài khoản</h2>
                  <p className="mt-1 text-xs text-[#808892]">{pagination.total ?? 0} tài khoản phù hợp</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_150px_150px]">
                  <label className="relative">
                    <span className="sr-only">Tìm kiếm người dùng</span>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98A0A9]" />
                    <input
                      className="h-10 w-full rounded-xl border border-[#E0E5E0] pl-10 pr-3 text-sm outline-none focus:border-[#36A255] focus:ring-2 focus:ring-[#36A255]/15"
                      placeholder="Tên, email, số điện thoại..."
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Lọc theo vai trò"
                    className="h-10 rounded-xl border border-[#E0E5E0] bg-white px-3 text-sm text-[#535D67] outline-none focus:border-[#36A255]"
                    value={role}
                    onChange={(event) => { setRole(event.target.value); setPage(1); }}
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                  <select
                    aria-label="Lọc theo trạng thái"
                    className="h-10 rounded-xl border border-[#E0E5E0] bg-white px-3 text-sm text-[#535D67] outline-none focus:border-[#36A255]"
                    value={status}
                    onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã khóa</option>
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <div className="m-5 rounded-xl border border-[#F0CECE] bg-[#FFF6F6] px-4 py-3 text-sm text-[#B53E3E]">{error}</div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-[#F8FAF8] text-[11px] font-bold uppercase tracking-[0.05em] text-[#7C858E]">
                  <tr>
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-5 py-3.5">Liên hệ</th>
                    <th className="px-5 py-3.5">Vai trò</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Ngày tạo</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF0ED]">
                  {isLoading ? (
                    <tr><td className="px-5 py-16 text-center" colSpan="6"><LoaderCircle className="mx-auto size-6 animate-spin text-[#31A451]" /><p className="mt-2 text-sm text-[#7B848D]">Đang tải dữ liệu...</p></td></tr>
                  ) : users.length === 0 ? (
                    <tr><td className="px-5 py-16 text-center" colSpan="6"><Users className="mx-auto size-8 text-[#A9B1AA]" /><p className="mt-3 text-sm font-medium text-[#59636D]">Không tìm thấy tài khoản phù hợp.</p></td></tr>
                  ) : users.map((user) => {
                    const userId = user.id ?? user._id ?? "";
                    const currentUserId = currentUser.id ?? currentUser._id ?? "";
                    const isSelf = userId === currentUserId;
                    return (
                      <tr key={userId} className="transition hover:bg-[#FBFCFB]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img alt="" className="size-10 rounded-full object-cover" src={user.avatarUrl} />
                            ) : (
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E4F3E7] text-xs font-bold text-[#2E984A]">{getInitials(user.fullName)}</span>
                            )}
                            <div>
                              <p className="font-semibold text-[#313942]">{user.fullName}</p>
                              <p className="mt-0.5 text-[11px] text-[#9198A1]">ID: {userId ? userId.slice(-8) : "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#626C76]">
                          {user.email ? <p className="flex items-center gap-1.5"><Mail className="size-3.5" />{user.email}</p> : null}
                          {user.phone ? <p className="mt-1.5 flex items-center gap-1.5"><CircleUserRound className="size-3.5" />{user.phone}</p> : null}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${user.roles?.includes("admin") ? "bg-[#EFE9FD] text-[#6F4BC3]" : "bg-[#EAF4FF] text-[#3678BC]"}`}>
                            {user.roles?.includes("admin") ? "Quản trị viên" : "Người dùng"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${user.isActive === false ? "bg-[#FFF0F0] text-[#C84C4C]" : "bg-[#E9F7EC] text-[#2E9149]"}`}>
                            <span className={`size-1.5 rounded-full ${user.isActive === false ? "bg-[#D75858]" : "bg-[#35A554]"}`} />
                            {user.isActive === false ? "Đã khóa" : "Hoạt động"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#66707A]">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              aria-label={`Chỉnh sửa ${user.fullName}`}
                              className="flex size-9 items-center justify-center rounded-lg border border-[#E1E6E1] text-[#5F6973] transition hover:border-[#BFDCC5] hover:bg-[#F0F8F1] hover:text-[#2E974B]"
                              type="button"
                              onClick={() => { setFormUser(user); setShowForm(true); }}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              aria-label={`Xóa ${user.fullName}`}
                              className="flex size-9 items-center justify-center rounded-lg border border-[#E1E6E1] text-[#A84A4A] transition hover:border-[#F0CACA] hover:bg-[#FFF4F4] disabled:cursor-not-allowed disabled:opacity-35"
                              disabled={isSelf}
                              title={isSelf ? "Không thể tự xóa tài khoản" : "Xóa tài khoản"}
                              type="button"
                              onClick={() => setDeleteUser(user)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E9EDE9] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#7B848D]">Trang {pagination.page ?? 1} / {pagination.totalPages ?? 1}</p>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Trang trước"
                  className="flex size-9 items-center justify-center rounded-lg border border-[#DDE3DD] text-[#66707A] disabled:opacity-35"
                  disabled={page <= 1 || isLoading}
                  type="button"
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#31A451] text-xs font-semibold text-white">{page}</span>
                <button
                  aria-label="Trang sau"
                  className="flex size-9 items-center justify-center rounded-lg border border-[#DDE3DD] text-[#66707A] disabled:opacity-35"
                  disabled={page >= (pagination.totalPages ?? 1) || isLoading}
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </section>

          <p className="flex items-center gap-2 text-xs text-[#858E97]">
            <LockKeyhole className="size-3.5" /> Tài khoản quản trị hiện tại không thể tự khóa, gỡ quyền hoặc xóa.
          </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
