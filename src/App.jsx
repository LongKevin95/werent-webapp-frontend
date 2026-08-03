import { useEffect, useRef, useState } from "react";
import AdminPage from "./AdminPage";
import bannerImg from "./assets/banner-img.png";
import {
  changePassword as changePasswordRequest,
  getCurrentUser as fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
  uploadAvatar as uploadAvatarRequest,
} from "./lib/auth-client";
import { INVALID_PHONE_MESSAGE, normalizeVietnamPhone } from "./lib/phone";
import {
  ArrowRight,
  Bath,
  Bell,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  CarFront,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  FileText,
  Heart,
  Home,
  House,
  KeyRound,
  Landmark,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Lock,
  PawPrint,
  Phone,
  Ruler,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sofa,
  Store,
  UserRound,
  Eye,
  EyeOff,
  Warehouse,
  Wind,
  X,
} from "lucide-react";

const AUTH_TOKEN_STORAGE_KEY = "werent.accessToken";

function App() {
  return <HomePage />;
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "";
}

function buildRegisterContactPayload(value) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.includes("@")) {
    return { email: normalizedValue };
  }

  const normalizedPhone = normalizeVietnamPhone(normalizedValue);
  return normalizedPhone ? { phone: normalizedPhone } : null;
}

function createPlaceholderImage(title, primary, secondary) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <rect width="640" height="420" rx="32" fill="${secondary}"/>
      <rect x="0" y="260" width="640" height="160" fill="#efe7da"/>
      <rect x="350" y="82" width="170" height="110" rx="14" fill="#f8f4ee" stroke="#d5d0c6"/>
      <rect x="370" y="102" width="130" height="70" rx="8" fill="#ffffff"/>
      <rect x="54" y="92" width="95" height="195" rx="47.5" fill="#dce8d9"/>
      <path d="M102 112C126 76 170 68 204 90" stroke="#8eb588" stroke-width="9" stroke-linecap="round"/>
      <path d="M94 142C47 97 18 118 12 148" stroke="#8eb588" stroke-width="9" stroke-linecap="round"/>
      <path d="M114 160C156 138 200 154 224 182" stroke="#8eb588" stroke-width="9" stroke-linecap="round"/>
      <path d="M100 119V286" stroke="#6a915f" stroke-width="7" stroke-linecap="round"/>
      <path d="M168 138V305" stroke="#7e6a4d" stroke-width="6" stroke-linecap="round"/>
      <path d="M190 138C206 120 232 122 246 140" stroke="#7ba06f" stroke-width="7" stroke-linecap="round"/>
      <path d="M186 148L162 230" stroke="#6f8068" stroke-width="4"/>
      <circle cx="245" cy="142" r="16" fill="#f4cf7c"/>
      <rect x="206" y="195" width="305" height="112" rx="24" fill="${primary}"/>
      <rect x="236" y="170" width="118" height="78" rx="20" fill="#edf2e7"/>
      <rect x="360" y="170" width="108" height="78" rx="20" fill="#edf2e7"/>
      <rect x="198" y="255" width="315" height="20" rx="10" fill="#98af8c" fill-opacity="0.28"/>
      <path d="M228 300L218 352" stroke="#c18c4a" stroke-width="10" stroke-linecap="round"/>
      <path d="M486 300L498 352" stroke="#c18c4a" stroke-width="10" stroke-linecap="round"/>
      <rect x="420" y="160" width="64" height="72" rx="16" fill="#ffffff"/>
      <path d="M419 221L486 162" stroke="#e2efe0" stroke-width="10"/>
      <text x="44" y="374" fill="#6f7a71" font-family="Arial, sans-serif" font-size="26" font-weight="700">${title}</text>
    </svg>
  `)}`;
}

const navItems = ["Trang chủ", "Tin đăng", "Hỗ trợ", "Về chúng tôi"];

const searchFilters = [
  ["Không giá", "Dưới 3 triệu", "3 - 5 triệu", "5 - 10 triệu"],
  ["Thành phố", "Hồ Chí Minh", "Hà Nội", "Đà Nẵng"],
  ["Quận / Huyện", "Quận 7", "Thủ Đức", "Bình Thạnh"],
  ["Diện tích", "Dưới 20m²", "20m² - 35m²", "Trên 35m²"],
];

const quickFilters = [
  { icon: CircleDollarSign, label: "Dưới 3 triệu" },
  { icon: CircleDollarSign, label: "3 - 5 triệu" },
  { icon: CircleDollarSign, label: "5 - 10 triệu" },
  { icon: Wind, label: "Có máy lạnh" },
  { icon: CarFront, label: "Có bãi xe" },
  { icon: Sofa, label: "Nội thất" },
  { icon: PawPrint, label: "Thú cưng" },
];

const categories = [
  { icon: House, title: "Phòng trọ", count: "1.520 tin" },
  { icon: Building2, title: "Chung cư", count: "680 tin" },
  { icon: Home, title: "Nhà nguyên căn", count: "230 tin" },
  { icon: BedDouble, title: "Ký túc xá", count: "120 tin" },
  { icon: Landmark, title: "Văn phòng", count: "98 tin" },
  { icon: Store, title: "Mặt bằng", count: "76 tin" },
];

const featuredListings = [
  {
    image: createPlaceholderImage("Căn phòng 01", "#d8e4d3", "#f3efe8"),
    price: "5.500.000đ",
    title: "Phòng mới xây, full nội thất, cửa sổ lớn",
    location: "Quận 7, TP. Hồ Chí Minh",
    area: "35m²",
    specs: ["1 WC", "Full nội thất"],
    owner: "Nguyễn Văn A",
  },
  {
    image: createPlaceholderImage("Căn hộ 02", "#d7d5c8", "#efe8de"),
    price: "7.200.000đ",
    title: "Căn hộ dịch vụ cao cấp, ban công rộng",
    location: "Bình Thạnh, TP. Hồ Chí Minh",
    area: "45m²",
    specs: ["1 WC", "Full nội thất"],
    owner: "Trần Thị B",
  },
  {
    image: createPlaceholderImage("Studio 03", "#d8d2c8", "#f2ece5"),
    price: "4.200.000đ",
    title: "Phòng gác lửng, máy lạnh, bếp riêng",
    location: "Thủ Đức, TP. Hồ Chí Minh",
    area: "28m²",
    specs: ["1 WC", "Nội thất cơ bản"],
    owner: "Lê Văn C",
  },
];

