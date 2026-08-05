import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import AdminPage from "./AdminPage";
import bannerImg from "./assets/banner-img.png";
import SharedHeader from "./SharedHeader.jsx";
import {
  changePassword as changePasswordRequest,
  getCurrentUser as fetchCurrentUser,
  getApiBaseUrl,
  login as loginRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
  uploadAvatar as uploadAvatarRequest,
} from "./lib/auth-client";
import { INVALID_PHONE_MESSAGE, normalizeVietnamPhone } from "./lib/phone";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  CarFront,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Heart,
  Home,
  House,
  ImagePlus,
  Info,
  KeyRound,
  Landmark,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Lock,
  PawPrint,
  Phone,
  Plus,
  Ruler,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sofa,
  Store,
  UserRound,
  Video,
  Eye,
  EyeOff,
  Warehouse,
  Wind,
  X,
} from "lucide-react";

const AUTH_TOKEN_STORAGE_KEY = "werent.accessToken";
const DEFAULT_PROPERTY_LOCATION = { lat: 10.7721, lng: 106.6983 };
const MAP_SEARCH_DEBOUNCE_MS = 600;
const MAP_SEARCH_MIN_LENGTH = 3;
const MAP_API_BASE_URL = getApiBaseUrl();
const PROPERTY_MARKER_ICON = L.divIcon({
  className: "",
  html: '<span class="werent-map-marker"></span>',
  iconAnchor: [18, 36],
  iconSize: [36, 36],
});

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

const guestHeaderNavItems = [
  { key: "home", label: "Trang chủ" },
  { key: "postListing", label: "Tin đăng" },
  { key: "support", label: "Hỗ trợ", disabled: true },
  { key: "about", label: "Về chúng tôi", disabled: true },
];

const authenticatedHeaderNavItems = [
  { key: "home", label: "Trang chủ" },
  { key: "postListing", label: "Tin đăng" },
  { key: "favorites", label: "Yêu thích", disabled: true },
  { key: "messages", label: "Tin nhắn", disabled: true },
];

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
].map((listing, index) =>
  buildMarketingListingRecord(listing, "featured", index),
);

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
].map((listing, index) =>
  buildMarketingListingRecord(listing, "latest", index),
);

const ownerListingRecords = [
  {
    id: "LIST-001",
    image: createPlaceholderImage("Căn hộ Q2", "#d7d5c8", "#efe8de"),
    title: "Căn hộ 2PN full nội thất, ban công rộng view sông",
    location: "Quận 2, TP. Hồ Chí Minh",
    price: "12.000.000đ/tháng",
    packageLabel: "Tin Thường • 30 ngày",
    status: "active",
    statusLabel: "Đang hiển thị",
    updatedAt: "05/08/2026",
    metrics: ["1.284 lượt xem", "36 lượt liên hệ", "4 lịch hẹn"],
    draft: {
      propertyType: "Căn hộ chung cư",
      area: "72",
      bedrooms: "2",
      bathrooms: "2",
      rentPrice: "12.000.000",
      furnishing: "Đầy đủ nội thất",
      orientation: "Đông Nam",
      floor: "12",
      totalFloors: "25",
      frontage: "8",
      accessRoad: "12",
      moveInDays: "7",
      waterPrice: "120.000đ/người",
      electricityPrice: "3.500đ/kWh",
      city: "TP. Hồ Chí Minh",
      district: "Quận 2 (TP. Thủ Đức)",
      ward: "Phường An Khánh",
      street: "Đường Nguyễn Cơ Thạch",
      addressLine: "Số 15, Tòa A, Căn 12A",
      projectName: "Vinhomes Metropolis",
      description:
        "Căn hộ 2 phòng ngủ full nội thất, ban công rộng view sông, phù hợp gia đình trẻ hoặc chuyên gia làm việc tại khu Đông.",
      locationNote:
        "Gần cầu Thủ Thiêm, chỉ mất 5 phút đến trung tâm thương mại và tuyến Metro.",
      videoLink: "https://www.youtube.com/watch?v=werent001",
      selectedTier: "standard",
      selectedDuration: "30days",
      selectedAmenities: [
        "airConditioner",
        "washingMachine",
        "wifi",
        "security",
        "camera",
      ],
    },
  },
  {
    id: "LIST-002",
    image: createPlaceholderImage("Studio Bình Thạnh", "#d8e4d3", "#f3efe8"),
    title: "Studio mới xây, gần Landmark 81, hỗ trợ chuyển vào ngay",
    location: "Bình Thạnh, TP. Hồ Chí Minh",
    price: "7.200.000đ/tháng",
    packageLabel: "VIP Bạc • 15 ngày",
    status: "pending",
    statusLabel: "Chờ duyệt",
    updatedAt: "04/08/2026",
    metrics: ["Đang chờ kiểm duyệt", "Ảnh đầy đủ", "Đã lưu nháp 2 lần"],
    draft: {
      propertyType: "Căn hộ dịch vụ",
      area: "35",
      bedrooms: "1",
      bathrooms: "1",
      rentPrice: "7.200.000",
      furnishing: "Nội thất cơ bản",
      orientation: "Nam",
      floor: "8",
      totalFloors: "20",
      frontage: "6",
      accessRoad: "10",
      moveInDays: "3",
      waterPrice: "Theo đồng hồ riêng",
      electricityPrice: "4.000đ/kWh",
      city: "TP. Hồ Chí Minh",
      district: "Quận Bình Thạnh",
      ward: "Phường Bình An",
      street: "Đường Nguyễn Hữu Cảnh",
      addressLine: "Tầng 8, căn S08",
      projectName: "Pearl Plaza Residence",
      description:
        "Studio mới xây, cửa sổ lớn, khu vực an ninh và gần nhiều tiện ích ăn uống - mua sắm.",
      locationNote:
        "Cách Landmark 81 khoảng 700m, thuận tiện di chuyển sang Quận 1 và Thủ Đức.",
      videoLink: "https://www.youtube.com/watch?v=werent002",
      selectedTier: "vipSilver",
      selectedDuration: "15days",
      selectedAmenities: [
        "airConditioner",
        "wifi",
        "bed",
        "security",
        "camera",
      ],
    },
  },
  {
    id: "LIST-003",
    image: createPlaceholderImage("Nhà nguyên căn", "#ddd3c6", "#f3ede5"),
    title: "Nhà nguyên căn 1 trệt 2 lầu, phù hợp nhóm bạn hoặc gia đình",
    location: "Quận 7, TP. Hồ Chí Minh",
    price: "18.500.000đ/tháng",
    packageLabel: "VIP Vàng • 10 ngày",
    status: "hidden",
    statusLabel: "Đã ẩn",
    updatedAt: "01/08/2026",
    metrics: ["842 lượt xem", "18 lượt liên hệ", "Hết hạn sau 2 ngày"],
    draft: {
      propertyType: "Nhà nguyên căn",
      area: "110",
      bedrooms: "4",
      bathrooms: "3",
      rentPrice: "18.500.000",
      furnishing: "Nhà trống",
      orientation: "Tây Bắc",
      floor: "1",
      totalFloors: "3",
      frontage: "5",
      accessRoad: "7",
      moveInDays: "14",
      waterPrice: "Miễn phí",
      electricityPrice: "Theo giá nhà nước",
      city: "TP. Hồ Chí Minh",
      district: "Quận 7",
      ward: "Phường An Phú",
      street: "Đường số 12",
      addressLine: "Số 48/7",
      projectName: "Khu dân cư nội bộ",
      description:
        "Nhà nguyên căn rộng rãi, có sân trước để xe, phù hợp gia đình hoặc nhóm bạn cần không gian riêng tư.",
      locationNote:
        "Nằm trong hẻm xe hơi, gần trường học, chợ và công viên khu dân cư.",
      videoLink: "https://www.youtube.com/watch?v=werent003",
      selectedTier: "vipGold",
      selectedDuration: "10days",
      selectedAmenities: [
        "airConditioner",
        "kitchen",
        "wardrobe",
        "security",
        "park",
      ],
    },
  },
  {
    id: "LIST-004",
    image: createPlaceholderImage("Bản nháp studio", "#d5ddd7", "#f1eee7"),
    title: "Studio gần đại học, đang hoàn thiện nội dung trước khi đăng",
    location: "Thủ Đức, TP. Hồ Chí Minh",
    price: "5.800.000đ/tháng",
    packageLabel: "VIP Kim Cương • 30 ngày",
    status: "draft",
    statusLabel: "Nháp",
    updatedAt: "06/08/2026",
    metrics: [
      "Bản nháp chưa gửi duyệt",
      "Còn thiếu video",
      "Lưu gần nhất 10 phút trước",
    ],
    draft: {
      propertyType: "Chung cư mini",
      area: "28",
      bedrooms: "1",
      bathrooms: "1",
      rentPrice: "5.800.000",
      furnishing: "Nội thất cơ bản",
      orientation: "Đông",
      floor: "5",
      totalFloors: "8",
      frontage: "4.5",
      accessRoad: "6",
      moveInDays: "5",
      waterPrice: "100.000đ/người",
      electricityPrice: "Thỏa thuận",
      city: "TP. Hồ Chí Minh",
      district: "Quận 2 (TP. Thủ Đức)",
      ward: "Phường Thảo Điền",
      street: "Đường Quốc Hương",
      addressLine: "Số 22/8",
      projectName: "Khu căn hộ mini sinh viên",
      description:
        "Studio nhỏ gọn, phù hợp sinh viên hoặc người đi làm cần chỗ ở gần trường và tuyến xe buýt.",
      locationNote:
        "Cách ga Metro khoảng 8 phút đi bộ, gần siêu thị mini và quán cà phê học bài.",
      videoLink: "https://www.youtube.com/watch?v=werent004",
      selectedTier: "vipDiamond",
      selectedDuration: "30days",
      selectedAmenities: ["airConditioner", "wifi", "desk", "security"],
    },
  },
  {
    id: "LIST-005",
    image: createPlaceholderImage("Tin vi phạm", "#e4d6d6", "#f5eaea"),
    title: "Phòng cho thuê đăng sai thông tin và bị từ chối hiển thị",
    location: "Quận 10, TP. Hồ Chí Minh",
    price: "4.900.000đ/tháng",
    packageLabel: "Tin Thường • Đã từ chối",
    status: "rejected",
    statusLabel: "Vi phạm",
    updatedAt: "03/08/2026",
    rejectionReason:
      "Tin đăng bị từ chối vì nội dung mô tả chưa chính xác, có 2 hình ảnh không hợp lệ và cần cập nhật lại trước khi gửi duyệt lại.",
    draft: {
      propertyType: "Phòng trọ",
      area: "22",
      bedrooms: "1",
      bathrooms: "1",
      rentPrice: "4.900.000",
      furnishing: "Nội thất cơ bản",
      orientation: "Bắc",
      floor: "2",
      totalFloors: "4",
      frontage: "4",
      accessRoad: "5",
      moveInDays: "2",
      waterPrice: "120.000đ/người",
      electricityPrice: "4.000đ/kWh",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bình An",
      street: "Đường 3 Tháng 2",
      addressLine: "Số 101/12",
      projectName: "Nhà trọ trung tâm",
      description:
        "Tin đăng cần chỉnh sửa lại nội dung mô tả và thay thế một số hình ảnh chưa đúng quy định hiển thị.",
      locationNote:
        "Gần vòng xoay Dân Chủ, thuận tiện di chuyển sang Quận 3 và Quận 5.",
      videoLink: "",
      selectedTier: "standard",
      selectedDuration: "custom",
      selectedAmenities: ["airConditioner", "wifi", "bed"],
    },
  },
];

const ownerListingPublicDetails = {
  "LIST-001": {
    ownerName: "Nguyễn Minh Khánh",
    ownerPhone: "0901 234 567",
    ownerEmail: "khanh.nguyen@werent.vn",
    ownerLabel: "Chủ nhà đã xác minh",
    availableFrom: "12/08/2026",
    deposit: "24.000.000đ",
    minimumStay: "Tối thiểu 6 tháng",
    maxOccupants: "4 người",
    publishedAt: "05/08/2026",
    expiresAt: "04/09/2026",
    coordinates: { lat: 10.7828, lng: 106.7196 },
    gallery: [
      createPlaceholderImage("Phòng khách Q2", "#d7d5c8", "#efe8de"),
      createPlaceholderImage("Bếp mở Q2", "#d6e2d6", "#f3efe8"),
      createPlaceholderImage("Phòng ngủ master", "#ddd6cc", "#f5eee7"),
    ],
    nearbyPlaces: [
      "Ga Metro Thủ Thiêm cách 700m",
      "Vincom Mega Mall cách 5 phút di chuyển",
      "Công viên ven sông ngay trong khu đô thị",
    ],
    houseRules: [
      "Không hút thuốc trong căn hộ",
      "Cho nuôi thú cưng nhỏ đã tiêm phòng",
      "Ưu tiên khách thuê ở ổn định lâu dài",
    ],
  },
  "LIST-002": {
    ownerName: "Trần Bảo Ngọc",
    ownerPhone: "0918 456 789",
    ownerEmail: "ngoc.tran@werent.vn",
    ownerLabel: "Chủ căn hộ phản hồi nhanh",
    availableFrom: "08/08/2026",
    deposit: "7.200.000đ",
    minimumStay: "Tối thiểu 3 tháng",
    maxOccupants: "2 người",
    publishedAt: "04/08/2026",
    expiresAt: "19/08/2026",
    coordinates: { lat: 10.7954, lng: 106.7218 },
    gallery: [
      createPlaceholderImage("Studio Landmark", "#d8e4d3", "#f3efe8"),
      createPlaceholderImage("Ban công studio", "#d9d6cb", "#f4efe6"),
      createPlaceholderImage("Toilet riêng", "#d5ddd7", "#f1eee7"),
    ],
    nearbyPlaces: [
      "Landmark 81 cách 700m",
      "Bến xe bus nhanh cách 150m",
      "Có siêu thị mini ngay dưới tòa nhà",
    ],
    houseRules: [
      "Giờ giấc tự do, khóa vân tay",
      "Không ở quá 2 người",
      "Có thể dọn vào ở ngay sau khi ký hợp đồng",
    ],
  },
  "LIST-003": {
    ownerName: "Lê Quốc Hưng",
    ownerPhone: "0937 668 889",
    ownerEmail: "hung.le@werent.vn",
    ownerLabel: "Chủ nhà hỗ trợ xem nhà cuối tuần",
    availableFrom: "20/08/2026",
    deposit: "37.000.000đ",
    minimumStay: "Tối thiểu 12 tháng",
    maxOccupants: "6 người",
    publishedAt: "01/08/2026",
    expiresAt: "11/08/2026",
    coordinates: { lat: 10.7351, lng: 106.7191 },
    gallery: [
      createPlaceholderImage("Sân trước", "#ddd3c6", "#f3ede5"),
      createPlaceholderImage("Phòng khách rộng", "#d7dfd2", "#f3efe7"),
      createPlaceholderImage("Khu bếp", "#d8d6ca", "#efe9df"),
    ],
    nearbyPlaces: [
      "Chợ truyền thống cách 500m",
      "Trường học quốc tế trong bán kính 1km",
      "Khu dân cư yên tĩnh, đường ô tô tránh nhau",
    ],
    houseRules: [
      "Phù hợp gia đình hoặc nhóm bạn ở lâu dài",
      "Được phép cải tạo nội thất nhẹ sau khi báo trước",
      "Có thể ký hợp đồng công chứng nếu cần",
    ],
  },
  "LIST-004": {
    ownerName: "Phạm Gia Linh",
    ownerPhone: "0971 220 445",
    ownerEmail: "linh.pham@werent.vn",
    ownerLabel: "Chủ tin ưu tiên khách thuê trí thức",
    availableFrom: "15/08/2026",
    deposit: "11.600.000đ",
    minimumStay: "Tối thiểu 6 tháng",
    maxOccupants: "2 người",
    publishedAt: "06/08/2026",
    expiresAt: "05/09/2026",
    coordinates: { lat: 10.8046, lng: 106.7398 },
    gallery: [
      createPlaceholderImage("Studio Thảo Điền", "#d5ddd7", "#f1eee7"),
      createPlaceholderImage("Góc làm việc", "#d8d2c8", "#f2ece5"),
      createPlaceholderImage("Ban công xanh", "#d7dfd2", "#f3efe7"),
    ],
    nearbyPlaces: [
      "Ga Metro An Phú cách 8 phút đi bộ",
      "Khu cà phê - coworking tập trung quanh dự án",
      "Gần trường quốc tế và nhiều cửa hàng tiện lợi",
    ],
    houseRules: [
      "Không tổ chức tiệc đông người",
      "Ưu tiên người đi làm hoặc chuyên gia nước ngoài",
      "Có thể ký online và giữ chỗ trước 3 ngày",
    ],
  },
  "LIST-005": {
    ownerName: "Đỗ Nhật Nam",
    ownerPhone: "0988 114 223",
    ownerEmail: "nam.do@werent.vn",
    ownerLabel: "Tin cần chỉnh sửa trước khi công khai",
    availableFrom: "Ở ngay",
    deposit: "4.900.000đ",
    minimumStay: "Tối thiểu 2 tháng",
    maxOccupants: "2 người",
    publishedAt: "03/08/2026",
    expiresAt: "Chưa công khai",
    coordinates: { lat: 10.7715, lng: 106.6684 },
    gallery: [
      createPlaceholderImage("Phòng trọ trung tâm", "#e4d6d6", "#f5eaea"),
      createPlaceholderImage("Khu bếp nhỏ", "#ddd3c6", "#f3ede5"),
      createPlaceholderImage("Lối vào", "#d9d7cf", "#f3ede6"),
    ],
    nearbyPlaces: [
      "Vòng xoay Dân Chủ cách 400m",
      "Nhiều hàng quán ăn sáng trong bán kính 200m",
      "Có trạm xe buýt gần đầu hẻm",
    ],
    houseRules: [
      "Cần cập nhật lại ảnh thật trước khi đăng chính thức",
      "Mô tả phải ghi rõ nội thất hiện có",
      "Bổ sung video walkthrough để tăng tỉ lệ duyệt",
    ],
  },
};

const listingStatusTabs = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang hiển thị" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "draft", label: "Nháp" },
  { key: "hidden", label: "Đã ẩn" },
  { key: "rejected", label: "Vi phạm" },
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