const latestListings = [
  {
    image: createPlaceholderImage("Phòng trọ", "#d7dfd2", "#f3efe7"),
    price: "3.800.000đ",
    title: "Phòng trọ gần ĐH Bách Khoa",
    location: "Quận 10, TP.HCM",
    meta: "24m² • 1 WC",
  },
  {
    image: createPlaceholderImage("Căn hộ mini", "#d8d6ca", "#efe9df"),
    price: "6.000.000đ",
    title: "Căn hộ mini mới xây 100%",
    location: "Tân Bình, TP.HCM",
    meta: "35m² • 1 WC",
  },
  {
    image: createPlaceholderImage("Nội thất", "#d6e3d7", "#f1ece3"),
    price: "5.200.000đ",
    title: "Phòng full nội thất, gần Lotte Mart",
    location: "Quận 7, TP.HCM",
    meta: "30m² • 1 WC",
  },
  {
    image: createPlaceholderImage("Gác lửng", "#ddd3c6", "#f3ede5"),
    price: "4.500.000đ",
    title: "Phòng gác lửng, giờ giấc tự do",
    location: "Gò Vấp, TP.HCM",
    meta: "25m² • 1 WC",
  },
  {
    image: createPlaceholderImage("PN riêng", "#d5ddd7", "#f1eee7"),
    price: "7.500.000đ",
    title: "Căn hộ 1PN, nội thất cao cấp",
    location: "Bình Thạnh, TP.HCM",
    meta: "42m² • 1 WC",
  },
  {
    image: createPlaceholderImage("Sinh viên", "#d9d7cf", "#f3ede6"),
    price: "3.300.000đ",
    title: "Phòng trọ sinh viên, giá tốt",
    location: "Thủ Đức, TP.HCM",
    meta: "18m² • 1 WC",
  },
];

const footerColumns = [
  {
    title: "Về WeRent",
    items: ["Giới thiệu", "Tin tức", "Tuyển dụng", "Liên hệ"],
  },
  {
    title: "Hỗ trợ",
    items: [
      "Trung tâm trợ giúp",
      "Hướng dẫn sử dụng",
      "Quy định cộng đồng",
      "Chính sách bảo mật",
    ],
  },
  {
    title: "Dành cho chủ nhà",
    items: [
      "Đăng tin cho thuê",
      "Quản lý tin đăng",
      "Gói dịch vụ",
      "Hướng dẫn đăng tin",
    ],
  },
];

function SectionHeading({ title }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-[16px] font-bold text-[#272C35] sm:text-[20px]">
        {title}
      </h2>
      <button className="text-sm font-medium text-[#34A853]" type="button">
        Xem tất cả
      </button>
    </div>
  );
}

function FilterSelect({ options }) {
  return (
    <div className="relative min-w-0 flex-1">
      <select className="h-11 w-full appearance-none rounded-xl border border-[#E7E8EB] bg-white px-4 pr-10 text-sm text-[#343A45] outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/15">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#8E939E]" />
    </div>
  );
}

function CategoryCard({ icon: Icon, title, count }) {
  return (
    <button
      className="group rounded-[18px] border border-[#F0F1F3] bg-white p-4 text-center shadow-[0_8px_30px_rgba(38,58,53,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(38,58,53,0.1)]"
      type="button"
    >
      <span className="mx-auto flex size-[72px] items-center justify-center rounded-[20px] bg-[radial-gradient(circle_at_top,_#f0faf2,_#daf0df)] shadow-inner">
        <Icon className="size-9 text-[#5CA26A]" />
      </span>
      <span className="mt-4 block text-sm font-semibold text-[#22272F]">
        {title}
      </span>
      <span className="mt-1 block text-xs text-[#7E848F]">{count}</span>
    </button>
  );
}