function PropertyCard({ listing, onViewListing }) {
  const handleOpen = () => onViewListing?.(listing);

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[20px] border border-[#ECEEF1] bg-white shadow-[0_12px_32px_rgba(39,53,45,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(39,53,45,0.1)]"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
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
          onClick={(event) => event.stopPropagation()}
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
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

function MiniPropertyCard({ listing, onViewListing }) {
  const handleOpen = () => onViewListing?.(listing);

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[18px] border border-[#ECEEF1] bg-white shadow-[0_10px_24px_rgba(39,53,45,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(39,53,45,0.08)]"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
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

const dashboardSidebarSections = [
  {
    title: "Tài khoản",
    items: [
      { key: "profile", icon: UserRound, label: "Thông tin cá nhân" },
      { key: "favorites", icon: Heart, label: "Tin yêu thích", disabled: true },
      {
        key: "appointments",
        icon: CalendarDays,
        label: "Lịch hẹn xem phòng",
        disabled: true,
      },
      {
        key: "messages",
        icon: MessageSquare,
        label: "Tin nhắn",
        disabled: true,
      },
      {
        key: "reviews",
        icon: ShieldCheck,
        label: "Đánh giá của tôi",
        disabled: true,
      },
      {
        key: "reports",
        icon: FileText,
        label: "Báo cáo đã gửi",
        disabled: true,
      },
    ],
  },
  {
    title: "Người cho thuê",
    items: [
      { key: "postListing", icon: FileText, label: "Đăng tin mới" },
      { key: "myListings", icon: Home, label: "Tin đăng của tôi" },
      {
        key: "rentalAppointments",
        icon: CalendarDays,
        label: "Quản lý lịch hẹn",
        disabled: true,
      },
      {
        key: "servicePackages",
        icon: Store,
        label: "Gói dịch vụ của tôi",
        disabled: true,
      },
      {
        key: "wallet",
        icon: CircleDollarSign,
        label: "Ví tiền",
        disabled: true,
      },
    ],
  },
  {
    title: "Cài đặt",
    items: [
      {
        key: "accountSettings",
        icon: Settings,
        label: "Cài đặt tài khoản",
        disabled: true,
      },
    ],
  },
];

const postListingSteps = [
  "Thông tin cơ bản",
  "Vị trí",
  "Hình ảnh & Video",
  "Chọn loại tin",
];
const defaultPostListingStep = 0;
const cityOptions = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"];
const districtOptions = [
  "Quận 2 (TP. Thủ Đức)",
  "Quận 1",
  "Quận Bình Thạnh",
  "Quận 7",
];
const wardOptions = [
  "Phường An Khánh",
  "Phường Thảo Điền",
  "Phường Bình An",
  "Phường An Phú",
];
const mediaPhotoPreviews = [
  {
    id: 1,
    label: "Phòng khách",
    background:
      "linear-gradient(145deg, #9b6d44 0%, #d4b28a 32%, #efe2cf 63%, #6b7f8f 100%)",
  },
  {
    id: 2,
    label: "Phòng ngủ",
    background:
      "linear-gradient(145deg, #7a5a47 0%, #d7bfa6 36%, #f2e5d5 66%, #97a8ba 100%)",
  },
  {
    id: 3,
    label: "Bếp",
    background:
      "linear-gradient(145deg, #8a5d3f 0%, #d7b799 34%, #f7efe5 69%, #bfc8ce 100%)",
  },
  {
    id: 4,
    label: "Phòng ngủ 2",
    background:
      "linear-gradient(145deg, #8b6448 0%, #cfb08f 35%, #efe7df 68%, #869bb2 100%)",
  },
  {
    id: 5,
    label: "Phòng tắm",
    background:
      "linear-gradient(145deg, #d7d7d3 0%, #f5f5f0 36%, #d8dfdf 70%, #b7c1c8 100%)",
  },
  {
    id: 6,
    label: "Ban công",
    background:
      "linear-gradient(145deg, #6b88a0 0%, #97b7d5 30%, #d8ebfb 62%, #3d556c 100%)",
  },
  {
    id: 7,
    label: "Góc làm việc",
    background:
      "linear-gradient(145deg, #87634e 0%, #d8bba2 38%, #f1e2d2 69%, #9d8fa0 100%)",
  },
];
const listingTierOptions = [
  {
    key: "vipDiamond",
    label: "VIP Kim Cương",
    description: "Hiển thị nổi bật nhất",
    multiplier: "X30",
    multiplierNote: "lượt liên hệ\nso với tin thường",
    price: "271.660 đ/ngày",
    tone: "diamond",
  },
  {
    key: "vipGold",
    label: "VIP Vàng",
    description: "Hiển thị nổi bật",
    multiplier: "X15",
    multiplierNote: "lượt liên hệ\nso với tin thường",
    price: "106.730 đ/ngày",
    tone: "gold",
  },
  {
    key: "vipSilver",
    label: "VIP Bạc",
    description: "Hiển thị ưu tiên",
    multiplier: "X8",
    multiplierNote: "lượt liên hệ\nso với tin thường",
    price: "47.050 đ/ngày",
    tone: "silver",
  },
  {
    key: "standard",
    label: "Tin Thường",
    description: "Hiển thị cơ bản",
    price: "2.980 đ/ngày",
    tone: "standard",
  },
];
const listingDurationOptions = [
  {
    key: "custom",
    label: "Tùy chỉnh",
    subtitle: "Chọn ngày bắt đầu\nvà ngày kết thúc",
  },
  {
    key: "10days",
    label: "10 ngày",
    pricePerDay: "3.720 đ/ngày",
    totalPrice: "37.200 đ",
  },
  {
    key: "15days",
    label: "15 ngày",
    saving: "Tiết kiệm 10%",
    pricePerDay: "3.350 đ/ngày",
    oldPrice: "3.720 đ/ngày",
    totalPrice: "50.250 đ",
  },
  {
    key: "30days",
    label: "30 ngày",
    saving: "Tiết kiệm 20%",
    pricePerDay: "2.980 đ/ngày",
    oldPrice: "3.720 đ/ngày",
    totalPrice: "89.400 đ",
  },
];
const scheduleOptions = [
  "Đăng ngay sau khi thanh toán",
  "Đăng sau khi được duyệt",
  "Tự chọn thời gian đăng",
];
const defaultListingDraft = {
  propertyType: "Căn hộ chung cư",
  area: "72",
  bedrooms: "2",
  bathrooms: "2",
  rentPrice: "12.000.000",
  furnishing: "Đầy đủ nội thất",
  orientation: "Đông Nam",
  floor: "12",
  totalFloors: "25",
  frontage: "8",
  accessRoad: "12",
  moveInDays: "7",
  waterPrice: "120.000đ/người",
  electricityPrice: "3.500đ/kWh",
  city: "TP. Hồ Chí Minh",
  district: "Quận 2 (TP. Thủ Đức)",
  ward: "Phường An Khánh",
  street: "Đường Nguyễn Cơ Thạch",
  addressLine: "Số 15, Tòa A, Căn 12A",
  projectName: "Vinhomes Metropolis",
  description: "",
  locationNote: "",
  videoLink: "",
  selectedTier: "standard",
  selectedDuration: "custom",
  selectedAmenities: [
    "airConditioner",
    "washingMachine",
    "wifi",
    "security",
    "camera",
  ],
};

const propertyTypeOptions = [
  "Phòng trọ",
  "Chung cư mini",
  "Căn hộ dịch vụ",
  "Nhà nguyên căn",
  "Mặt bằng kinh doanh",
];

const furnishingOptions = [
  "Nội thất cơ bản",
  "Đầy đủ nội thất",
  "Nhà trống",
  "Cao cấp",
];
const orientationOptions = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Tây Bắc"];
const electricityPriceOptions = [
  "3.500đ/kWh",
  "4.000đ/kWh",
  "Theo giá nhà nước",
  "Thỏa thuận",
];
const waterPriceOptions = [
  "100.000đ/người",
  "120.000đ/người",
  "Theo đồng hồ riêng",
  "Miễn phí",
];
const indoorAmenities = [
  { key: "airConditioner", icon: Wind, label: "Máy lạnh", selected: true },
  { key: "refrigerator", icon: Home, label: "Tủ lạnh" },
  { key: "washingMachine", icon: Save, label: "Máy giặt", selected: true },
  { key: "wifi", icon: MessageSquare, label: "Wi-Fi", selected: true },
  { key: "kitchen", icon: Store, label: "Bếp" },
  { key: "waterHeater", icon: Bath, label: "Nóng lạnh" },
  { key: "bed", icon: BedDouble, label: "Giường" },
  { key: "wardrobe", icon: FileText, label: "Tủ quần áo" },
  { key: "desk", icon: Ruler, label: "Bàn làm việc" },
  { key: "diningTable", icon: Sofa, label: "Bàn ăn" },
  { key: "television", icon: Home, label: "Truyền hình" },
  { key: "microwave", icon: CircleDollarSign, label: "Lò vi sóng" },
];
const areaAmenities = [
  { key: "elevator", icon: Building2, label: "Thang máy" },
  { key: "parkingBasement", icon: CarFront, label: "Hầm để xe" },
  { key: "security", icon: ShieldCheck, label: "Bảo vệ 24/7", selected: true },
  { key: "camera", icon: Camera, label: "Camera an ninh", selected: true },
  { key: "park", icon: Landmark, label: "Công viên" },
  { key: "pool", icon: Bath, label: "Hồ bơi" },
  { key: "gym", icon: Ruler, label: "Phòng gym" },
  { key: "bbq", icon: Store, label: "Khu BBQ" },
  { key: "playground", icon: PawPrint, label: "Sân chơi trẻ em" },
  { key: "convenienceStore", icon: Store, label: "Siêu thị gần" },
  { key: "pharmacy", icon: ShieldCheck, label: "Nhà thuốc gần" },
  { key: "school", icon: UserRound, label: "Trường học gần" },
];

const listingAmenityCatalog = [...indoorAmenities, ...areaAmenities];
const listingAmenityMap = Object.fromEntries(
  listingAmenityCatalog.map((amenity) => [amenity.key, amenity]),
);

function getListingTierOptionByKey(key) {
  return (
    listingTierOptions.find((option) => option.key === key) ??
    listingTierOptions[listingTierOptions.length - 1]
  );
}

function getListingAmenityItems(keys = []) {
  return keys.map((key) => listingAmenityMap[key]).filter(Boolean);
}

function buildListingFullAddress(draft) {
  return [
    draft.addressLine,
    draft.street,
    draft.ward,
    draft.district,
    draft.city,
  ]
    .filter(Boolean)
    .join(", ");
}

function hasValidCoordinates(coordinates) {
  return (
    Number.isFinite(Number(coordinates?.lat)) &&
    Number.isFinite(Number(coordinates?.lng))
  );
}

function createDraftLocation(draft) {
  const fullAddress = buildListingFullAddress(draft);
  const hasCoordinates = hasValidCoordinates(draft.coordinates);

  return {
    addressComponents: draft.addressComponents ?? [],
    displayName: draft.displayName ?? draft.projectName ?? "",
    formattedAddress: draft.formattedAddress ?? fullAddress,
    isPinAdjusted: Boolean(draft.isPinAdjusted),
    lat: hasCoordinates
      ? Number(draft.coordinates.lat)
      : DEFAULT_PROPERTY_LOCATION.lat,
    lng: hasCoordinates
      ? Number(draft.coordinates.lng)
      : DEFAULT_PROPERTY_LOCATION.lng,
    mapProvider: draft.mapProvider ?? "",
    placeId: draft.placeId ?? null,
    searchText: draft.formattedAddress ?? fullAddress,
  };
}

function formatCoordinate(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "--";
}

function buildMapApiUrl(path, params = {}) {
  const baseUrl =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${MAP_API_BASE_URL}${path}`, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function requestMapApi(path, params, signal) {
  const response = await fetch(buildMapApiUrl(path, params), { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể kết nối dịch vụ bản đồ.");
  }

  return payload?.data ?? {};
}

async function fetchMapAutocomplete(params, signal) {
  const data = await requestMapApi("/api/maps/autocomplete", params, signal);
  return data.places ?? [];
}

async function fetchMapReverse(params, signal) {
  const data = await requestMapApi("/api/maps/reverse", params, signal);
  return data.place ?? null;
}

function getListingStatusClassName(status) {
  if (status === "active") {
    return "border-[#D8EEDC] bg-[#F4FBF5] text-[#238C43]";
  }

  if (status === "pending") {
    return "border-[#F7E2BC] bg-[#FFF9EE] text-[#B7791F]";
  }

  if (status === "draft") {
    return "border-[#D8E5FF] bg-[#F5F8FF] text-[#3A63C7]";
  }

  if (status === "rejected") {
    return "border-[#F2D4D4] bg-[#FFF3F3] text-[#C23B3B]";
  }

  return "border-[#E4E8EC] bg-[#F7F9FB] text-[#5B6673]";
}

function getEmbeddedVideoUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        const shortId = parsedUrl.pathname.split("/")[2];
        return shortId ? `https://www.youtube.com/embed/${shortId}` : "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function buildListingMediaItems(listing, detail, draft) {
  const gallery = detail.gallery?.length
    ? detail.gallery
    : [listing.image, listing.image, listing.image];
  const imageItems = gallery.map((image, index) => ({
    key: `image-${index}`,
    type: "image",
    title: `Ảnh ${index + 1}`,
    src: image,
    thumb: image,
  }));

  if (!draft.videoLink) {
    return imageItems;
  }

  return [
    ...imageItems,
    {
      key: "video",
      type: "video",
      title: "Video",
      src: draft.videoLink,
      embedUrl: getEmbeddedVideoUrl(draft.videoLink),
      thumb: gallery[0] ?? listing.image,
    },
  ];
}

function buildMarketingListingRecord(listing, source, index) {
  const locationParts = (listing.location ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = locationParts.at(-1) ?? "TP. Hồ Chí Minh";
  const district = locationParts[0] ?? "Khu vực trung tâm";
  const areaValue =
    listing.area?.match(/\d+/)?.[0] ?? listing.meta?.match(/\d+/)?.[0] ?? "30";
  const bathroomsValue =
    listing.meta?.match(/(\d+)\s*WC/i)?.[1] ??
    listing.specs?.[0]?.match(/\d+/)?.[0] ??
    "1";
  const furnishing = listing.specs?.[1] ?? "Đang cập nhật";
  const gallery = [listing.image, listing.image, listing.image];

  return {
    ...listing,
    id: listing.id ?? `${source}-${index + 1}`,
    status: "active",
    statusLabel: "Đang hiển thị",
    packageLabel: source === "featured" ? "Tin nổi bật" : "Tin mới nhất",
    detail: {
      ownerName: listing.owner ?? "Chủ nhà",
      ownerPhone: "0900 123 456",
      ownerLabel: source === "featured" ? "Tin nổi bật" : "Tin mới nhất",
      availableFrom: "Nhận nhà ngay",
      deposit: "Thỏa thuận",
      minimumStay: "Trao đổi trực tiếp",
      maxOccupants: "2 - 4 người",
      publishedAt: "Hôm nay",
      expiresAt: "30 ngày tới",
      coordinates: { lat: null, lng: null },
      gallery,
      nearbyPlaces: [district, city, "Liên hệ để xem nhà"],
      houseRules: ["Trao đổi trực tiếp khi xem nhà"],
    },
    draft: {
      propertyType:
        source === "featured" ? "Căn hộ / Studio" : "Phòng trọ / Căn hộ mini",
      area: areaValue,
      bedrooms: "1",
      bathrooms: bathroomsValue,
      rentPrice: listing.price?.replace(/[^\d]/g, "") ?? "",
      furnishing,
      orientation: "Đang cập nhật",
      floor: "",
      totalFloors: "",
      frontage: "",
      accessRoad: "",
      moveInDays: "7",
      waterPrice: "Thỏa thuận",
      electricityPrice: "Thỏa thuận",
      city,
      district,
      ward: "",
      street: "",
      addressLine: listing.title,
      projectName: source === "featured" ? "Tin nổi bật" : "Tin mới nhất",
      description: listing.title,
      locationNote: listing.location,
      videoLink: "",
      selectedTier: "standard",
      selectedDuration: "30days",
      selectedAmenities: [],
    },
  };
}

function ZaloMark({ className = "size-5" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#0068FF" />
      <path
        d="M17 20.5H47L33.5 43.5H46.5"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 43.5L32.5 20.5"
        stroke="#BFD7FF"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[2px]">
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

function AccountSidebar({ activeKey, onLogout, onNavigate }) {
  return (
    <aside className="h-fit rounded-[22px] border border-[#E9ECE8] bg-white p-3 shadow-[0_10px_30px_rgba(46,72,54,0.05)]">
      {dashboardSidebarSections.map((section) => (
        <div key={section.title} className="first:mt-0 mt-4">
          <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9097A0]">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map(({ disabled, icon: Icon, key, label }) => {
              const isActive = key === activeKey;

              return (
                <button
                  key={key}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? "bg-[#EDF8EF] font-semibold text-[#2E9C4D]"
                      : disabled
                        ? "cursor-not-allowed text-[#A1A8B1]"
                        : "cursor-pointer text-[#69727C] hover:bg-[#F7FAF7] hover:text-[#2E9C4D]"
                  }`}
                  disabled={disabled}
                  type="button"
                  onClick={() => onNavigate?.(key)}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#D05252] transition hover:bg-[#FFF5F5]"
        type="button"
        onClick={onLogout}
      >
        <ArrowRight className="size-4 rotate-180" />
        Đăng xuất
      </button>
    </aside>
  );
}

function ListingField({ children, label, required }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#29313B]">
        {label}
        {required ? <span className="text-[#D45252]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function ListingInput({
  defaultValue,
  label,
  placeholder,
  readOnly = false,
  required = false,
  suffix,
  type = "text",
}) {
  return (
    <ListingField label={label} required={required}>
      <div className="relative">
        <input
          className={`h-12 w-full rounded-xl border border-[#E2E7E3] bg-white px-4 text-sm outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15 ${
            suffix ? "pr-18" : "pr-4"
          } ${readOnly ? "bg-[#F7FAF7] text-[#68717C]" : ""}`}
          defaultValue={defaultValue}
          placeholder={placeholder}
          readOnly={readOnly}
          type={type}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#7F8791]">
            {suffix}
          </span>
        ) : null}
      </div>
    </ListingField>
  );
}

function ListingSelect({
  defaultValue = "",
  label,
  options,
  placeholder,
  required = false,
}) {
  return (
    <ListingField label={label} required={required}>
      <div className="relative">
        <select
          className="h-12 w-full appearance-none rounded-xl border border-[#E2E7E3] bg-white px-4 pr-10 text-sm text-[#38404A] outline-none transition focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
          defaultValue={defaultValue}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#8E939E]" />
      </div>
    </ListingField>
  );
}

function ListingCounterTextarea({
  label,
  maxLength,
  onChange,
  placeholder,
  rows = 4,
  value,
}) {
  return (
    <ListingField label={label}>
      <div className="relative">
        <textarea
          className="min-h-[108px] w-full resize-none rounded-xl border border-[#E2E7E3] bg-white px-4 py-3 pr-16 text-sm outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
          maxLength={maxLength}
          placeholder={placeholder}
          rows={rows}
          value={value}
          onChange={onChange}
        />
        <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-medium text-[#98A0AA]">
          {value.length}/{maxLength}
        </span>
      </div>
    </ListingField>
  );
}

function ListingHint({ children, icon: Icon = MapPin, tone = "success" }) {
  const toneClassName =
    tone === "success"
      ? "border-[#E3F3E5] bg-[#F7FCF8] text-[#2F9C50]"
      : "border-[#E7EAEE] bg-[#FAFBFC] text-[#5C6672]";

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${toneClassName}`}
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-white/80 text-current">
        <Icon className="size-3.5" />
      </span>
      <span>{children}</span>
    </div>
  );
}

function ListingCounterInput({
  maxLength,
  onChange,
  placeholder,
  required,
  value,
}) {
  return (
    <ListingField label="Tiêu đề tin đăng" required={required}>
      <div className="relative">
        <input
          className="h-12 w-full rounded-xl border border-[#E2E7E3] bg-white px-4 pr-16 text-sm outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
          maxLength={maxLength}
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={onChange}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#98A0AA]">
          {value.length}/{maxLength}
        </span>
      </div>
    </ListingField>
  );
}

function ListingEditor({ maxLength, onChange, value }) {
  const toolbarItems = [
    "B",
    "I",
    "U",
    "S",
    "•",
    "1.",
    "≡",
    "↩",
    "🔗",
    "🖼",
    "☺",
  ];

  return (
    <ListingField label="Mô tả chi tiết" required>
      <div className="overflow-hidden rounded-xl border border-[#E2E7E3] bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-[#EEF1F4] px-3 py-2">
          {toolbarItems.map((item, index) => (
            <button
              key={`${item}-${index}`}
              className="flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold text-[#66707A] transition hover:bg-[#F4F7F5]"
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea
            className="min-h-[120px] w-full resize-none border-0 px-4 py-3 pr-16 text-sm outline-none placeholder:text-[#A0A7B1]"
            maxLength={maxLength}
            placeholder="Mô tả chi tiết về bất động sản, nội thất, tiện ích, vị trí, điểm nổi bật..."
            rows={5}
            value={value}
            onChange={onChange}
          />
          <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-medium text-[#98A0AA]">
            {value.length}/{maxLength}
          </span>
        </div>
      </div>
    </ListingField>
  );
}

function AmenityOption({ amenity, isSelected, onToggle }) {
  const Icon = amenity.icon;

  return (
    <button
      className={`flex h-11 items-center gap-3 rounded-xl border px-3 text-left text-sm transition ${
        isSelected
          ? "border-[#69C47B] bg-[#F3FBF4] text-[#238C43]"
          : "border-[#E5E8ED] bg-white text-[#49505B] hover:border-[#CFE3D3]"
      }`}
      type="button"
      onClick={() => onToggle(amenity.key)}
    >
      <span
        className={`flex size-5 items-center justify-center rounded-md ${
          isSelected ? "text-[#2BA24B]" : "text-[#79838E]"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1 truncate">{amenity.label}</span>
      {isSelected ? (
        <span className="flex size-4 items-center justify-center rounded-full bg-[#2BA24B] text-[10px] font-bold text-white">
          ✓
        </span>
      ) : null}
    </button>
  );
}

function AmenityGroup({ amenities, selectedAmenities, title, onToggle }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#27313A]">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {amenities.map((amenity) => (
          <AmenityOption
            key={amenity.key}
            amenity={amenity}
            isSelected={selectedAmenities.includes(amenity.key)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function ListingProgress({ activeStep = 0 }) {
  return (
    <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between">
      {postListingSteps.map((step, index) => {
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        const isLast = index === postListingSteps.length - 1;

        return (
          <div key={step} className="flex flex-1 items-center gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                isCompleted || isActive
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#F1F3F6] text-[#7B838E]"
              }`}
            >
              {isCompleted ? "✓" : index + 1}
            </span>
            <span
              className={`shrink-0 text-sm font-semibold ${
                isCompleted || isActive ? "text-[#16A34A]" : "text-[#69717B]"
              }`}
            >
              {step}
            </span>
            {!isLast ? (
              <span
                className={`hidden h-px flex-1 lg:block ${
                  index < activeStep ? "bg-[#6BC47D]" : "bg-[#DDE5DE]"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PostListingStepFooter({
  canGoBack,
  canGoNext,
  nextLabel = "Tiếp tục",
  onBackStep,
  onNextStep,
  showNextArrow = true,
}) {
  return (
    <>
      <div className="flex flex-col gap-3 border-t border-[#EDF1ED] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="h-12 rounded-xl border border-[#BFE0C6] px-6 text-sm font-semibold text-[#2F9C50] transition hover:bg-[#F4FBF5]"
          type="button"
        >
          Lưu nháp
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className={`h-12 rounded-xl border px-6 text-sm font-semibold transition ${
              canGoBack
                ? "border-[#D8E5DA] text-[#355C41] hover:bg-[#F6FAF7]"
                : "cursor-not-allowed border-[#E6EBE7] bg-[#F7F8F8] text-[#A6AFB7]"
            }`}
            disabled={!canGoBack}
            type="button"
            onClick={onBackStep}
          >
            Quay lại
          </button>
          <button
            className={`flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-semibold text-white shadow-[0_14px_25px_rgba(50,164,82,0.22)] transition ${
              canGoNext
                ? "bg-[#35A554] hover:bg-[#2C9349]"
                : "cursor-not-allowed bg-[#A9D9B5] shadow-none"
            }`}
            disabled={!canGoNext}
            type="button"
            onClick={onNextStep}
          >
            {nextLabel}
            {showNextArrow ? <ArrowRight className="size-4" /> : null}
          </button>
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-[#8A919B]">
        <Lock className="size-3.5 text-[#7E8791]" />
        Tin đăng của bạn sẽ được kiểm duyệt trước khi hiển thị công khai.
      </p>
    </>
  );
}

function PostListingBasicInfoStep({
  canGoBack,
  canGoNext,
  draftValues,
  listingDescription,
  listingTitle,
  onBackStep,
  onDescriptionChange,
  onNextStep,
  onTitleChange,
  selectedAmenities,
  toggleAmenity,
}) {
  return (
    <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
      <div>
        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#1F252D]">
          Thông tin cơ bản
        </h2>
        <p className="mt-2 text-sm text-[#69717B]">
          Cung cấp thông tin chi tiết về bất động sản của bạn.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <ListingCounterInput
          maxLength={100}
          placeholder="Nhập tiêu đề tin đăng (tối đa 100 ký tự)"
          required
          value={listingTitle}
          onChange={onTitleChange}
        />

        <ListingEditor
          maxLength={2000}
          value={listingDescription}
          onChange={onDescriptionChange}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ListingSelect
            defaultValue={draftValues.propertyType}
            label="Loại bất động sản"
            options={["Căn hộ chung cư", ...propertyTypeOptions]}
            placeholder="Chọn loại bất động sản"
            required
          />
          <ListingInput
            defaultValue={draftValues.area}
            label="Diện tích"
            required
            suffix="m²"
            type="text"
          />
          <ListingInput
            defaultValue={draftValues.bedrooms}
            label="Số phòng ngủ"
            required
            type="text"
          />
          <ListingInput
            defaultValue={draftValues.bathrooms}
            label="Số phòng tắm"
            required
            type="text"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-1">
            <ListingInput
              defaultValue={draftValues.rentPrice}
              label="Giá cho thuê"
              required
              suffix="đ / tháng"
              type="text"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ListingSelect
            defaultValue={draftValues.furnishing}
            label="Tình trạng nội thất"
            options={furnishingOptions}
            placeholder="Chọn tình trạng nội thất"
          />
          <ListingSelect
            defaultValue={draftValues.orientation}
            label="Hướng nhà"
            options={orientationOptions}
            placeholder="Chọn hướng nhà"
          />
          <ListingInput
            defaultValue={draftValues.floor}
            label="Tầng"
            placeholder="Nhập tầng"
            type="text"
          />
          <ListingInput
            defaultValue={draftValues.totalFloors}
            label="Tổng số tầng"
            placeholder="Nhập tổng số tầng"
            type="text"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ListingInput
            defaultValue={draftValues.frontage}
            label="Mặt tiền"
            placeholder="Nhập mặt tiền"
            suffix="m"
          />
          <ListingInput
            defaultValue={draftValues.accessRoad}
            label="Đường vào"
            placeholder="Nhập đường vào"
            suffix="m"
          />
          <ListingInput
            defaultValue={draftValues.moveInDays}
            label="Thời gian vào ở dự kiến"
            placeholder="Nhập số ngày"
            type="text"
          />
          <ListingSelect
            defaultValue={draftValues.waterPrice}
            label="Giá nước"
            options={waterPriceOptions}
            placeholder="Chọn giá nước"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-1">
            <ListingSelect
              defaultValue={draftValues.electricityPrice}
              label="Giá điện"
              options={electricityPriceOptions}
              placeholder="Chọn giá điện"
            />
          </div>
        </div>

        <AmenityGroup
          amenities={indoorAmenities}
          selectedAmenities={selectedAmenities}
          title="Tiện ích trong nhà"
          onToggle={toggleAmenity}
        />

        <AmenityGroup
          amenities={areaAmenities}
          selectedAmenities={selectedAmenities}
          title="Tiện ích tòa nhà / khu vực"
          onToggle={toggleAmenity}
        />

        <PostListingStepFooter
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onBackStep={onBackStep}
          onNextStep={onNextStep}
        />
      </div>
    </section>
  );
}

function LocationSelectionSummary({ location }) {
  return (
    <div className="grid gap-3 rounded-[18px] border border-[#E7ECE8] bg-[#FCFDFC] p-4 text-sm md:grid-cols-[minmax(0,1fr)_220px] md:items-start [&>div:nth-child(2)]:md:text-right [&>div:nth-child(3)]:hidden">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-[#8A949F]">
          Địa chỉ đã chọn
        </p>
        <p className="mt-1 line-clamp-2 font-semibold text-[#27313A]">
          {location.formattedAddress || "Chưa chọn vị trí"}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-[#8A949F]">Tọa độ</p>
        <p className="mt-1 font-semibold text-[#27313A]">
          {formatCoordinate(location.lat)}, {formatCoordinate(location.lng)}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-[#8A949F]">
          Nguồn vị trí
        </p>
        <p className="mt-1 font-semibold text-[#27313A]">
          {location.placeId
            ? "Geoapify"
            : location.isPinAdjusted
              ? "Ghim thủ công"
              : "Mặc định"}
        </p>
      </div>
    </div>
  );
}

function MapPositionSync({ location }) {
  const map = useMap();

  useEffect(() => {
    map.setView([location.lat, location.lng], Math.max(map.getZoom(), 15), {
      animate: true,
    });
  }, [location.lat, location.lng, map]);

  return null;
}

function DraggablePropertyMarker({
  location,
  onManualPositionChange,
  onNoticeChange,
}) {
  const markerRef = useRef(null);
  const markerPosition = useMemo(
    () => [location.lat, location.lng],
    [location.lat, location.lng],
  );
  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;

        if (!marker) {
          return;
        }

        const nextPosition = marker.getLatLng();
        onManualPositionChange({
          lat: nextPosition.lat,
          lng: nextPosition.lng,
        });
      },
    }),
    [onManualPositionChange],
  );

  useMapEvents({
    click(event) {
      onManualPositionChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
      onNoticeChange("Đã chọn vị trí mới trên bản đồ.");
    },
  });

  return (
    <Marker
      draggable
      eventHandlers={markerEvents}
      icon={PROPERTY_MARKER_ICON}
      position={markerPosition}
      ref={markerRef}
    />
  );
}

function GeoapifyLeafletLocationPicker({ location, onLocationChange }) {
  const [query, setQuery] = useState(
    location.searchText || location.formattedAddress || "",
  );
  const [predictions, setPredictions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [selectionStatus, setSelectionStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const autocompleteAbortRef = useRef(null);
  const autocompleteCacheRef = useRef(new Map());
  const lastSelectedQueryRef = useRef("");
  const locationRef = useRef(location);
  const onLocationChangeRef = useRef(onLocationChange);
  const reverseAbortRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (searchBoxRef.current?.contains(event.target)) {
        return;
      }

      setIsSuggestionsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (
      trimmedQuery.length < MAP_SEARCH_MIN_LENGTH ||
      trimmedQuery === lastSelectedQueryRef.current
    ) {
      return undefined;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      const cacheKey = `${trimmedQuery.toLowerCase()}|${formatCoordinate(locationRef.current.lat)}|${formatCoordinate(locationRef.current.lng)}`;
      const cachedPredictions = autocompleteCacheRef.current.get(cacheKey);

      if (cachedPredictions) {
        setPredictions(cachedPredictions);
        setSearchStatus(cachedPredictions.length > 0 ? "ready" : "empty");
        setIsSuggestionsOpen(cachedPredictions.length > 0);
        return;
      }

      autocompleteAbortRef.current?.abort();
      const abortController = new AbortController();
      autocompleteAbortRef.current = abortController;
      setSearchStatus("loading");

      fetchMapAutocomplete(
        {
          lat: locationRef.current.lat,
          limit: 6,
          lng: locationRef.current.lng,
          query: trimmedQuery,
        },
        abortController.signal,
      )
        .then((nextPredictions) => {
          if (!isActive) {
            return;
          }

          const normalizedPredictions = nextPredictions.slice(0, 6);
          autocompleteCacheRef.current.set(cacheKey, normalizedPredictions);
          setPredictions(normalizedPredictions);
          setSearchStatus(normalizedPredictions.length > 0 ? "ready" : "empty");
          setIsSuggestionsOpen(normalizedPredictions.length > 0);
        })
        .catch((error) => {
          if (!isActive || error.name === "AbortError") {
            return;
          }

          setPredictions([]);
          setSearchStatus("error");
          setNotice(error.message);
        });
    }, MAP_SEARCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function applySelectedPlace(place, isPinAdjusted = false) {
    const nextLocation = {
      addressComponents: place.addressComponents ?? {},
      displayName: place.displayName,
      formattedAddress: place.formattedAddress,
      isPinAdjusted,
      lat: place.lat,
      lng: place.lng,
      mapProvider: "geoapify",
      placeId: place.placeId,
      searchText: place.formattedAddress,
    };

    lastSelectedQueryRef.current = nextLocation.formattedAddress;
    setQuery(nextLocation.formattedAddress);
    setPredictions([]);
    setIsSuggestionsOpen(false);
    setSelectionStatus("ready");
    onLocationChangeRef.current(nextLocation);
  }

  function selectPrediction(prediction) {
    if (!prediction) {
      return;
    }

    setSelectionStatus("loading");
    setNotice("Đã chọn vị trí từ Geoapify.");
    applySelectedPlace(prediction, false);
  }

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (predictions.length > 0) {
      selectPrediction(predictions[0]);
    }
  }

  function handleQueryChange(event) {
    const nextQuery = event.target.value;
    lastSelectedQueryRef.current = "";
    setQuery(nextQuery);
    setIsSuggestionsOpen(predictions.length > 0);

    if (nextQuery.trim().length < MAP_SEARCH_MIN_LENGTH) {
      autocompleteAbortRef.current?.abort();
      setPredictions([]);
      setIsSuggestionsOpen(false);
      setSearchStatus("idle");
    }
  }

  function handleSearchFocus() {
    if (predictions.length > 0) {
      setIsSuggestionsOpen(true);
    }
  }

  function reverseLookup(nextPosition) {
    reverseAbortRef.current?.abort();
    const abortController = new AbortController();
    reverseAbortRef.current = abortController;
    setSelectionStatus("loading");

    fetchMapReverse(nextPosition, abortController.signal)
      .then((place) => {
        if (!place) {
          setSelectionStatus("ready");
          return;
        }

        applySelectedPlace(
          {
            ...place,
            lat: nextPosition.lat,
            lng: nextPosition.lng,
          },
          true,
        );
        setNotice("Đã cập nhật địa chỉ gần vị trí ghim.");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }

        setSelectionStatus("error");
        setNotice("Đã đổi tọa độ ghim, nhưng chưa lấy được địa chỉ gần nhất.");
      });
  }

  function handleManualPositionChange(nextPosition) {
    const nextLocation = {
      ...locationRef.current,
      isPinAdjusted: true,
      lat: nextPosition.lat,
      lng: nextPosition.lng,
      mapProvider: "geoapify",
    };

    onLocationChangeRef.current(nextLocation);
    setNotice("Đã cập nhật tọa độ theo vị trí ghim.");
    reverseLookup(nextPosition);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div ref={searchBoxRef} className="relative z-[1200]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#97A0AA]" />
            <input
              className="h-12 w-full rounded-2xl border border-[#E2E7E3] bg-white pl-11 pr-12 text-sm text-[#38404A] shadow-[0_12px_30px_rgba(26,40,34,0.08)] outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
              placeholder="Tìm địa điểm, tòa nhà, tên đường..."
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
            />
            {searchStatus === "loading" || selectionStatus === "loading" ? (
              <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#35A554]" />
            ) : null}
          </div>

          {isSuggestionsOpen && predictions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-[1200] mt-2 max-h-[260px] overflow-auto rounded-2xl border border-[#E2E7E3] bg-white shadow-[0_16px_36px_rgba(26,40,34,0.12)]">
              {predictions.map((prediction) => (
                <button
                  key={prediction.placeId}
                  className="flex w-full items-start gap-3 border-b border-[#F0F3F1] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#F7FCF8]"
                  type="button"
                  onClick={() => selectPrediction(prediction)}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#35A554]" />
                  <span>
                    <span className="block text-sm font-semibold text-[#27313A]">
                      {prediction.displayName}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#737D88]">
                      {prediction.formattedAddress}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {searchStatus === "empty" ? (
            <div className="mt-2 rounded-2xl border border-[#F1E3BF] bg-[#FFF9EE] px-4 py-3 text-sm text-[#9A6A16] shadow-sm">
              Không tìm thấy gợi ý phù hợp. Hãy thử thêm quận, phường hoặc thành
              phố.
            </div>
          ) : null}

          {searchStatus === "error" ? (
            <div className="mt-2 rounded-2xl border border-[#F2D4D4] bg-[#FFF3F3] px-4 py-3 text-sm text-[#B73A3A] shadow-sm">
              Không thể tải gợi ý bản đồ lúc này. Bạn vẫn có thể nhập địa chỉ
              thủ công.
            </div>
          ) : null}
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[20px] border border-[#E2E7E3] bg-[#EEF3F1]">
          <MapContainer
            center={[location.lat, location.lng]}
            className="h-[420px] w-full"
            scrollWheelZoom
            zoom={15}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapPositionSync location={location} />
            <DraggablePropertyMarker
              location={location}
              onManualPositionChange={handleManualPositionChange}
              onNoticeChange={setNotice}
            />
          </MapContainer>
        </div>
      </div>

      {notice ? <ListingHint icon={Info}>{notice}</ListingHint> : null}

      <LocationSelectionSummary location={location} />
    </div>
  );
}
function PostListingLocationStep({
  canGoBack,
  canGoNext,
  draftValues,
  listingLocation,
  locationNote,
  onBackStep,
  onListingLocationChange,
  onLocationNoteChange,
  onNextStep,
}) {
  return (
    <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-10 items-center justify-center rounded-2xl bg-[#EDF8EF] text-[#2F9C50]">
          <MapPin className="size-5" />
        </span>
        <div>
          <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#1F252D]">
            Vị trí của bất động sản
          </h2>
          <p className="hidden">
            Vui lòng cung cấp địa chỉ chính xác của bất động sản để người thuê
            dễ dàng tìm thấy.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-5">
        <GeoapifyLeafletLocationPicker
          location={listingLocation}
          onLocationChange={onListingLocationChange}
        />

        <ListingHint>
          Kéo ghim hoặc nhấp vào bản đồ để chọn vị trí chính xác.
        </ListingHint>

        <div>
          <h3 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
            Địa chỉ
          </h3>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <ListingSelect
                defaultValue={draftValues.city}
                label="Tỉnh / Thành phố"
                options={cityOptions}
                placeholder="Chọn tỉnh / thành phố"
                required
              />
              <ListingSelect
                defaultValue={draftValues.district}
                label="Quận / Huyện"
                options={districtOptions}
                placeholder="Chọn quận / huyện"
                required
              />
              <ListingSelect
                defaultValue={draftValues.ward}
                label="Phường / Xã"
                options={wardOptions}
                placeholder="Chọn phường / xã"
                required
              />
            </div>

            <ListingInput
              defaultValue={draftValues.street}
              label="Đường / Phố"
              placeholder="Nhập đường / phố"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ListingInput
                defaultValue={draftValues.addressLine}
                label="Địa chỉ chi tiết"
                placeholder="Nhập số nhà, khu phố, ngõ hẻm, căn hộ..."
              />
              <ListingInput
                defaultValue={draftValues.projectName}
                label="Tên tòa nhà / Dự án (nếu có)"
                placeholder="Nhập tên tòa nhà / dự án"
              />
            </div>

            <ListingCounterTextarea
              label="Ghi chú vị trí (không bắt buộc)"
              maxLength={200}
              placeholder="Ví dụ: Gần cầu Thủ Thiêm, đối diện công viên, hẻm lớn ô tô vào được..."
              rows={3}
              value={locationNote}
              onChange={onLocationNoteChange}
            />
          </div>
        </div>

        <ListingHint>
          Địa chỉ chi tiết giúp người thuê dễ dàng tìm thấy bất động sản của
          bạn.
        </ListingHint>

        <PostListingStepFooter
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onBackStep={onBackStep}
          onNextStep={onNextStep}
        />
      </div>
    </section>
  );
}

function MediaPreviewCard({ preview }) {
  return (
    <div className="group relative aspect-[1.02] overflow-hidden rounded-[18px] border border-[#E2E7E3] bg-white shadow-[0_10px_24px_rgba(36,54,43,0.08)]">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: preview.background }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,26,32,0.04),rgba(18,26,32,0.28))]" />
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
        <span className="flex size-6 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-white shadow-sm">
          {preview.id}
        </span>
        <button
          className="flex size-6 items-center justify-center rounded-full bg-white/95 text-[#7B838E] shadow-sm transition hover:bg-white hover:text-[#27313A]"
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="absolute inset-x-4 bottom-4">
        <div className="rounded-2xl bg-white/88 px-3 py-2 text-xs font-semibold text-[#2B3440] shadow-[0_6px_16px_rgba(22,35,28,0.08)] backdrop-blur-sm">
          {preview.label}
        </div>
      </div>
    </div>
  );
}

function PostListingMediaStep({
  canGoBack,
  canGoNext,
  onBackStep,
  onNextStep,
  onVideoLinkChange,
  videoLink,
}) {
  return (
    <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
      <div>
        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#1F252D]">
          Hình ảnh
        </h2>
        <p className="mt-2 text-sm text-[#69717B]">
          Đăng tải hình ảnh thực tế để tin đăng thu hút hơn.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-2 rounded-2xl border border-[#E2F2E6] bg-[#F7FCF8] px-4 py-3 text-sm text-[#2F9C50]">
          <Info className="size-4 shrink-0" />
          <span>
            Nên đăng ít nhất 5 hình ảnh rõ nét, đa dạng góc chụp (tối đa 15
            ảnh).
          </span>
        </div>

        <div className="rounded-[24px] border border-dashed border-[#CFD8D3] bg-[#FBFCFB] px-6 py-10 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#F0F4F1] text-[#1F252D]">
            <ImagePlus className="size-8" />
          </span>
          <p className="mt-4 text-sm font-medium text-[#28323C]">
            Kéo thả ảnh vào đây
          </p>
          <p className="mt-1 text-sm text-[#7A828C]">hoặc</p>
          <button
            className="mt-4 h-11 rounded-xl bg-[#35A554] px-5 text-sm font-semibold text-white transition hover:bg-[#2C9349]"
            type="button"
          >
            Chọn ảnh từ thiết bị
          </button>
          <p className="mt-4 text-xs text-[#8A919B]">
            Định dạng: JPG, PNG, Kích thước tối đa 10MB/ảnh
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mediaPhotoPreviews.map((preview) => (
            <MediaPreviewCard key={preview.id} preview={preview} />
          ))}

          <button
            className="flex aspect-[1.02] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-[#D7DFDB] bg-[#FBFCFB] text-[#5D6671] transition hover:border-[#BFD4C3] hover:bg-[#F7FAF7]"
            type="button"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-[#27313A] shadow-sm">
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-medium">Thêm ảnh</span>
          </button>
        </div>

        <p className="text-sm text-[#7B838E]">
          * Kéo thả để sắp xếp thứ tự ảnh. Ảnh đại diện sẽ là ảnh đầu tiên.
        </p>

        <div className="border-t border-[#EDF1ED] pt-6">
          <h3 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
            Video (không bắt buộc)
          </h3>
          <p className="mt-2 text-sm text-[#69717B]">
            Video giúp người thuê hiểu rõ hơn về bất động sản của bạn.
          </p>

          <div className="mt-5 flex flex-col gap-4 rounded-[22px] border border-[#E7ECE8] bg-[#FCFDFC] p-4 sm:flex-row sm:items-start sm:p-5">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#F1F4F2] text-[#55606C]">
              <Video className="size-6" />
            </span>
            <div className="flex-1">
              <label className="text-sm font-semibold text-[#29313B]">
                Thêm link video
              </label>
              <div className="relative mt-2">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#929AA5]" />
                <input
                  className="h-12 w-full rounded-xl border border-[#E2E7E3] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  placeholder="Dán link YouTube, Facebook, TikTok..."
                  type="text"
                  value={videoLink}
                  onChange={onVideoLinkChange}
                />
              </div>
              <p className="mt-2 text-xs text-[#8A919B]">
                Ví dụ: https://www.youtube.com/watch?v=xxxxxxxx
              </p>
            </div>
          </div>
        </div>

        <PostListingStepFooter
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onBackStep={onBackStep}
          onNextStep={onNextStep}
        />
      </div>
    </section>
  );
}

function ListingTierBadge({ tone }) {
  const toneClassName = {
    diamond: "from-[#F87171] via-[#EF4444] to-[#B91C1C]",
    gold: "from-[#FDE68A] via-[#FACC15] to-[#D97706]",
    silver: "from-[#E5E7EB] via-[#CBD5E1] to-[#94A3B8]",
    standard: "from-[#E5E7EB] via-[#D8DEE8] to-[#BBC5D3]",
  }[tone];

  return (
    <span className="relative flex size-9 items-center justify-center rounded-xl bg-[#F7F9F8]">
      <span
        className={`relative block h-4 w-5 rounded-[4px] bg-gradient-to-b ${toneClassName}`}
      >
        <span className="absolute -left-0.5 right-0.5 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/70" />
        <span className="absolute inset-x-1 top-[3px] h-[2px] rounded-full bg-white/80" />
      </span>
    </span>
  );
}

function ListingTierCard({ isSelected, onSelect, option }) {
  const multiplierClassName = {
    diamond: "bg-[#E53935] text-white",
    gold: "bg-[#D4A017] text-white",
    silver: "bg-[#3AA9A0] text-white",
    standard: "bg-[#EDF1EE] text-[#51606E]",
  }[option.tone];

  return (
    <button
      className={`rounded-[20px] border p-4 text-left transition ${
        isSelected
          ? "border-[#78C68B] bg-[#FCFEFC] shadow-[0_14px_30px_rgba(53,165,84,0.08)]"
          : "border-[#E5EAE6] bg-white hover:border-[#CFE0D2]"
      }`}
      type="button"
      onClick={() => onSelect(option.key)}
    >
      <div className="flex items-start justify-between gap-3">
        <ListingTierBadge tone={option.tone} />
        <span
          className={`mt-1 flex size-5 items-center justify-center rounded-full border text-[10px] font-bold ${
            isSelected
              ? "border-[#23A049] bg-[#23A049] text-white"
              : "border-[#AAB2BC] text-transparent"
          }`}
        >
          ✓
        </span>
      </div>
      <h3 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
        {option.label}
      </h3>
      <p className="mt-1 text-sm text-[#69717B]">{option.description}</p>
      {option.multiplier ? (
        <div className="mt-4 flex items-start gap-2">
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${multiplierClassName}`}
          >
            {option.multiplier}
          </span>
          <span className="whitespace-pre-line text-xs leading-5 text-[#7B838E]">
            {option.multiplierNote}
          </span>
        </div>
      ) : (
        <div className="mt-4 h-[42px]" />
      )}
      <p className="mt-4 text-xl font-bold text-[#1F252D]">{option.price}</p>
    </button>
  );
}

function ListingDurationCard({ isSelected, onSelect, option }) {
  return (
    <button
      className={`rounded-[20px] border p-4 text-left transition ${
        isSelected
          ? "border-[#78C68B] bg-[#FCFEFC] shadow-[0_14px_30px_rgba(53,165,84,0.08)]"
          : "border-[#E5EAE6] bg-white hover:border-[#CFE0D2]"
      }`}
      type="button"
      onClick={() => onSelect(option.key)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
            {option.label}
          </h3>
          {option.saving ? (
            <p className="mt-1 text-xs font-semibold text-[#E25454]">
              {option.saving}
            </p>
          ) : null}
        </div>
        <span
          className={`mt-1 flex size-5 items-center justify-center rounded-full border text-[10px] font-bold ${
            isSelected
              ? "border-[#23A049] bg-[#23A049] text-white"
              : "border-[#AAB2BC] text-transparent"
          }`}
        >
          ✓
        </span>
      </div>
      {option.subtitle ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#69717B]">
          {option.subtitle}
        </p>
      ) : (
        <div className="mt-3 space-y-1.5">
          <p className="text-sm font-medium text-[#3D4854]">
            {option.pricePerDay}
          </p>
          {option.oldPrice ? (
            <p className="text-xs text-[#A7AEB7] line-through">
              {option.oldPrice}
            </p>
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}
      <p className="mt-5 text-xl font-bold text-[#1F252D]">
        {option.totalPrice ?? ""}
      </p>
    </button>
  );
}

function PostListingPricingStep({
  canGoBack,
  selectedDuration,
  selectedTier,
  onBackStep,
  onDurationChange,
  onNextStep,
  onTierChange,
}) {
  return (
    <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#1F252D]">
            Chọn loại tin
          </h2>
          <p className="mt-2 text-sm text-[#69717B]">
            Chọn loại tin phù hợp để tăng khả năng hiển thị và tiếp cận nhiều
            người thuê hơn.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-[#7B838E] transition hover:text-[#355C41]"
          type="button"
        >
          So sánh các loại tin và giá
          <Info className="size-3.5" />
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {listingTierOptions.map((option) => (
            <ListingTierCard
              key={option.key}
              isSelected={selectedTier === option.key}
              option={option}
              onSelect={onTierChange}
            />
          ))}
        </div>

        <ListingHint icon={Info}>
          Tin VIP có lượt liên hệ cao hơn Tin Thường từ 8-30 lần
        </ListingHint>

        <div>
          <h3 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
            Chọn gói đăng
          </h3>
          <p className="mt-2 text-sm text-[#69717B]">
            Chọn thời gian đăng tin phù hợp với nhu cầu của bạn.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {listingDurationOptions.map((option) => (
            <ListingDurationCard
              key={option.key}
              isSelected={selectedDuration === option.key}
              option={option}
              onSelect={onDurationChange}
            />
          ))}
        </div>

        <ListingHint icon={CircleDollarSign}>
          Tiết kiệm hơn khi đăng tin từ 15 ngày!
        </ListingHint>

        <div className="rounded-[22px] border border-[#E7ECE8] bg-white p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <ListingField label="Ngày bắt đầu" required>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-[#E2E7E3] bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  defaultValue="06-08-2026"
                  type="text"
                />
                <CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#8E939E]" />
              </div>
              <p className="mt-2 text-xs text-[#8A919B]">
                Kết thúc ngày 16/08/2026
              </p>
            </ListingField>

            <ListingField label="Ngày kết thúc" required>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-[#E2E7E3] bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-[#A0A7B1] focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  placeholder="Chọn ngày kết thúc"
                  type="text"
                />
                <CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#8E939E]" />
              </div>
              <p className="mt-2 text-xs text-[#8A919B]">
                (Chỉ áp dụng khi chọn gói Tùy chỉnh)
              </p>
            </ListingField>
          </div>

          <div className="mt-4">
            <ListingField label="Hẹn giờ đăng tin">
              <div className="relative">
                <select
                  className="h-12 w-full appearance-none rounded-xl border border-[#E2E7E3] bg-white px-4 pr-10 text-sm text-[#38404A] outline-none transition focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  defaultValue={scheduleOptions[0]}
                >
                  {scheduleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#8E939E]" />
              </div>
              <p className="mt-2 text-xs text-[#8A919B]">
                Chọn thời điểm hệ thống sẽ tự động đăng tin giúp bạn.
              </p>
            </ListingField>
          </div>

          <div className="mt-4">
            <ListingHint icon={Info}>
              Tin sẽ được kiểm duyệt và đăng theo thời gian bạn chọn.
            </ListingHint>
          </div>
        </div>

        <PostListingStepFooter
          canGoBack={canGoBack}
          canGoNext
          nextLabel="Hoàn tất & đăng tin"
          onBackStep={onBackStep}
          onNextStep={onNextStep}
          showNextArrow={false}
        />
      </div>
    </section>
  );
}

function PostListingPage({ editingListing, onLogout, onNavigate, user }) {
  const draftValues = editingListing?.draft ?? defaultListingDraft;
  const isEditingListing = Boolean(editingListing);
  const headingTitle = isEditingListing
    ? "Chỉnh sửa tin đăng"
    : "Đăng tin cho thuê mới";
  const headingDescription = isEditingListing
    ? `Bạn đang cập nhật tin ${editingListing.id} - ${editingListing.title}. Có thể chỉnh lại từng bước và lưu thay đổi cho tin ${editingListing.statusLabel.toLowerCase()}.`
    : "Vui lòng cung cấp đầy đủ thông tin để tin đăng của bạn được duyệt nhanh hơn.";
  const backTarget = isEditingListing ? "myListings" : "home";
  const [currentPostListingStep, setCurrentPostListingStep] = useState(
    defaultPostListingStep,
  );
  const [listingTitle, setListingTitle] = useState(editingListing?.title ?? "");
  const [listingDescription, setListingDescription] = useState(
    draftValues.description,
  );
  const [locationNote, setLocationNote] = useState(draftValues.locationNote);
  const [listingLocation, setListingLocation] = useState(() =>
    createDraftLocation(draftValues),
  );
  const [videoLink, setVideoLink] = useState(draftValues.videoLink);
  const [selectedTier, setSelectedTier] = useState(draftValues.selectedTier);
  const [selectedDuration, setSelectedDuration] = useState(
    draftValues.selectedDuration,
  );
  const [selectedAmenities, setSelectedAmenities] = useState(
    () => draftValues.selectedAmenities,
  );

  const canGoBack = currentPostListingStep > 0;
  const canGoNext = currentPostListingStep < postListingSteps.length - 1;

  function toggleAmenity(key) {
    setSelectedAmenities((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  function goToPreviousStep() {
    setCurrentPostListingStep((current) => Math.max(current - 1, 0));
  }

  function goToNextStep() {
    setCurrentPostListingStep((current) =>
      Math.min(current + 1, postListingSteps.length - 1),
    );
  }

  function renderCurrentPostListingStep() {
    if (currentPostListingStep === 0) {
      return (
        <PostListingBasicInfoStep
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          draftValues={draftValues}
          listingDescription={listingDescription}
          listingTitle={listingTitle}
          selectedAmenities={selectedAmenities}
          toggleAmenity={toggleAmenity}
          onBackStep={goToPreviousStep}
          onDescriptionChange={(event) =>
            setListingDescription(event.target.value)
          }
          onNextStep={goToNextStep}
          onTitleChange={(event) => setListingTitle(event.target.value)}
        />
      );
    }

    if (currentPostListingStep === 1) {
      return (
        <PostListingLocationStep
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          draftValues={draftValues}
          listingLocation={listingLocation}
          locationNote={locationNote}
          onBackStep={goToPreviousStep}
          onListingLocationChange={setListingLocation}
          onLocationNoteChange={(event) => setLocationNote(event.target.value)}
          onNextStep={goToNextStep}
        />
      );
    }

    if (currentPostListingStep === 2) {
      return (
        <PostListingMediaStep
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onBackStep={goToPreviousStep}
          onNextStep={goToNextStep}
          onVideoLinkChange={(event) => setVideoLink(event.target.value)}
          videoLink={videoLink}
        />
      );
    }

    return (
      <PostListingPricingStep
        canGoBack={canGoBack}
        selectedDuration={selectedDuration}
        selectedTier={selectedTier}
        onBackStep={goToPreviousStep}
        onDurationChange={setSelectedDuration}
        onNextStep={goToNextStep}
        onTierChange={setSelectedTier}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#20262E]">
      <div className="mx-auto max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
        <SharedHeader
          activeNav="postListing"
          currentUser={user}
          navItems={authenticatedHeaderNavItems}
          onLogoClick={() => onNavigate("home")}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onUserClick={() => onNavigate("profile")}
        />

        <main className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <AccountSidebar
            activeKey="postListing"
            onLogout={onLogout}
            onNavigate={onNavigate}
          />

          <div className="min-w-0 space-y-5">
            <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
              <button
                className="flex items-center gap-2 text-sm font-semibold text-[#27313A] transition hover:text-[#2E9C4D]"
                type="button"
                onClick={() => onNavigate(backTarget)}
              >
                <ArrowRight className="size-4 rotate-180" />
                Quay lại
              </button>
              <h1 className="mt-5 text-[34px] font-bold tracking-[-0.03em] text-[#1F252D]">
                {headingTitle}
              </h1>
              <p className="mt-2 text-sm text-[#69717B] sm:text-base">
                {headingDescription}
              </p>
              {isEditingListing ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#D7E9DB] bg-[#F4FBF5] px-3 py-1 text-xs font-semibold text-[#238C43]">
                    {editingListing.statusLabel}
                  </span>
                  <span className="rounded-full bg-[#EEF2F1] px-3 py-1 text-xs font-medium text-[#5C6672]">
                    {editingListing.id}
                  </span>
                  <span className="rounded-full bg-[#EEF2F1] px-3 py-1 text-xs font-medium text-[#5C6672]">
                    {editingListing.packageLabel}
                  </span>
                </div>
              ) : null}
              <div className="mt-7">
                <ListingProgress activeStep={currentPostListingStep} />
              </div>
            </section>

            {renderCurrentPostListingStep()}
          </div>
        </main>
      </div>
    </div>
  );
}

function ListingDetailPage({
  backView,
  currentUser,
  listing,
  onLogout,
  onNavigate,
}) {
  const detail = listing.detail ?? ownerListingPublicDetails[listing.id] ?? {};
  const draft = listing.draft ?? defaultListingDraft;
  const tierOption = getListingTierOptionByKey(draft.selectedTier);
  const amenities = getListingAmenityItems(draft.selectedAmenities);
  const navItems = currentUser
    ? authenticatedHeaderNavItems
    : guestHeaderNavItems;
  const mediaItems = buildListingMediaItems(listing, detail, draft);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = mediaItems[activeMediaIndex] ?? mediaItems[0];
  const fullAddress = buildListingFullAddress(draft);
  const isAdminViewer = currentUser?.roles?.includes("admin");
  const isOwnerViewer =
    Boolean(currentUser) && backView === "myListings" && !isAdminViewer;
  const previewMessage = {
    pending:
      "Tin này đang chờ kiểm duyệt. Đây là bản xem trước giao diện hiển thị cho khách thuê.",
    draft:
      "Tin này hiện là bản nháp. Bạn có thể dùng trang này để xem trước trải nghiệm của khách thuê.",
    hidden:
      "Tin này đang tạm ẩn. Khi bật lại hiển thị, giao diện khách thuê sẽ giống như bên dưới.",
    rejected:
      listing.rejectionReason ||
      "Tin này đang ở trạng thái vi phạm và cần chỉnh sửa trước khi hiển thị lại.",
  }[listing.status];
  const overviewItems = [
    { icon: Ruler, label: "Diện tích", value: `${draft.area} m²` },
    { icon: BedDouble, label: "Phòng ngủ", value: `${draft.bedrooms} phòng` },
    { icon: Bath, label: "Phòng tắm", value: `${draft.bathrooms} phòng` },
    { icon: Home, label: "Loại hình", value: draft.propertyType },
    { icon: Sofa, label: "Nội thất", value: draft.furnishing },
    {
      icon: Ruler,
      label: "Mặt tiền",
      value: draft.frontage ? `${draft.frontage} m` : null,
    },
  ].filter((item) => item.value);
  const propertyFacts = [
    { label: "Nhận nhà dự kiến", value: detail.availableFrom },
    { label: "Hướng nhà", value: draft.orientation },
    {
      label: "Tầng hiện tại",
      value: draft.floor ? `Tầng ${draft.floor}` : null,
    },
    {
      label: "Tổng số tầng",
      value: draft.totalFloors ? `${draft.totalFloors} tầng` : null,
    },
    {
      label: "Đường vào",
      value: draft.accessRoad ? `${draft.accessRoad} m` : null,
    },
    {
      label: "Mã tin",
      value: listing.id,
    },
  ].filter((item) => item.value);
  const backLabel =
    backView === "myListings"
      ? "Quay lại tin đăng của tôi"
      : "Quay lại trang chủ";

  function showPreviousMedia() {
    setActiveMediaIndex((current) =>
      current === 0 ? mediaItems.length - 1 : current - 1,
    );
  }

  function showNextMedia() {
    setActiveMediaIndex((current) =>
      current === mediaItems.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#20262E]">
      <div className="mx-auto max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
        <SharedHeader
          activeNav="home"
          currentUser={currentUser}
          navItems={navItems}
          onLogin={currentUser ? undefined : () => onNavigate("home")}
          onLogoClick={() => onNavigate("home")}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onSignup={currentUser ? undefined : () => onNavigate("home")}
          onUserClick={currentUser ? () => onNavigate("profile") : undefined}
          searchPlaceholder="Tìm theo địa chỉ, khu vực, trường học, ..."
        />

        <main className="mt-5 space-y-5">
          <section className="rounded-[28px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
            <button
              className="flex items-center gap-2 text-sm font-semibold text-[#27313A] transition hover:text-[#2E9C4D]"
              type="button"
              onClick={() => onNavigate(backView)}
            >
              <ArrowRight className="size-4 rotate-180" />
              {backLabel}
            </button>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-6">
                {previewMessage ? (
                  <div className="rounded-[20px] border border-[#E6E8EB] bg-[#FAFBFC] px-4 py-3 text-sm leading-6 text-[#5D6773]">
                    {previewMessage}
                  </div>
                ) : null}

                <section className="rounded-[26px] border border-[#EAEDE8] bg-white p-4 shadow-[0_8px_24px_rgba(46,72,54,0.04)]">
                  <div className="relative overflow-hidden rounded-[22px] bg-[#F4F7F4]">
                    {activeMedia?.type === "video" ? (
                      activeMedia.embedUrl ? (
                        <iframe
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-[300px] w-full sm:h-[420px] xl:h-[560px]"
                          referrerPolicy="strict-origin-when-cross-origin"
                          src={activeMedia.embedUrl}
                          title={`${listing.title} video`}
                        />
                      ) : (
                        <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#F7FAF7_0%,#EEF5EF_100%)] px-6 text-center sm:h-[420px] xl:h-[560px]">
                          <span className="flex size-16 items-center justify-center rounded-full bg-white text-[#35A554] shadow-sm">
                            <Video className="size-7" />
                          </span>
                          <div>
                            <p className="text-lg font-bold text-[#1F252D]">
                              Video tham quan thực tế
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#68717C]">
                              Liên kết video hiện chưa hỗ trợ nhúng trực tiếp,
                              bạn có thể mở ở tab mới để xem đầy đủ.
                            </p>
                          </div>
                          <a
                            className="inline-flex items-center gap-2 rounded-xl bg-[#35A554] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.22)] transition hover:bg-[#2C9349]"
                            href={activeMedia.src}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Link2 className="size-4" />
                            Mở video
                          </a>
                        </div>
                      )
                    ) : (
                      <img
                        alt={`${listing.title} - ${activeMedia?.title ?? "ảnh hiển thị"}`}
                        className="h-[300px] w-full object-cover sm:h-[420px] xl:h-[560px]"
                        src={activeMedia?.src ?? listing.image}
                      />
                    )}

                    {mediaItems.length > 1 ? (
                      <>
                        <button
                          aria-label="Xem media trước"
                          className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/95 text-[#37414B] shadow-[0_8px_22px_rgba(31,37,45,0.12)] transition hover:bg-white"
                          type="button"
                          onClick={showPreviousMedia}
                        >
                          <ArrowRight className="size-5 rotate-180" />
                        </button>
                        <button
                          aria-label="Xem media tiếp theo"
                          className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/95 text-[#37414B] shadow-[0_8px_22px_rgba(31,37,45,0.12)] transition hover:bg-white"
                          type="button"
                          onClick={showNextMedia}
                        >
                          <ArrowRight className="size-5" />
                        </button>
                      </>
                    ) : null}

                    <div className="absolute bottom-4 right-4 rounded-xl bg-[#1F252D]/78 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                      {activeMediaIndex + 1}/{mediaItems.length}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {mediaItems.map((item, index) => {
                      const isActive = index === activeMediaIndex;

                      return (
                        <button
                          key={item.key}
                          aria-label={item.title}
                          className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-[14px] border transition ${
                            isActive
                              ? "border-[#35A554] ring-2 ring-[#35A554]/20"
                              : "border-[#E4E9E5]"
                          }`}
                          type="button"
                          onClick={() => setActiveMediaIndex(index)}
                        >
                          <img
                            alt={item.title}
                            className="h-full w-full object-cover"
                            src={item.thumb}
                          />
                          {item.type === "video" ? (
                            <span className="absolute inset-0 flex items-center justify-center bg-[#1F252D]/38 text-white">
                              <span className="flex items-center gap-1 rounded-full bg-white/18 px-2 py-1 text-[11px] font-semibold backdrop-blur-sm">
                                <Video className="size-3.5" />
                                Video
                              </span>
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#35A554]">
                        {draft.projectName || draft.propertyType}
                      </p>
                      <h1 className="mt-3 text-[32px] font-bold tracking-[-0.03em] text-[#1F252D] sm:text-[38px]">
                        {listing.title}
                      </h1>
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#69717B]">
                        <span className="flex items-center gap-2">
                          <MapPin className="size-4 text-[#35A554]" />
                          {listing.location}
                        </span>
                        <span className="flex items-center gap-2">
                          <CalendarDays className="size-4 text-[#35A554]" />
                          Đăng ngày {detail.publishedAt}
                        </span>
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-[#35A554]" />
                          Hết hạn {detail.expiresAt}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                      <div className="rounded-[22px] border border-[#E6ECE8] bg-[#FCFDFC] px-5 py-4">
                        <p className="text-sm text-[#7E8792]">Khoảng giá</p>
                        <p className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#1F252D]">
                          {listing.price}
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-[#E6ECE8] bg-[#FCFDFC] px-5 py-4">
                        <p className="text-sm text-[#7E8792]">Diện tích</p>
                        <p className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#1F252D]">
                          {draft.area} m²
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
                    Đặc điểm bất động sản
                  </h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {overviewItems.map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 rounded-[18px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-3.5"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF8F0] text-[#35A554]">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A919B]">
                            {label}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#26303A]">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
                    Mô tả tin đăng
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#505A66]">
                    {draft.description}
                  </p>
                  {draft.locationNote ? (
                    <div className="mt-4 rounded-[20px] border border-[#E6EEDC] bg-[#F7FBF3] px-4 py-4 text-sm leading-6 text-[#56626C]">
                      <p className="font-semibold text-[#2E9C4D]">
                        Điểm nổi bật khu vực
                      </p>
                      <p className="mt-1">{draft.locationNote}</p>
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
                    Tiện ích đi kèm
                  </h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {amenities.map((amenity) => {
                      const Icon = amenity.icon;

                      return (
                        <div
                          key={amenity.key}
                          className="flex items-center gap-3 rounded-[20px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-4"
                        >
                          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#EEF8F0] text-[#35A554]">
                            <Icon className="size-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#26303A]">
                              {amenity.label}
                            </p>
                            <p className="text-xs text-[#83909B]">
                              Đã có sẵn trong tin
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
                    Vị trí & khu vực
                  </h2>
                  <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#505A66]">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#35A554]" />
                    <span>{fullAddress}</span>
                  </p>
                  <div className="mt-5 rounded-[24px] border border-[#E6ECE8] bg-[radial-gradient(circle_at_top,#F7FBF8_0%,#EEF5EF_55%,#E8F1EA_100%)] p-5">
                    <div className="flex min-h-[220px] items-end rounded-[20px] border border-dashed border-[#C8D8CC] bg-white/45 p-4">
                      <div className="rounded-[18px] bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
                        <p className="text-sm font-semibold text-[#27313A]">
                          Bản đồ demo cho giai đoạn đầu
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#75808C]">
                          Tọa độ hardcode: {detail.coordinates?.lat},{" "}
                          {detail.coordinates?.lng}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {(detail.nearbyPlaces ?? []).map((place) => (
                      <div
                        key={place}
                        className="rounded-[20px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-4 text-sm font-medium text-[#4B5661]"
                      >
                        {place}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E9F7EC,#CDE9D4)] text-lg font-bold text-[#2F9C50]">
                      {detail.ownerName?.slice(0, 1) ?? "W"}
                    </span>
                    <div>
                      <p className="text-lg font-bold text-[#1F252D]">
                        {detail.ownerName}
                      </p>
                      <p className="text-sm text-[#6F7984]">
                        {detail.ownerLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#35A554] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(53,165,84,0.22)] transition hover:bg-[#2C9349]"
                      type="button"
                    >
                      <Phone className="size-4" />
                      {detail.ownerPhone}
                    </button>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6E2FF] bg-[#F3F7FF] px-4 py-3 text-sm font-semibold text-[#2457C5] transition hover:bg-[#EAF1FF]"
                      type="button"
                    >
                      <ZaloMark className="size-5" />
                      Nhắn tin qua Zalo
                    </button>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D8EEDD] px-4 py-3 text-sm font-semibold text-[#2FA14E] transition hover:bg-[#F3FBF5]"
                      type="button"
                    >
                      <MessageSquare className="size-4" />
                      Nhắn qua WeRent
                    </button>
                  </div>
                </section>

                {isOwnerViewer ? (
                  <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                    <div className="flex items-center gap-3">
                      <ListingTierBadge tone={tierOption.tone} />
                      <div>
                        <p className="text-lg font-bold text-[#1F252D]">
                          {tierOption.label}
                        </p>
                        <p className="text-sm text-[#6F7984]">
                          {tierOption.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-[#56616C]">
                      <div className="rounded-[20px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-4">
                        <p className="font-semibold text-[#26303A]">
                          Gói hiển thị
                        </p>
                        <p className="mt-1">{listing.packageLabel}</p>
                      </div>
                      <div className="rounded-[20px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-4">
                        <p className="font-semibold text-[#26303A]">
                          Mức ưu tiên
                        </p>
                        <p className="mt-1">
                          {tierOption.multiplier
                            ? `${tierOption.multiplier} lượt liên hệ so với tin thường`
                            : "Hiển thị cơ bản, phù hợp đăng dài ngày"}
                        </p>
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <h2 className="text-lg font-bold text-[#1F252D]">
                    Thông tin bổ sung
                  </h2>
                  <div className="mt-5 space-y-3">
                    {propertyFacts.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start justify-between gap-4 rounded-[18px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-3 text-sm"
                      >
                        <span className="text-[#7B8792]">{item.label}</span>
                        <span className="text-right font-semibold text-[#26303A]">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {draft.videoLink ? (
                  <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                    <h2 className="text-lg font-bold text-[#1F252D]">
                      Video tham quan
                    </h2>
                    <button
                      className="mt-4 flex w-full items-center gap-3 rounded-[20px] border border-[#E7ECE8] bg-[#FCFDFC] px-4 py-4 text-left text-sm font-semibold text-[#2FA14E] transition hover:bg-[#F3FBF5]"
                      type="button"
                      onClick={() => setActiveMediaIndex(mediaItems.length - 1)}
                    >
                      <Video className="size-4" />
                      Xem video ngay trong gallery
                    </button>
                  </section>
                ) : null}

                <section className="rounded-[26px] border border-[#E8ECE7] bg-white p-5 shadow-[0_10px_28px_rgba(46,72,54,0.045)] sm:p-6">
                  <h2 className="text-lg font-bold text-[#1F252D]">
                    Lưu ý khi thuê
                  </h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[#56616C]">
                    {(detail.houseRules ?? []).map((rule) => (
                      <li key={rule} className="flex gap-2">
                        <ShieldCheck className="mt-1 size-4 shrink-0 text-[#35A554]" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function MyListingsPage({
  onEditListing,
  onLogout,
  onNavigate,
  onViewListing,
  user,
}) {
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const listingCounts = ownerListingRecords.reduce(
    (result, listing) => ({
      ...result,
      [listing.status]: (result[listing.status] ?? 0) + 1,
    }),
    {
      all: ownerListingRecords.length,
      active: 0,
      pending: 0,
      draft: 0,
      hidden: 0,
      rejected: 0,
    },
  );
  const filteredListings =
    activeStatusTab === "all"
      ? ownerListingRecords
      : ownerListingRecords.filter(
          (listing) => listing.status === activeStatusTab,
        );

  return (
    <div className="min-h-screen bg-[#F5F7F4] text-[#20262E]">
      <div className="mx-auto max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
        <SharedHeader
          activeNav="postListing"
          currentUser={user}
          navItems={authenticatedHeaderNavItems}
          onLogoClick={() => onNavigate("home")}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onUserClick={() => onNavigate("profile")}
        />

        <main className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <AccountSidebar
            activeKey="myListings"
            onLogout={onLogout}
            onNavigate={onNavigate}
          />

          <div className="min-w-0 space-y-5">
            <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <button
                    className="flex items-center gap-2 text-sm font-semibold text-[#27313A] transition hover:text-[#2E9C4D]"
                    type="button"
                    onClick={() => onNavigate("home")}
                  >
                    <ArrowRight className="size-4 rotate-180" />
                    Quay lại
                  </button>
                  <h1 className="mt-5 text-[34px] font-bold tracking-[-0.03em] text-[#1F252D]">
                    Tin đăng của tôi
                  </h1>
                  <p className="mt-2 max-w-[760px] text-sm text-[#69717B] sm:text-base">
                    Theo dõi trạng thái, hiệu quả hiển thị và chỉnh sửa các tin
                    bạn đã đăng trên WeRent.
                  </p>
                </div>

                <button
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#35A554] px-5 text-sm font-semibold text-white shadow-[0_14px_25px_rgba(50,164,82,0.22)] transition hover:bg-[#2C9349]"
                  type="button"
                  onClick={() => onNavigate("postListing")}
                >
                  <FileText className="size-4" />
                  Đăng tin mới
                </button>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#E8ECE7] bg-white p-5 shadow-[0_12px_35px_rgba(46,72,54,0.055)] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#1F252D]">
                    Danh sách tin đã đăng
                  </h2>
                  <p className="mt-2 text-sm text-[#69717B]">
                    {user.fullName}, bạn có thể cập nhật nội dung, hình ảnh và
                    gói hiển thị cho từng tin ngay tại đây.
                  </p>
                </div>
                <ListingHint>
                  Hãy chỉnh sửa định kỳ để tin luôn mới và có nhiều lượt liên hệ
                  hơn.
                </ListingHint>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {listingStatusTabs.map((tab) => {
                  const isActive = activeStatusTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-[#88CF97] bg-[#EDF8EF] text-[#2F9C50]"
                          : "border-[#E2E7E3] bg-white text-[#63707D] hover:border-[#CFE0D2] hover:text-[#2F9C50]"
                      }`}
                      type="button"
                      onClick={() => setActiveStatusTab(tab.key)}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isActive
                            ? "bg-white text-[#2F9C50]"
                            : "bg-[#F3F5F4] text-[#73808B]"
                        }`}
                      >
                        {listingCounts[tab.key] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4">
                {filteredListings.length ? (
                  filteredListings.map((listing) => (
                    <article
                      key={listing.id}
                      className="grid gap-4 rounded-[22px] border border-[#E8ECE7] bg-[#FCFDFC] p-4 shadow-[0_8px_24px_rgba(46,72,54,0.04)] md:grid-cols-[220px_minmax(0,1fr)]"
                    >
                      <button
                        className="overflow-hidden rounded-[18px] text-left"
                        type="button"
                        onClick={() => onViewListing(listing)}
                      >
                        <img
                          alt={listing.title}
                          className="h-full min-h-[180px] w-full rounded-[18px] object-cover transition duration-200 hover:scale-[1.02]"
                          src={listing.image}
                        />
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getListingStatusClassName(listing.status)}`}
                              >
                                {listing.statusLabel}
                              </span>
                              <span className="rounded-full bg-[#EDF2EF] px-3 py-1 text-xs font-medium text-[#5C6672]">
                                {listing.packageLabel}
                              </span>
                            </div>
                            <button
                              className="mt-3 text-left text-xl font-bold text-[#1F252D] transition hover:text-[#2E9C4D]"
                              type="button"
                              onClick={() => onViewListing(listing)}
                            >
                              {listing.title}
                            </button>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#69717B]">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="size-4 text-[#35A554]" />
                                {listing.location}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CircleDollarSign className="size-4 text-[#35A554]" />
                                {listing.price}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="size-4 text-[#35A554]" />
                                Cập nhật: {listing.updatedAt}
                              </span>
                            </div>
                          </div>

                          <button
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#BFE0C6] px-4 text-sm font-semibold text-[#2F9C50] transition hover:bg-[#F4FBF5]"
                            type="button"
                            onClick={() => onEditListing(listing)}
                          >
                            <FileText className="size-4" />
                            Chỉnh sửa tin
                          </button>
                        </div>

                        {listing.status === "rejected" ? (
                          <div className="mt-5 rounded-2xl border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3 text-sm leading-6 text-[#8F3A3A]">
                            <p className="font-semibold text-[#B63A3A]">
                              Lý do bị từ chối
                            </p>
                            <p className="mt-1">{listing.rejectionReason}</p>
                          </div>
                        ) : (
                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {listing.metrics.map((metric) => (
                              <div
                                key={metric}
                                className="rounded-2xl border border-[#E7ECE8] bg-white px-4 py-3 text-sm font-medium text-[#48515B]"
                              >
                                {metric}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[#D9E2DC] bg-[#FBFCFB] px-6 py-12 text-center">
                    <p className="text-lg font-semibold text-[#29313B]">
                      Chưa có tin ở trạng thái này
                    </p>
                    <p className="mt-2 text-sm text-[#75808C]">
                      Hãy chọn tab khác hoặc tạo tin mới để bắt đầu quản lý danh
                      sách đăng của bạn.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfilePage({
  accessToken,
  onLogout,
  onNavigate,
  onUserChange,
  user,
}) {
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

      <div className="mx-auto max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8">
        <SharedHeader
          activeNav="home"
          currentUser={user}
          navItems={authenticatedHeaderNavItems}
          onLogoClick={() => onNavigate("home")}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onUserClick={() => onNavigate("profile")}
        />

        <main className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <AccountSidebar
            activeKey="profile"
            onLogout={onLogout}
            onNavigate={onNavigate}
          />

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
                      <p className="text-xs text-[#858D96]">
                        Cập nhật gần nhất
                      </p>
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
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={handleProfileSubmit}
                  >
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
                      Tài khoản phải giữ lại ít nhất một email hoặc số điện
                      thoại hợp lệ.
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
  const [editingListing, setEditingListing] = useState(null);
  const [selectedListingDetail, setSelectedListingDetail] = useState(null);
  const [listingDetailBackView, setListingDetailBackView] = useState("home");

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
      if (nextMessage === "Đăng nhập thành công.") {
        setAuthNotice(null);
        return;
      }

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
    if (!accessToken || currentUser !== undefined) {
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
  }, [accessToken, currentUser]);

  function handleLogout() {
    setAccessToken("");
    setCurrentUser(null);
    setCurrentView("home");
    setEditingListing(null);
    setSelectedListingDetail(null);
    setListingDetailBackView("home");
    setAuthNotice({
      type: "success",
      message: "Bạn đã đăng xuất thành công.",
    });
  }

  function navigateTo(view) {
    if (view === "home") {
      setEditingListing(null);
      setSelectedListingDetail(null);
      setListingDetailBackView("home");
      setCurrentView("home");
      return;
    }

    const protectedViews = [
      "profile",
      "postListing",
      "myListings",
      "adminDashboard",
    ];

    if (protectedViews.includes(view)) {
      if (!currentUser) {
        setAuthNotice({
          type: "error",
          message: "Vui lòng đăng nhập để sử dụng tính năng này.",
        });
        setAuthModal("login");
        return;
      }

      if (view === "adminDashboard" && !currentUser.roles?.includes("admin")) {
        setAuthNotice({
          type: "error",
          message: "Bạn không có quyền truy cập khu vực quản trị.",
        });
        return;
      }

      if (view === "postListing") {
        setEditingListing(null);
      }

      setCurrentView(view);
      return;
    }

    const comingSoonViews = [
      "favorites",
      "messages",
      "support",
      "about",
      "accountSettings",
      "rentalAppointments",
      "wallet",
      "notifications",
    ];

    if (comingSoonViews.includes(view)) {
      setAuthNotice({
        type: "success",
        message: "Tính năng này đang được phát triển.",
      });
    }
  }

  function openListingEditor(listing) {
    if (!currentUser) {
      setAuthNotice({
        type: "error",
        message: "Vui lòng đăng nhập để sử dụng tính năng này.",
      });
      setAuthModal("login");
      return;
    }

    setEditingListing(listing);
    setCurrentView("postListing");
  }

  function openListingDetail(listing, backView = "home") {
    setSelectedListingDetail(listing);
    setListingDetailBackView(backView);
    setCurrentView("listingDetail");
  }

  const isCheckingSession = Boolean(accessToken) && currentUser === undefined;

  if (currentView === "profile" && currentUser) {
    return (
      <ProfilePage
        accessToken={accessToken}
        onLogout={handleLogout}
        onNavigate={navigateTo}
        onUserChange={setCurrentUser}
        user={currentUser}
      />
    );
  }

  if (currentView === "postListing" && currentUser) {
    return (
      <PostListingPage
        editingListing={editingListing}
        onLogout={handleLogout}
        onNavigate={navigateTo}
        user={currentUser}
      />
    );
  }

  if (currentView === "listingDetail" && selectedListingDetail) {
    return (
      <ListingDetailPage
        key={selectedListingDetail.id}
        backView={listingDetailBackView}
        currentUser={currentUser ?? null}
        listing={selectedListingDetail}
        onLogout={handleLogout}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentView === "myListings" && currentUser) {
    return (
      <MyListingsPage
        onEditListing={openListingEditor}
        onLogout={handleLogout}
        onNavigate={navigateTo}
        onViewListing={(listing) => openListingDetail(listing, "myListings")}
        user={currentUser}
      />
    );
  }

  if (
    currentView === "adminDashboard" &&
    currentUser?.roles?.includes("admin")
  ) {
    return (
      <AdminPage
        accessToken={accessToken}
        currentUser={currentUser}
        onBack={() => navigateTo("home")}
        onLogout={handleLogout}
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
        <SharedHeader
          activeNav="home"
          currentUser={currentUser}
          navItems={
            currentUser ? authenticatedHeaderNavItems : guestHeaderNavItems
          }
          onLogin={() => setAuthModal("login")}
          onLogoClick={() => navigateTo("home")}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          onSignup={() => setAuthModal("signup")}
          onUserClick={() => navigateTo("profile")}
          searchPlaceholder="Tìm theo địa chỉ, khu vực, trường học, ..."
        />

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
              <PropertyCard
                key={listing.id}
                listing={listing}
                onViewListing={() => openListingDetail(listing)}
              />
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
              <MiniPropertyCard
                key={listing.id}
                listing={listing}
                onViewListing={() => openListingDetail(listing)}
              />
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
              onClick={() => navigateTo("postListing")}
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