function PropertyCard({ listing }) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-[#ECEEF1] bg-white shadow-[0_12px_32px_rgba(39,53,45,0.07)]">
      <div className="relative">
        <img
          alt={listing.title}
          className="h-[198px] w-full object-cover"
          src={listing.image}
        />
        <span className="absolute left-3 top-3 rounded-lg bg-[#49B96E] px-2 py-1 text-[10px] font-bold text-white">
          VIP
        </span>
        <button
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/95 text-[#77B87B] shadow-sm"
          type="button"
        >
          <Heart className="size-4" />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <div className="flex items-end gap-1">
            <span className="text-[26px] font-bold leading-none text-[#31A352]">
              {listing.price}
            </span>
            <span className="pb-0.5 text-xs text-[#8A909A]">/ tháng</span>
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-6 text-[#232933]">
            {listing.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#858B97]">
          <MapPin className="size-3.5 text-[#7F8591]" />
          <span>{listing.location}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#7D838E]">
          <span className="flex items-center gap-1.5">
            <Ruler className="size-3.5" />
            {listing.area}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-3.5" />
            {listing.specs[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <Sofa className="size-3.5" />
            {listing.specs[1]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#F0F1F3] pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4d8bd,#f0c295)] text-xs font-semibold text-[#735333]">
              {listing.owner.slice(0, 1)}
            </span>
            <span className="text-[13px] font-medium text-[#3B414B]">
              {listing.owner}
            </span>
          </div>
          <button
            className="rounded-xl border border-[#D8EEDD] px-4 py-2 text-xs font-semibold text-[#2FA14E] transition hover:bg-[#F3FBF5]"
            type="button"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

function MiniPropertyCard({ listing }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-[#ECEEF1] bg-white shadow-[0_10px_24px_rgba(39,53,45,0.05)]">
      <img
        alt={listing.title}
        className="h-[110px] w-full object-cover"
        src={listing.image}
      />
      <div className="space-y-1.5 p-3">
        <p className="text-[18px] font-bold leading-none text-[#32A553]">
          {listing.price}
        </p>
        <h3 className="min-h-[40px] text-[13px] font-semibold leading-5 text-[#242933]">
          {listing.title}
        </h3>
        <p className="text-[11px] text-[#818793]">{listing.location}</p>
        <p className="text-[11px] text-[#9095A0]">{listing.meta}</p>
      </div>
    </article>
  );
}

function AuthModal({ mode, onClose, onSwitchMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    fullName: "",
    contact: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";

  const featureItems = isLogin
    ? [
        ["Hàng ngàn tin đăng", "Cập nhật mới mỗi ngày"],
        ["Tìm kiếm thông minh", "Lọc theo nhu cầu của bạn"],
        ["Kết nối nhanh chóng", "Liên hệ trực tiếp với chủ nhà"],
        ["An toàn & minh bạch", "Thông tin rõ ràng, đáng tin cậy"],
      ]
    : [
        ["Đăng tin cho thuê", "Dễ dàng và nhanh chóng"],
        ["Tiếp cận hàng nghìn người thuê", "Tìm người phù hợp"],
        ["Quản lý tin đăng", "Thuận tiện và hiệu quả"],
        ["Hoàn toàn miễn phí", "Đăng ký và trải nghiệm"],
      ];

  function handleFieldChange(event) {
    const { name, type, checked, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (!formValues.contact.trim()) {
      setSubmitError("Vui lòng nhập email hoặc số điện thoại.");
      return;
    }

    if (!formValues.password) {
      setSubmitError("Vui lòng nhập mật khẩu.");
      return;
    }

    if (!isLogin) {
      if (!formValues.fullName.trim()) {
        setSubmitError("Vui lòng nhập họ và tên.");
        return;
      }

      if (formValues.password.length < 8) {
        setSubmitError("Mật khẩu phải có ít nhất 8 ký tự.");
        return;
      }

      if (formValues.password !== formValues.confirmPassword) {
        setSubmitError("Mật khẩu xác nhận không khớp.");
        return;
      }

      if (!formValues.contact.trim().includes("@")) {
        const normalizedPhone = normalizeVietnamPhone(formValues.contact);

        if (!normalizedPhone) {
          setSubmitError(INVALID_PHONE_MESSAGE);
          return;
        }
      }

      if (!formValues.acceptTerms) {
        setSubmitError("Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const response = await loginRequest({
          identifier: formValues.contact.trim(),
          password: formValues.password,
        });

        onClose();
        window.dispatchEvent(
          new CustomEvent("werent-auth-success", {
            detail: {
              ...response.data,
              message: response.message,
            },
          }),
        );
        return;
      }

      const contactPayload = buildRegisterContactPayload(formValues.contact);

      if (!contactPayload) {
        setSubmitError(INVALID_PHONE_MESSAGE);
        return;
      }

      const response = await registerRequest({
        fullName: formValues.fullName.trim(),
        ...contactPayload,
        password: formValues.password,
      });

      onClose();
      window.dispatchEvent(
        new CustomEvent("werent-auth-success", {
          detail: {
            ...response.data,
            message: response.message,
          },
        }),
      );
    } catch (error) {
      setSubmitError(error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 py-6 "
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative flex w-full max-w-[1180px] max-h-[calc(100dvh-32px)] overflow-hidden rounded-[32px] bg-white shadow-[0_30px_90px_rgba(11,20,32,0.28)] ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Đóng modal"
          className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:text-slate-800"
          type="button"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>

        <div className="relative hidden lg:flex lg:w-[42%] lg:flex-col lg:justify-end">
          <img
            alt={isLogin ? "Đăng nhập WeRent" : "Đăng ký WeRent"}
            className="absolute inset-0 h-full w-full object-cover"
            src={bannerImg}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,42,27,0.12)_0%,rgba(12,42,27,0.22)_36%,rgba(8,49,22,0.82)_100%)]" />

          <div className="relative z-10 p-8 xl:p-10">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(9,98,43,0.16)_0%,rgba(8,96,47,0.86)_100%)] p-7 text-white backdrop-blur-sm">
              <h3 className="text-[30px] font-bold leading-[1.15] tracking-[-0.03em]">
                {isLogin ? (
                  <>
                    Tìm nhà dễ dàng
                    <br />
                    An tâm cuộc sống
                  </>
                ) : (
                  <>
                    Tham gia WeRent
                    <br />
                    ngay hôm nay!
                  </>
                )}
              </h3>

              <div className="mt-7 space-y-4">
                {featureItems.map(([title, description]) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                      <span className="size-4 rounded-full bg-white/85" />
                    </span>
                    <div>
                      <p className="text-[16px] font-semibold leading-5">
                        {title}
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-2 opacity-60">
                <span className="size-2 rounded-full bg-white/80" />
                <span className="size-2 rounded-full bg-white/45" />
                <span className="size-2 rounded-full bg-white/35" />
                <span className="size-2 rounded-full bg-white/25" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col overflow-y-auto bg-white px-5 py-6 sm:px-8 sm:py-8 lg:w-[58%] lg:px-20 lg:py-10">
          <div className="mb-6 pr-12">
            <h2 className="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#171B26] sm:text-[40px]">
              {isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h2>
            <p className="mt-2 text-sm text-[#6C7380] sm:text-[15px]">
              {isLogin
                ? "Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục."
                : "Tạo tài khoản để trải nghiệm đầy đủ tính năng."}
            </p>
          </div>

          {submitError ? (
            <div className="mb-4 rounded-2xl border border-[#F3D1D1] bg-[#FFF6F6] px-4 py-3 text-sm text-[#B73A3A]">
              {submitError}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#2A3140]">
                  Họ và tên
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96A0AE]">
                    <Home className="size-4" />
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-[#E7E9EE] bg-white pl-11 pr-4 text-sm text-[#263041] outline-none transition placeholder:text-[#9BA3B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                    name="fullName"
                    placeholder="Nhập họ và tên"
                    type="text"
                    value={formValues.fullName}
                    onChange={handleFieldChange}
                  />
                </div>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#2A3140]">
                {isLogin ? "Email hoặc số điện thoại" : "Số điện thoại / Email"}
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96A0AE]">
                  <Mail className="size-4" />
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-[#E7E9EE] bg-white pl-11 pr-4 text-sm text-[#263041] outline-none transition placeholder:text-[#9BA3B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  name="contact"
                  placeholder={
                    isLogin
                      ? "Nhập email hoặc số điện thoại"
                      : "Nhập số điện thoại hoặc email"
                  }
                  type="text"
                  value={formValues.contact}
                  onChange={handleFieldChange}
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2A3140]">
                <span>Mật khẩu</span>
                {!isLogin ? (
                  <span className="text-xs font-normal text-[#8C93A1]">
                    *Tối thiểu 8 ký tự
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96A0AE]">
                  <Lock className="size-4" />
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-[#E7E9EE] bg-white pl-11 pr-12 text-sm text-[#263041] outline-none transition placeholder:text-[#9BA3B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  name="password"
                  placeholder={isLogin ? "Nhập mật khẩu" : "Tạo mật khẩu"}
                  type={showPassword ? "text" : "password"}
                  value={formValues.password}
                  onChange={handleFieldChange}
                />
                <button
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E96A4] transition hover:text-[#4A5260]"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </label>

            {!isLogin ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#2A3140]">
                  Xác nhận mật khẩu
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96A0AE]">
                    <Lock className="size-4" />
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-[#E7E9EE] bg-white pl-11 pr-12 text-sm text-[#263041] outline-none transition placeholder:text-[#9BA3B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    type={showPassword ? "text" : "password"}
                    value={formValues.confirmPassword}
                    onChange={handleFieldChange}
                  />
                  <button
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E96A4] transition hover:text-[#4A5260]"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </label>
            ) : null}

            {isLogin ? (
              <div className="flex items-center justify-end">
                <button
                  className="text-sm font-semibold text-[#2F9B51] transition hover:text-[#238441]"
                  type="button"
                >
                  Quên mật khẩu?
                </button>
              </div>
            ) : (
              <label className="flex items-start gap-3 rounded-xl bg-[#F8FBF8] px-4 py-3 text-sm text-[#4B5461]">
                <input
                  className="mt-1 size-4 rounded border-[#D7DDE3] text-[#35A554]"
                  checked={formValues.acceptTerms}
                  name="acceptTerms"
                  type="checkbox"
                  onChange={handleFieldChange}
                />
                <span>
                  Tôi đồng ý với{" "}
                  <span className="font-semibold text-[#2F9B51]">
                    Điều khoản sử dụng
                  </span>{" "}
                  và{" "}
                  <span className="font-semibold text-[#2F9B51]">
                    Chính sách bảo mật
                  </span>
                </span>
              </label>
            )}

            <button
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(90deg,#0E6B33_0%,#12833D_100%)] text-sm font-semibold text-white shadow-[0_16px_30px_rgba(16,121,54,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? isLogin
                  ? "Đang đăng nhập..."
                  : "Đang đăng ký..."
                : isLogin
                  ? "Đăng nhập"
                  : "Đăng ký"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-sm text-[#8B92A0]">
            <span className="h-px flex-1 bg-[#E9ECF0]" />
            <span>
              {isLogin
                ? "hoặc đăng nhập với"
                : "hoặc đăng ký bằng thông tin cá nhân"}
            </span>
            <span className="h-px flex-1 bg-[#E9ECF0]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#E7E9EE] bg-white text-sm font-semibold text-[#20252F] transition hover:bg-[#F8FAFC]"
              type="button"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-[18px] font-bold text-[#4285F4]">
                G
              </span>
              {isLogin ? "Đăng nhập với Google" : "Đăng ký với Google"}
            </button>
            <button
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#E7E9EE] bg-white text-sm font-semibold text-[#20252F] transition hover:bg-[#F8FAFC]"
              type="button"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-[#1877F2] text-[18px] font-bold text-white">
                f
              </span>
              {isLogin ? "Đăng nhập với Facebook" : "Đăng ký với Facebook"}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-[#6C7380]">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              className="font-semibold text-[#2F9B51] transition hover:text-[#238441]"
              type="button"
              onClick={() => onSwitchMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const profileMenuItems = [
  { icon: UserRound, label: "Thông tin cá nhân", active: true },
  { icon: Heart, label: "Tin yêu thích" },
  { icon: CalendarDays, label: "Lịch hẹn xem phòng" },
  { icon: MessageSquare, label: "Tin nhắn" },
  { icon: FileText, label: "Báo cáo đã gửi" },
];

function getPasswordStrength(password) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Chưa đủ mạnh", "Yếu", "Trung bình", "Khá", "Mạnh"];

  return { checks, score, label: labels[score] };
}

function PasswordField({
  label,
  name,
  placeholder,
  value,
  visible,
  onChange,
  onToggle,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#29313B]">
        {label}
      </span>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#929AA5]" />
        <input
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          className="h-12 w-full rounded-xl border border-[#E2E7E3] bg-white pl-11 pr-12 text-sm outline-none transition focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
          name={name}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
        />
        <button
          aria-label={
            visible
              ? `Ẩn ${label.toLowerCase()}`
              : `Hiện ${label.toLowerCase()}`
          }
          className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8B949F] transition hover:bg-[#F3F6F3] hover:text-[#39424D]"
          type="button"
          onClick={onToggle}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </label>
  );
}

function ChangePasswordModal({ accessToken, onClose, onSuccess }) {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visibleFields, setVisibleFields] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const strength = getPasswordStrength(values.newPassword);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function toggleField(name) {
    setVisibleFields((current) => ({
      ...current,
      [name]: !current[name],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!values.currentPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (values.newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (values.currentPassword === values.newPassword) {
      setErrorMessage("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changePasswordRequest(accessToken, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      onSuccess(response.message);
      onClose();
    } catch (error) {
      setErrorMessage(
        error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="change-password-title"
        aria-modal="true"
        className="relative max-h-[calc(100dvh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_30px_90px_rgba(10,24,15,0.28)] sm:p-9"
        role="dialog"
      >
        <button
          aria-label="Đóng popup đổi mật khẩu"
          className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full text-[#68717D] transition hover:bg-[#F1F5F1] hover:text-[#242A32]"
          disabled={isSubmitting}
          type="button"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>

        <div className="text-center">
          <h2
            className="pr-8 text-[28px] font-bold tracking-[-0.03em] text-[#20262E]"
            id="change-password-title"
          >
            Đổi mật khẩu
          </h2>
          <span className="mx-auto mt-5 flex size-16 items-center justify-center rounded-full bg-[#ECF8EE] text-[#31A252]">
            <KeyRound className="size-7" />
          </span>
          <p className="mx-auto mt-4 max-w-[360px] text-sm leading-6 text-[#68717C]">
            Tạo mật khẩu mới đủ mạnh để bảo vệ tài khoản của bạn.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-xl border border-[#F1D2D2] bg-[#FFF6F6] px-4 py-3 text-sm text-[#B33A3A]">
            {errorMessage}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <PasswordField
            label="Mật khẩu hiện tại"
            name="currentPassword"
            placeholder="Nhập mật khẩu hiện tại"
            value={values.currentPassword}
            visible={Boolean(visibleFields.currentPassword)}
            onChange={handleChange}
            onToggle={() => toggleField("currentPassword")}
          />
          <PasswordField
            label="Mật khẩu mới"
            name="newPassword"
            placeholder="Nhập mật khẩu mới"
            value={values.newPassword}
            visible={Boolean(visibleFields.newPassword)}
            onChange={handleChange}
            onToggle={() => toggleField("newPassword")}
          />

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7C858F]">Độ mạnh mật khẩu</span>
              <span
                className={
                  strength.score >= 3
                    ? "font-semibold text-[#2F9C50]"
                    : "text-[#C35C4D]"
                }
              >
                {strength.label}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index < strength.score ? "bg-[#35A554]" : "bg-[#E6EAE7]"
                  }`}
                />
              ))}
            </div>
          </div>

          <PasswordField
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu mới"
            value={values.confirmPassword}
            visible={Boolean(visibleFields.confirmPassword)}
            onChange={handleChange}
            onToggle={() => toggleField("confirmPassword")}
          />

          <div className="rounded-2xl border border-[#DDEEDD] bg-[#F3FAF4] px-4 py-4 text-sm text-[#52705A]">
            <p className="font-semibold text-[#2F7F45]">Mật khẩu nên có:</p>
            <ul className="mt-2 space-y-1.5">
              <li className={strength.checks[0] ? "text-[#2F9C50]" : ""}>
                ✓ Ít nhất 8 ký tự
              </li>
              <li className={strength.checks[1] ? "text-[#2F9C50]" : ""}>
                ✓ Chữ hoa và chữ thường
              </li>
              <li className={strength.checks[2] ? "text-[#2F9C50]" : ""}>
                ✓ Ít nhất một chữ số
              </li>
              <li className={strength.checks[3] ? "text-[#2F9C50]" : ""}>
                ✓ Ít nhất một ký tự đặc biệt
              </li>
            </ul>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <button
              className="h-12 rounded-xl border border-[#DDE3DE] text-sm font-semibold text-[#4A535D] transition hover:bg-[#F7F9F7]"
              disabled={isSubmitting}
              type="button"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className="cursor-pointer flex h-12 items-center justify-center gap-2 rounded-xl bg-[#32A452] text-sm font-semibold text-white shadow-[0_14px_25px_rgba(50,164,82,0.22)] transition hover:bg-[#2C9349] disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {isSubmitting ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfilePage({ accessToken, user, onBack, onLogout, onUserChange }) {
  const avatarInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notice, setNotice] = useState(null);
  const [formValues, setFormValues] = useState({
    fullName: user.fullName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
  });

  const memberSince = user.createdAt
    ? new Intl.DateTimeFormat("vi-VN").format(new Date(user.createdAt))
    : "Chưa có dữ liệu";
  const roleLabel = user.roles?.includes("admin")
    ? "Quản trị viên"
    : "Người dùng";

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  function cancelEditing() {
    setFormValues({
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
    setIsEditing(false);
    setNotice(null);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setNotice(null);

    if (!formValues.fullName.trim()) {
      setNotice({ type: "error", message: "Họ và tên không được để trống." });
      return;
    }

    const email = formValues.email.trim();
    const rawPhone = formValues.phone.trim();
    const phone = rawPhone ? normalizeVietnamPhone(rawPhone) : "";

    if (rawPhone && !phone) {
      setNotice({ type: "error", message: INVALID_PHONE_MESSAGE });
      return;
    }

    if (!email && !phone) {
      setNotice({
        type: "error",
        message: "Hồ sơ phải có ít nhất một email hoặc số điện thoại.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        fullName: formValues.fullName.trim(),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      };
      const response = await updateProfileRequest(accessToken, payload);
      onUserChange(response.data.user);
      setIsEditing(false);
      setNotice({ type: "success", message: response.message });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(event) {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    setNotice(null);

    if (!file) {
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setNotice({
        type: "error",
        message: "Vui lòng chọn ảnh JPG, PNG, WEBP hoặc GIF.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Ảnh không được vượt quá 5 MB." });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const response = await uploadAvatarRequest(accessToken, file);
      onUserChange(response.data.user);
      setNotice({ type: "success", message: response.message });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Không thể tải ảnh đại diện.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#20262E]">
      {showPasswordModal ? (
        <ChangePasswordModal
          accessToken={accessToken}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={(message) =>
            setNotice({
              type: "success",
              message: message || "Đổi mật khẩu thành công.",
            })
          }
        />
      ) : null}

      <header className="sticky top-0 z-30 border-b border-[#E8ECE7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-4 py-3 sm:px-6 lg:px-8">
          <button
            className="flex items-center gap-3"
            type="button"
            onClick={onBack}
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#36A655]">
              <Home className="size-5" />
            </span>
            <span className="text-left">
              <span className="block text-[21px] font-bold leading-none text-[#2FA550]">
                WeRent
              </span>
              <span className="mt-1 block text-[10px] text-[#9299A2]">
                Thuê nhà dễ dàng hơn mỗi ngày
              </span>
            </span>
          </button>

          <div className="relative ml-auto hidden max-w-[420px] flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9CA4AD]" />
            <input
              className="h-11 w-full rounded-xl bg-[#F5F7F5] pl-11 pr-4 text-sm outline-none"
              placeholder="Tìm theo địa chỉ, khu vực..."
              type="search"
            />
          </div>

          <nav className="mx-auto hidden items-center gap-6 text-sm font-medium text-[#3D454E] lg:flex">
            <button type="button" onClick={onBack}>
              Trang chủ
            </button>
            <span>Tin đăng</span>
            <span>Yêu thích</span>
            <span>Tin nhắn</span>
          </nav>

          <button
            aria-label="Thông báo"
            className="ml-auto flex size-10 items-center justify-center rounded-full border border-[#E7EBE7] text-[#68717A] lg:ml-0"
            type="button"
          >
            <Bell className="size-4" />
          </button>

          <div className="flex items-center gap-2 rounded-xl bg-[#F7F9F7] px-2 py-1.5">
            {user.avatarUrl ? (
              <img
                alt={`Ảnh đại diện của ${user.fullName}`}
                className="size-8 rounded-full object-cover"
                src={user.avatarUrl}
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-[#DFF2E3] text-[#2D9B4C]">
                <CircleUserRound className="size-5" />
              </span>
            )}
            <span className="hidden max-w-[150px] truncate text-sm font-semibold sm:block">
              {user.fullName}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-[22px] border border-[#E9ECE8] bg-white p-3 shadow-[0_10px_30px_rgba(46,72,54,0.05)]">
          <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9097A0]">
            Tài khoản
          </p>
          <div className="space-y-1">
            {profileMenuItems.map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${
                  active
                    ? "bg-[#EDF8EF] font-semibold text-[#2E9C4D]"
                    : "cursor-not-allowed text-[#69727C]"
                }`}
                disabled={!active}
                type="button"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <p className="mt-5 px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9097A0]">
            Cài đặt
          </p>
          <button
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#69727C]"
            disabled
            type="button"
          >
            <Settings className="size-4" />
            Cài đặt tài khoản
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#D05252] transition hover:bg-[#FFF5F5]"
            type="button"
            onClick={onLogout}
          >
            <ArrowRight className="size-4 rotate-180" />
            Đăng xuất
          </button>
        </aside>

        <div className="min-w-0 space-y-5">
          <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative mx-auto shrink-0 sm:mx-0">
                  {user.avatarUrl ? (
                    <img
                      alt={`Ảnh đại diện của ${user.fullName}`}
                      className="size-28 rounded-full border-4 border-[#F0F6F1] object-cover sm:size-32"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <span className="flex size-28 items-center justify-center rounded-full border-4 border-[#F0F6F1] bg-[#E6F4E8] text-[#32A452] sm:size-32">
                      <UserRound className="size-14" />
                    </span>
                  )}
                  <button
                    aria-label="Đổi ảnh đại diện"
                    className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full border-4 border-white bg-[#31A451] text-white shadow-lg disabled:opacity-60"
                    disabled={isUploadingAvatar}
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-[30px] font-bold tracking-[-0.03em] text-[#1E242C]">
                      {user.fullName}
                    </h1>
                    <span className="rounded-full bg-[#FFF7E7] px-3 py-1 text-xs font-semibold text-[#A26A11]">
                      Chưa xác thực
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#68717B] sm:justify-start">
                    {user.phone ? (
                      <span className="flex items-center gap-2">
                        <Phone className="size-4" />
                        {user.phone}
                      </span>
                    ) : null}
                    {user.email ? (
                      <span className="flex items-center gap-2">
                        <Mail className="size-4" />
                        {user.email}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs text-[#9198A1]">
                    Thành viên từ {memberSince}
                  </p>
                  <p className="mt-2 text-xs text-[#758079]">
                    Ảnh JPG, PNG, WEBP hoặc GIF, tối đa 5 MB.
                  </p>
                </div>
              </div>

              <button
                className="rounded-xl border border-[#9DCAAA] px-5 py-2.5 text-sm font-semibold text-[#2E9149] transition hover:bg-[#F0F8F1]"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#F8FAF8] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#E7F5E9] text-[#2E9D4E]">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-[#858D96]">Trạng thái</p>
                    <p className="mt-1 font-semibold text-[#29313A]">
                      {user.isActive === false ? "Đã khóa" : "Đang hoạt động"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#F8FAF8] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#E7F5E9] text-[#2E9D4E]">
                    <UserRound className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-[#858D96]">Vai trò của bạn</p>
                    <p className="mt-1 font-semibold text-[#29313A]">
                      {roleLabel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#F8FAF8] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#E7F5E9] text-[#2E9D4E]">
                    <CalendarDays className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-[#858D96]">Cập nhật gần nhất</p>
                    <p className="mt-1 font-semibold text-[#29313A]">
                      {user.updatedAt
                        ? new Intl.DateTimeFormat("vi-VN").format(
                            new Date(user.updatedAt),
                          )
                        : "Chưa có dữ liệu"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {notice ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                notice.type === "error"
                  ? "border-[#F1D1D1] bg-[#FFF6F6] text-[#B43D3D]"
                  : "border-[#D4EAD7] bg-[#F1F9F2] text-[#267C40]"
              }`}
            >
              {notice.message}
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
            <section className="rounded-[22px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_30px_rgba(46,72,54,0.045)] sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-[#252C34]">
                  Thông tin cá nhân
                </h2>
                {!isEditing ? (
                  <button
                    className="text-sm font-semibold text-[#2E9B4D]"
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    Thay đổi
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                <form className="mt-5 space-y-4" onSubmit={handleProfileSubmit}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#4B545E]">
                      Họ và tên
                    </span>
                    <input
                      className="h-12 w-full rounded-xl border border-[#E1E6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                      name="fullName"
                      value={formValues.fullName}
                      onChange={handleFormChange}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#4B545E]">
                      Số điện thoại
                    </span>
                    <input
                      className="h-12 w-full rounded-xl border border-[#E1E6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                      inputMode="tel"
                      name="phone"
                      placeholder="Ví dụ: 0900000000"
                      value={formValues.phone}
                      onChange={handleFormChange}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#4B545E]">
                      Email
                    </span>
                    <input
                      className="h-12 w-full rounded-xl border border-[#E1E6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                      name="email"
                      type="email"
                      value={formValues.email}
                      onChange={handleFormChange}
                    />
                  </label>
                  <p className="text-xs leading-5 text-[#858D96]">
                    Tài khoản phải giữ lại ít nhất một email hoặc số điện thoại
                    hợp lệ.
                  </p>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      className="h-11 rounded-xl border border-[#DDE3DE] px-5 text-sm font-semibold text-[#59626B]"
                      disabled={isSaving}
                      type="button"
                      onClick={cancelEditing}
                    >
                      Hủy
                    </button>
                    <button
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#32A452] px-5 text-sm font-semibold text-white disabled:opacity-65"
                      disabled={isSaving}
                      type="submit"
                    >
                      {isSaving ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="mt-4 divide-y divide-[#EEF1EE]">
                  {[
                    ["Họ và tên", user.fullName],
                    ["Số điện thoại", user.phone || "Chưa cập nhật"],
                    ["Email", user.email || "Chưa cập nhật"],
                    ["Vai trò", roleLabel],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 py-4 text-sm sm:grid-cols-[150px_minmax(0,1fr)]"
                    >
                      <dt className="text-[#777F89]">{label}</dt>
                      <dd className="font-medium text-[#333B44]">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            <div className="space-y-5">
              <section className="rounded-[22px] border border-[#E8ECE7] bg-white p-5 text-center shadow-[0_10px_30px_rgba(46,72,54,0.045)]">
                <h2 className="text-left text-lg font-bold text-[#252C34]">
                  Bảo mật tài khoản
                </h2>
                <span className="mx-auto mt-5 flex size-14 items-center justify-center rounded-full bg-[#ECF8EE] text-[#31A252]">
                  <Lock className="size-6" />
                </span>
                <p className="mt-3 text-sm leading-6 text-[#6E7781]">
                  Đổi mật khẩu định kỳ để bảo vệ thông tin tài khoản.
                </p>
                <button
                  className="cursor-pointer mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#32A452] text-sm font-semibold text-white transition hover:bg-[#2C9349]"
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <KeyRound className="size-4" />
                  Đổi mật khẩu
                </button>
              </section>

              <section className="rounded-[22px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_30px_rgba(46,72,54,0.045)]">
                <h2 className="text-lg font-bold text-[#252C34]">
                  Xác thực tài khoản
                </h2>
                <div className="mt-4 flex gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFF5DF] text-[#B67817]">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#414A53]">
                      Chưa triển khai OTP/email
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#7D858F]">
                      Tính năng xác thực sẽ được bổ sung ở giai đoạn sau.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HomePage() {
  const [authModal, setAuthModal] = useState(null);
  const [accessToken, setAccessToken] = useState(() => getStoredAccessToken());
  const [currentUser, setCurrentUser] = useState(() =>
    getStoredAccessToken() ? undefined : null,
  );
  const [authNotice, setAuthNotice] = useState(null);
  const [currentView, setCurrentView] = useState("home");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!authModal) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setAuthModal(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [authModal]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (accessToken) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
      return;
    }

    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }, [accessToken]);

  useEffect(() => {
    function handleAuthSuccess(event) {
      const nextToken = event.detail?.accessToken ?? "";
      const nextUser = event.detail?.user ?? null;
      const nextMessage = event.detail?.message ?? "Xác thực thành công.";

      setAccessToken(nextToken);
      setCurrentUser(nextUser);
      setAuthNotice({
        type: "success",
        message: nextMessage,
      });
    }

    window.addEventListener("werent-auth-success", handleAuthSuccess);

    return () => {
      window.removeEventListener("werent-auth-success", handleAuthSuccess);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    let isActive = true;

    fetchCurrentUser(accessToken)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setCurrentUser(response.data.user);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setAccessToken("");
        setCurrentUser(null);
        setAuthNotice({
          type: "error",
          message:
            error.message ||
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  function handleLogout() {
    setAccessToken("");
    setCurrentUser(null);
    setCurrentView("home");
    setIsUserMenuOpen(false);
    setAuthNotice({
      type: "success",
      message: "Bạn đã đăng xuất thành công.",
    });
  }

  const isCheckingSession = Boolean(accessToken) && currentUser === undefined;
  const isAdmin = currentUser?.roles?.includes("admin");

  if (currentView === "admin" && currentUser && isAdmin) {
    return (
      <AdminPage
        accessToken={accessToken}
        currentUser={currentUser}
        onBack={() => setCurrentView("home")}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === "profile" && currentUser) {
    return (
      <ProfilePage
        accessToken={accessToken}
        user={currentUser}
        onBack={() => setCurrentView("home")}
        onLogout={handleLogout}
        onUserChange={setCurrentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcf8_0%,#f7f9f4_100%)] text-[#20252F]">
      {authModal ? (
        <AuthModal
          key={authModal}
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitchMode={setAuthModal}
        />
      ) : null}

      <div className="mx-auto max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[22px] border border-[#EEF1EB] bg-white/95 px-4 py-3 shadow-[0_10px_35px_rgba(53,75,61,0.08)] backdrop-blur sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="cursor-pointer flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#3AA657]">
                <Home className="size-5" />
              </span>
              <div>
                <p className="text-[22px] font-bold leading-none text-[#2FAD53]">
                  WeRent
                </p>
                <p className="mt-1 text-[11px] text-[#89909B]">
                  Thuê nhà dễ dàng hơn mỗi ngày
                </p>
              </div>
            </div>
            <div className="relative ml-auto hidden max-w-[420px] flex-1 md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9CA4AD]" />
              <input
                className="h-11 w-full rounded-xl bg-[#F5F7F5] pl-11 pr-4 text-sm outline-none"
                placeholder="Tìm theo địa chỉ, khu vực..."
                type="search"
              />
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-[#404651]">
              {navItems.map((item, index) => (
                <a
                  key={item}
                  className={index === 0 ? "text-[#35A554]" : ""}
                  href="#"
                >
                  {item}
                </a>
              ))}
            </nav>

            {currentUser ? (
              <div className="relative self-end lg:self-auto">
                <button
                  className="flex items-center gap-3 rounded-2xl border border-[#E7EAE7] bg-[#F9FCF9] px-3 py-2 text-right transition hover:border-[#CFE8D4] hover:bg-[#F1F9F2]"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  title="Mở menu tài khoản"
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                >
                  {currentUser.avatarUrl ? (
                    <img
                      alt={`Ảnh đại diện của ${currentUser.fullName}`}
                      className="size-9 rounded-full object-cover"
                      src={currentUser.avatarUrl}
                    />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#DFF2E3] text-[#2D9B4C]">
                      <CircleUserRound className="size-5" />
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold text-[#23313F]">
                      {currentUser.fullName}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#7B858E]">
                      {isAdmin ? "Quản trị viên" : "Người dùng"}
                    </span>
                  </span>
                  <ChevronDown className={`size-4 text-[#77818A] transition ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isUserMenuOpen ? (
                  <div
                    className="absolute right-0 top-[calc(100%+10px)] z-40 w-[245px] overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-2 text-left shadow-[0_18px_45px_rgba(35,54,41,0.16)]"
                    role="menu"
                  >
                    <div className="border-b border-[#EDF0ED] px-3 pb-2 pt-1">
                      <p className="truncate text-xs font-semibold text-[#333B44]">{currentUser.email || currentUser.phone}</p>
                    </div>
                    <button
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4F5963] hover:bg-[#F2F7F3]"
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setCurrentView("profile");
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <CircleUserRound className="size-4 text-[#36A255]" />
                      Thông tin cá nhân
                    </button>
                    {isAdmin ? (
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2D9149] hover:bg-[#EDF7EF]"
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setCurrentView("admin");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <ShieldCheck className="size-4" />
                        Trang quản lý admin
                      </button>
                    ) : null}
                    <button
                      className="mt-1 flex w-full items-center gap-3 border-t border-[#EDF0ED] px-3 py-2.5 pt-3 text-sm font-medium text-[#C04A4A] hover:bg-[#FFF5F5]"
                      role="menuitem"
                      type="button"
                      onClick={handleLogout}
                    >
                      <ArrowRight className="size-4 rotate-180" />
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-3 self-end lg:self-auto">
                <button
                  className="rounded-xl border border-[#E7EAE7] px-4 py-2.5 text-sm font-semibold text-[#2D313A] cursor-pointer"
                  type="button"
                  onClick={() => setAuthModal("login")}
                >
                  Đăng nhập
                </button>
                <button
                  className="cursor-pointer rounded-xl bg-[#35A554] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(53,165,84,0.24)]"
                  type="button"
                  onClick={() => setAuthModal("signup")}
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </header>

        {isCheckingSession ? (
          <div className="mt-4 rounded-2xl border border-[#DDEBFF] bg-[#F5F9FF] px-4 py-3 text-sm text-[#305EAF]">
            Đang kiểm tra phiên đăng nhập của bạn...
          </div>
        ) : null}

        {authNotice ? (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              authNotice.type === "error"
                ? "border border-[#F3D1D1] bg-[#FFF6F6] text-[#B73A3A]"
                : "border border-[#D6EFD7] bg-[#F4FBF5] text-[#217A3B]"
            }`}
          >
            {authNotice.message}
          </div>
        ) : null}

        <section className="mt-6">
          <div className="relative lg:h-[390px] overflow-hidden rounded-[34px] bg-[linear-gradient(90deg,#F8FBF5_0%,#F4F9F3_45%,#EDF3EB_100%)] shadow-[0_18px_50px_rgba(61,91,71,0.08)]">
            <div className="h-full grid items-stretch lg:grid-cols-[1.9fr_1fr]">
              <div className="px-5 pb-24 pr-0 pt-10 sm:px-10 sm:pt-10 lg:px-12 lg:pr-0 lg:pb-30 overflow-visible">
                <h1 className="whitespace-nowrap max-w-[1020px] text-[38px] font-bold leading-[1.12] tracking-[-0.03em] text-[#252A31] sm:text-[52px]">
                  Tìm nơi ở <span className="text-[#35A554]">phù hợp</span>
                  <br />
                  với bạn
                </h1>
                <p className="mt-4 max-w-[520px] text-base text-[#565E69] sm:text-[18px]">
                  Hơn 20.000 bất động sản đang chờ bạn khám phá.
                </p>
              </div>

              <div className="relative h-full min-h-[220px] lg:min-h-[330px]">
                <img
                  alt="Banner WeRent"
                  className="absolute h-full scale-122 object-contain object-center lg:object-right top-[-10px] right-8"
                  src={bannerImg}
                />
              </div>
            </div>
            <div className="absolute bottom-7 w-[70%] z-10 -mt-14 px-1 sm:px-6">
              <div className="relative rounded-[24px] border border-[#EFF1F4] bg-white p-4 shadow-[0_24px_54px_rgba(64,83,72,0.12)] sm:p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#A0A5AF]" />
                  <input
                    className="h-12 w-full rounded-2xl border border-[#E8EAED] bg-[#FFFFFF] pl-11 pr-4 text-sm text-[#38404A] outline-none transition placeholder:text-[#A0A5AF] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                    placeholder="Tìm theo địa chỉ, khu vực, trường học, ..."
                    type="text"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_190px]">
                {searchFilters.map((options) => (
                  <FilterSelect key={options[0]} options={options} />
                ))}
                <button
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35A554] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(53,165,84,0.25)] transition hover:bg-[#2F954B]"
                  type="button"
                >
                  <Search className="size-4" />
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-wrap items-center gap-3">
          {quickFilters.map((filter, index) => {
            const Icon = filter.icon;

            return (
              <button
                key={filter.label}
                className="flex items-center gap-2 rounded-xl border border-[#E8ECE8] bg-white px-4 py-2.5 text-sm font-medium text-[#49505B] shadow-[0_8px_20px_rgba(56,77,62,0.05)] transition hover:border-[#D4EEDB] hover:text-[#35A554]"
                type="button"
              >
                <Icon className="size-4 text-[#35A554]" />
                <span>{filter.label}</span>
                {index === quickFilters.length - 1 ? (
                  <ChevronRight className="size-4 text-[#7D838F]" />
                ) : null}
              </button>
            );
          })}
        </section>

        <section className="mt-8">
          <SectionHeading title="Danh mục nổi bật" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <SectionHeading title="Tin nổi bật" />
          <div className="grid gap-5 xl:grid-cols-3">
            {featuredListings.map((listing) => (
              <PropertyCard key={listing.title} listing={listing} />
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-[#39AA57]" />
            <span className="size-2 rounded-full bg-[#D5D9DE]" />
            <span className="size-2 rounded-full bg-[#D5D9DE]" />
            <span className="size-2 rounded-full bg-[#D5D9DE]" />
          </div>
        </section>

        <section className="mt-10">
          <SectionHeading title="Tin mới nhất" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {latestListings.map((listing) => (
              <MiniPropertyCard key={listing.title} listing={listing} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[22px] border border-[#E5F0E7] bg-[linear-gradient(90deg,#EAF8EC_0%,#F8FCF8_100%)] px-5 py-5 shadow-[0_12px_28px_rgba(62,102,74,0.06)] sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-[20px] bg-white/75 text-[#35A554] shadow-inner">
                <Warehouse className="size-8" />
              </span>
              <div>
                <h3 className="text-[30px] font-bold leading-none text-[#21262F]">
                  Bạn có bất động sản cho thuê?
                </h3>
                <p className="mt-2 text-sm text-[#5B626D]">
                  Đăng tin ngay để tiếp cận hàng nghìn người thuê tiềm năng
                </p>
              </div>
            </div>
            <button
              className="flex items-center justify-center gap-2 rounded-xl bg-[#35A554] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.22)]"
              type="button"
            >
              <ArrowRight className="size-4" />
              Đăng tin ngay
            </button>
          </div>
        </section>

        <footer className="mt-8 rounded-[24px] bg-white px-5 py-8 shadow-[0_10px_28px_rgba(50,72,59,0.06)] sm:px-7">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.05fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#38A756]">
                  <Home className="size-5" />
                </span>
                <div>
                  <p className="text-[22px] font-bold leading-none text-[#33A452]">
                    WeRent
                  </p>
                  <p className="mt-1 text-[11px] text-[#89909B]">
                    Nền tảng nhà ở dành cho bạn
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-[260px] text-sm leading-6 text-[#636A75]">
                Nền tảng kết nối người thuê và chủ nhà nhanh chóng, an toàn và
                tiện lợi.
              </p>
              <div className="mt-4 flex items-center gap-3 text-[#2D323A]">
                <span className="flex size-9 items-center justify-center rounded-full border border-[#E8ECEE] text-[11px] font-semibold uppercase">
                  Fb
                </span>
                <span className="flex size-9 items-center justify-center rounded-full border border-[#E8ECEE] text-[10px] font-semibold uppercase">
                  Ig
                </span>
                <span className="flex size-9 items-center justify-center rounded-full border border-[#E8ECEE] text-[10px] font-semibold uppercase">
                  Yt
                </span>
              </div>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-bold text-[#262B34]">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-[#66707A]">
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-bold text-[#262B34]">Liên hệ</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#66707A]">
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 size-4 text-[#35A554]" />
                  <span>1900 1234</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 size-4 text-[#35A554]" />
                  <span>support@werent.vn</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 text-[#35A554]" />
                  <span>123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-[#F0F2F4] pt-5 text-center text-sm text-[#858B96]">
            © 2025 WeRent. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
