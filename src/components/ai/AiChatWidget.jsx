import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bath,
  BedDouble,
  Bot,
  CheckCheck,
  CheckCircle2,
  Home,
  Lightbulb,
  LoaderCircle,
  MapPin,
  MoreHorizontal,
  Minus,
  Ruler,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { searchListingsWithAi, sendAiChatMessage } from "../../lib/ai-client";
import {
  findFaqByQuestion,
  getFaqById,
  getFaqItems,
  getRelatedFaqIdsForText,
  MORE_FAQ_GROUPS,
  POPULAR_FAQ_IDS,
} from "./werentFaq";

const MAX_VISIBLE_HISTORY = 16;
const SEARCH_LISTING_PAGE_SIZE = 5;
const LISTING_AMENITY_LABELS = Object.freeze({
  airConditioner: "Máy lạnh",
  bbq: "Khu BBQ",
  bed: "Giường",
  camera: "Camera an ninh",
  convenienceStore: "Siêu thị gần",
  desk: "Bàn làm việc",
  diningTable: "Bàn ăn",
  elevator: "Thang máy",
  gym: "Phòng gym",
  kitchen: "Bếp",
  microwave: "Lò vi sóng",
  park: "Công viên",
  parkingBasement: "Hầm để xe",
  pharmacy: "Nhà thuốc gần",
  playground: "Sân chơi trẻ em",
  pool: "Hồ bơi",
  refrigerator: "Tủ lạnh",
  school: "Trường học gần",
  security: "Bảo vệ 24/7",
  television: "Truyền hình",
  wardrobe: "Tủ quần áo",
  washingMachine: "Máy giặt",
  waterHeater: "Nóng lạnh",
  wifi: "Wi-Fi",
});
const INITIAL_ASSISTANT_MESSAGE = {
  content:
    "Xin chào! Tôi là trợ lý AI của WeRent. Tôi có thể giúp bạn tìm hiểu, sử dụng và trải nghiệm WeRent dễ dàng hơn.",
  createdAt: new Date().toISOString(),
  id: "welcome",
  showInitialFaq: true,
  role: "assistant",
};

function createChatMessage(role, content, options = {}) {
  return {
    content,
    createdAt: new Date().toISOString(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    ...options,
  };
}

function getDisplayTime(value) {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getKycStatusLabel(status) {
  const labels = {
    need_more_info: "cần bổ sung",
    pending: "đang chờ duyệt",
    rejected: "bị từ chối",
    verified: "đã xác thực",
  };

  return labels[status] ?? status ?? "chưa xác thực";
}

function buildHistory(messages) {
  return messages
    .filter((message) => !message.isError && message.content?.trim())
    .slice(-10)
    .map((message) => ({
      content: message.content,
      role: message.role,
    }));
}

function normalizeVietnameseText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function isPropertySearchQuestion(content) {
  const normalizedContent = normalizeVietnameseText(content);
  const hasSearchIntent =
    /\b(tim|kiem|thue|can thue|muon thue|muon tim|can tim|search)\b/.test(
      normalizedContent,
    );
  const hasPropertyTerm =
    /\b(can ho|can ho dich vu|can ho mini|chung cu|chung cu mini|studio|phong tro|nha tro|nha rieng|nha nguyen can|nha pho|nha mat pho|nha mat tien|mat bang|van phong|biet thu|villa|noi o|cho o|nha|phong|tro|2pn|3pn|phong ngu)\b/.test(
      normalizedContent,
    );
  const hasLocationOrBudget =
    /\b(quan|q\d+|thu duc|binh thanh|binh tan|go vap|phu nhuan|tan binh|tan phu|nha be|binh chanh|kcn|khu cong nghiep|tan tao|landmark|vinhomes|duoi|toi da|tu|den|trieu|gia re|gia sinh vien|tiet kiem|gan|sat|lan can|an ninh|dien nuoc)\b/.test(
      normalizedContent,
    );

  return (
    (hasSearchIntent && (hasPropertyTerm || hasLocationOrBudget)) ||
    (hasPropertyTerm && hasLocationOrBudget)
  );
}

function hasActiveSearchCriteria(criteria = {}) {
  return Boolean(
    criteria?.amenities?.length ||
      criteria?.city ||
      criteria?.districts?.length ||
      criteria?.keywords?.length ||
      criteria?.maxArea ||
      criteria?.maxPrice ||
      criteria?.minArea ||
      criteria?.minBathrooms ||
      criteria?.minBedrooms ||
      criteria?.minPrice ||
      criteria?.nearbyPlaces?.length ||
      criteria?.noAmenityPreference ||
      criteria?.propertyTypes?.length ||
      criteria?.requiredAmenities?.length,
  );
}

function isPropertySearchFollowUpQuestion(content) {
  const normalizedContent = normalizeVietnameseText(content);

  return /\b(thi sao|con|doi|doi sang|chuyen|chuyen sang|khu vuc|quan|q\d+|thu duc|binh thanh|binh tan|go vap|phu nhuan|tan binh|tan phu|nha be|binh chanh|landmark|vinhomes|kcn|khu cong nghiep|duoi|toi da|tu|den|trieu|gia re|gia sinh vien|tiet kiem|ngan sach|can ho|can ho dich vu|can ho mini|chung cu|chung cu mini|studio|phong tro|nha tro|nha rieng|nha nguyen can|nha pho|nha mat pho|nha mat tien|mat bang|biet thu|villa|may lanh|wifi|noi that|bao ve|camera|bai xe|cho de xe)\b/.test(
    normalizedContent,
  );
}

function getListingSpecs(listing) {
  return [
    {
      icon: BedDouble,
      label: `${listing.bedrooms || 0} PN`,
      visible: Number(listing.bedrooms) > 0,
    },
    {
      icon: Bath,
      label: `${listing.bathrooms || 0} WC`,
      visible: Number(listing.bathrooms) > 0,
    },
    {
      icon: Ruler,
      label: `${listing.area || 0} m²`,
      visible: Number(listing.area) > 0,
    },
  ].filter((item) => item.visible);
}

function getListingDetailHref(listing) {
  const listingId = String(listing?.id ?? "").trim();

  return /^[a-f\d]{24}$/i.test(listingId) ? `/listing/${listingId}` : "";
}

function getListingAmenityLabel(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return "";
  }

  return LISTING_AMENITY_LABELS[rawValue] ?? rawValue;
}

function formatCriteriaMonthlyPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return "";
  }

  const millionValue = numericPrice / 1_000_000;
  const formattedValue = Number.isInteger(millionValue)
    ? String(millionValue)
    : millionValue.toFixed(1).replace(/\.0$/, "");

  return `${formattedValue} triệu/tháng`;
}

function formatCriteriaPriceMillions(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return "";
  }

  const millionValue = numericPrice / 1_000_000;

  return Number.isInteger(millionValue)
    ? String(millionValue)
    : millionValue.toFixed(1).replace(/\.0$/, "");
}

function buildCriteriaBudgetLabel(criteria = {}) {
  const minPrice = formatCriteriaMonthlyPrice(criteria.minPrice);
  const maxPrice = formatCriteriaMonthlyPrice(criteria.maxPrice);

  if (minPrice && maxPrice) {
    return `${minPrice} - ${maxPrice}`;
  }

  if (maxPrice) {
    return `dưới ${maxPrice}`;
  }

  if (minPrice) {
    return `từ ${minPrice}`;
  }

  return "";
}

function buildCriteriaBudgetSearchPhrase(criteria = {}) {
  const minPrice = formatCriteriaPriceMillions(criteria.minPrice);
  const maxPrice = formatCriteriaPriceMillions(criteria.maxPrice);

  if (minPrice && maxPrice) {
    return `từ ${minPrice} đến ${maxPrice} triệu`;
  }

  if (maxPrice) {
    return `dưới ${maxPrice} triệu`;
  }

  if (minPrice) {
    return `từ ${minPrice} triệu`;
  }

  return "";
}

function getNormalizedCriteriaValue(value) {
  return normalizeVietnameseText(value).trim();
}

function getRecognizedCriteriaChips(criteria = {}) {
  const chips = [];

  const addArrayChips = (criteriaKey, values = [], buildLabel, tone) => {
    values.filter(Boolean).forEach((value) => {
      const label = buildLabel(value);

      if (!label) {
        return;
      }

      chips.push({
        criteriaKey,
        key: `${criteriaKey}-${value}`,
        label,
        tone,
        value,
      });
    });
  };

  addArrayChips(
    "propertyTypes",
    criteria.propertyTypes,
    (value) => value,
    "required",
  );
  addArrayChips("districts", criteria.districts, (value) => value, "required");
  addArrayChips(
    "keywords",
    criteria.keywords,
    (value) => `Trong ${value}`,
    "required",
  );
  addArrayChips(
    "nearbyPlaces",
    criteria.nearbyPlaces,
    (value) => `Gần ${value}`,
    "required",
  );

  const budgetLabel = buildCriteriaBudgetLabel(criteria);

  if (budgetLabel) {
    chips.push({
      criteriaKey: "budget",
      key: "budget",
      label: budgetLabel,
      tone: "required",
    });
  }

  if (criteria.minBedrooms) {
    chips.push({
      criteriaKey: "minBedrooms",
      key: "minBedrooms",
      label: `Từ ${criteria.minBedrooms} phòng ngủ`,
      tone: "required",
    });
  }

  if (criteria.minBathrooms) {
    chips.push({
      criteriaKey: "minBathrooms",
      key: "minBathrooms",
      label: `Từ ${criteria.minBathrooms} WC`,
      tone: "required",
    });
  }

  if (criteria.minArea) {
    chips.push({
      criteriaKey: "minArea",
      key: "minArea",
      label: `Từ ${criteria.minArea}m²`,
      tone: "required",
    });
  }

  if (criteria.maxArea) {
    chips.push({
      criteriaKey: "maxArea",
      key: "maxArea",
      label: `Dưới ${criteria.maxArea}m²`,
      tone: "required",
    });
  }

  addArrayChips(
    "requiredAmenities",
    criteria.requiredAmenities,
    (value) => `Cần ${getListingAmenityLabel(value)}`,
    "required",
  );
  addArrayChips(
    "amenities",
    criteria.amenities,
    (value) => `Ưu tiên ${getListingAmenityLabel(value)}`,
    "preference",
  );

  return chips.slice(0, 12);
}

function getSelectedSearchAmenities(criteria = {}) {
  const seen = new Set();
  const groups = [
    {
      criteriaKey: "requiredAmenities",
      prefix: "Cần có",
      values: criteria.requiredAmenities ?? [],
    },
    {
      criteriaKey: "amenities",
      prefix: "Ưu tiên",
      values: criteria.amenities ?? [],
    },
  ];

  return groups.flatMap((group) =>
    group.values
      .map((value) => {
        const normalizedValue = getNormalizedCriteriaValue(value);

        if (!normalizedValue || seen.has(normalizedValue)) {
          return null;
        }

        seen.add(normalizedValue);

        return {
          criteriaKey: group.criteriaKey,
          label: getListingAmenityLabel(value),
          prefix: group.prefix,
          value,
        };
      })
      .filter(Boolean),
  );
}

function removeSelectedSearchAmenity(criteria = {}, selection = {}) {
  const normalizedValue = getNormalizedCriteriaValue(selection.value);
  const amenities = (criteria.amenities ?? []).filter(
    (value) => getNormalizedCriteriaValue(value) !== normalizedValue,
  );
  const requiredAmenities = (criteria.requiredAmenities ?? []).filter(
    (value) => getNormalizedCriteriaValue(value) !== normalizedValue,
  );
  const hasRemainingAmenities = amenities.length || requiredAmenities.length;

  return {
    ...criteria,
    amenities,
    noAmenityPreference: hasRemainingAmenities
      ? criteria.noAmenityPreference
      : true,
    requiredAmenities,
  };
}

function hasLocationCriteria(criteria = {}) {
  return Boolean(
    criteria?.districts?.length ||
      criteria?.keywords?.length ||
      criteria?.nearbyPlaces?.length,
  );
}

function removeSearchCriterion(criteria = {}, criterion = {}) {
  const criteriaKey = criterion.criteriaKey;

  if (criteriaKey === "budget") {
    return {
      ...criteria,
      maxPrice: undefined,
      minPrice: undefined,
    };
  }

  if (
    ["minBedrooms", "minBathrooms", "minArea", "maxArea"].includes(
      criteriaKey,
    )
  ) {
    return {
      ...criteria,
      [criteriaKey]: undefined,
    };
  }

  if (["amenities", "requiredAmenities"].includes(criteriaKey)) {
    return removeSelectedSearchAmenity(criteria, criterion);
  }

  if (
    ["propertyTypes", "districts", "keywords", "nearbyPlaces"].includes(
      criteriaKey,
    )
  ) {
    const normalizedValue = getNormalizedCriteriaValue(criterion.value);
    const nextCriteria = {
      ...criteria,
      [criteriaKey]: (criteria[criteriaKey] ?? []).filter(
        (value) => getNormalizedCriteriaValue(value) !== normalizedValue,
      ),
    };

    if (
      ["districts", "keywords", "nearbyPlaces"].includes(criteriaKey) &&
      !hasLocationCriteria(nextCriteria)
    ) {
      nextCriteria.city = "";
    }

    return nextCriteria;
  }

  return criteria;
}

function buildSearchCriteriaMessage(criteria = {}) {
  const propertyTypes = (criteria.propertyTypes ?? []).filter(Boolean);
  const subject = propertyTypes.length
    ? propertyTypes.join(" hoặc ").toLowerCase()
    : "tin đăng";
  const parts = [];

  if (criteria.districts?.length) {
    parts.push(`ở ${criteria.districts.join(", ")}`);
  }

  if (criteria.keywords?.length) {
    parts.push(`trong ${criteria.keywords.join(", ")}`);
  }

  if (criteria.nearbyPlaces?.length) {
    parts.push(`gần ${criteria.nearbyPlaces.join(", ")}`);
  }

  const budgetLabel = buildCriteriaBudgetSearchPhrase(criteria);

  if (budgetLabel) {
    parts.push(`ngân sách ${budgetLabel}`);
  }

  if (criteria.minBedrooms) {
    parts.push(`từ ${criteria.minBedrooms} phòng ngủ`);
  }

  if (criteria.minBathrooms) {
    parts.push(`từ ${criteria.minBathrooms} WC`);
  }

  if (criteria.minArea) {
    parts.push(`từ ${criteria.minArea}m²`);
  }

  if (criteria.maxArea) {
    parts.push(`dưới ${criteria.maxArea}m²`);
  }

  if (criteria.requiredAmenities?.length) {
    parts.push(`cần ${criteria.requiredAmenities.join(", ")}`);
  }

  if (criteria.amenities?.length) {
    parts.push(`ưu tiên ${criteria.amenities.join(", ")}`);
  }

  if (parts.length) {
    return `Tìm lại ${subject} ${parts.join(", ")}.`;
  }

  return "Tìm lại tin đăng với ít tiêu chí hơn.";
}

function SearchListingCard({ listing }) {
  const specs = getListingSpecs(listing);
  const matchReasons = Array.isArray(listing.matchReasons)
    ? listing.matchReasons.filter(Boolean).slice(0, 3)
    : [];
  const tags = [
    listing.propertyType,
    listing.furnishing,
    ...(listing.amenities ?? []).slice(0, 2).map(getListingAmenityLabel),
    ...(listing.nearbyPlaces ?? []).slice(0, 2),
  ].filter(Boolean);
  const href = getListingDetailHref(listing);
  const cardContent = (
    <article className="overflow-hidden rounded-[16px] border border-[#E1E9E1] bg-white shadow-sm transition group-hover:border-[#A7D4B0] group-hover:shadow-[0_12px_26px_rgba(42,106,56,0.12)]">
      {listing.imageUrl ? (
        <img
          alt={listing.title}
          className="h-28 w-full object-cover"
          loading="lazy"
          src={listing.imageUrl}
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-[#EEF6EF] text-[#2A7A3A]">
          <Home className="size-7" />
        </div>
      )}
      <div className="space-y-2 px-3 py-3">
        <div>
          <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-[#1F2A24]">
            {listing.title}
          </h3>
          <p className="mt-1 text-[13px] font-bold text-[#247D38]">
            {listing.priceLabel}
          </p>
        </div>

        {listing.location ? (
          <p className="flex items-start gap-1.5 text-[12px] leading-4 text-[#68736D]">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {listing.projectName ? `${listing.projectName}, ` : ""}
              {listing.location}
            </span>
          </p>
        ) : null}

        {specs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {specs.map(({ icon: Icon, label }) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-[#F1F8F2] px-2 py-1 text-[11px] font-semibold text-[#356A3F]"
                key={label}
              >
                <Icon className="size-3" />
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {matchReasons.length ? (
          <div className="rounded-[12px] bg-[#F2FAF3] px-2.5 py-2 text-[11px] leading-4 text-[#356A3F]">
            <p className="mb-1 font-bold">Phù hợp vì:</p>
            <ul className="space-y-1">
              {matchReasons.map((reason) => (
                <li className="flex gap-1.5" key={reason}>
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#2F954B]" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span
                className="rounded-full border border-[#DDEBDD] px-2 py-1 text-[11px] font-medium text-[#526057]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );

  if (!href) {
    return cardContent;
  }

  return (
    <a
      aria-label={`Mở tin đăng ${listing.title} trong tab mới`}
      className="group block focus:outline-none focus:ring-2 focus:ring-[#BDE8C7] focus:ring-offset-2"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {cardContent}
    </a>
  );
}

function getRefinementOptionLabel(option) {
  if (typeof option === "string") {
    return option;
  }

  return option?.label ?? "";
}

function getRefinementOptionMessage(option) {
  if (typeof option === "string") {
    return option;
  }

  return option?.message ?? option?.label ?? "";
}

function clearSearchCriteriaLocation(criteria = {}) {
  return {
    ...criteria,
    city: "",
    districts: [],
    keywords: [],
    nearbyPlaces: [],
  };
}

function mergeUniqueValues(values = [], nextValues = []) {
  return [...values, ...nextValues].filter(
    (value, index, allValues) =>
      value && allValues.findIndex((item) => item === value) === index,
  );
}

function hasPatchValue(patch = {}, key) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

function getPatchArrayValue(patch = {}, key) {
  return Array.isArray(patch[key]) ? patch[key].filter(Boolean) : [];
}

function mergeSearchCriteriaPatch(criteria = {}, patch = {}) {
  const replacesLocation =
    hasPatchValue(patch, "city") || hasPatchValue(patch, "districts");
  const replacesPropertyType = hasPatchValue(patch, "propertyTypes");

  return {
    ...criteria,
    ...patch,
    amenities: mergeUniqueValues(criteria.amenities, patch.amenities),
    districts: replacesLocation
      ? getPatchArrayValue(patch, "districts")
      : mergeUniqueValues(criteria.districts, patch.districts),
    keywords: replacesLocation
      ? getPatchArrayValue(patch, "keywords")
      : mergeUniqueValues(criteria.keywords, patch.keywords),
    nearbyPlaces: replacesLocation
      ? getPatchArrayValue(patch, "nearbyPlaces")
      : mergeUniqueValues(criteria.nearbyPlaces, patch.nearbyPlaces),
    propertyTypes: replacesPropertyType
      ? getPatchArrayValue(patch, "propertyTypes")
      : mergeUniqueValues(criteria.propertyTypes, patch.propertyTypes),
    requiredAmenities: mergeUniqueValues(
      criteria.requiredAmenities,
      patch.requiredAmenities,
    ),
  };
}

function getSearchCriteriaForRefinement(criteria, option) {
  if (Array.isArray(option)) {
    return option.reduce(
      (currentCriteria, item) =>
        getSearchCriteriaForRefinement(currentCriteria, item),
      criteria,
    );
  }

  if (typeof option === "string") {
    return criteria;
  }

  if (option?.resetLocation) {
    return clearSearchCriteriaLocation(criteria);
  }

  if (option?.criteriaPatch) {
    return mergeSearchCriteriaPatch(criteria, option.criteriaPatch);
  }

  return criteria;
}

function buildMultiSelectRefinementMessage(prompt, options) {
  const values = options
    .map((option) => option?.value ?? option?.label ?? "")
    .filter(Boolean);

  if (!values.length) {
    return "";
  }

  if (prompt?.messagePrefix) {
    return `${prompt.messagePrefix}${values.join(", ")}.`;
  }

  return getRefinementOptionMessage(options[0]);
}

function mergeListingResults(currentListings = [], nextListings = []) {
  const seen = new Set();

  return [...currentListings, ...nextListings].filter((listing) => {
    const listingKey = String(listing?.id ?? listing?.title ?? "").trim();

    if (!listingKey || seen.has(listingKey)) {
      return false;
    }

    seen.add(listingKey);
    return true;
  });
}

function getCriteriaChipClass(tone) {
  return tone === "preference"
    ? "border border-[#B7D9BE] bg-white text-[#2F6E3A] hover:border-[#8BC79A] hover:bg-[#F3FBF4]"
    : "border border-transparent bg-[#E4F5E7] text-[#286E36] hover:border-[#B7D9BE] hover:bg-[#D9F0DE]";
}

function RecognizedCriteriaPanel({
  criteria,
  criteriaLabels,
  disabled,
  onRemoveCriterion,
  recognizedCriteria,
}) {
  const criteriaChips = getRecognizedCriteriaChips(criteria);
  const requiredCriteria = recognizedCriteria?.required?.length
    ? recognizedCriteria.required
    : criteriaLabels;
  const preferences = recognizedCriteria?.preferences ?? [];

  if (!criteriaChips.length && !requiredCriteria.length && !preferences.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#DDEEDD] bg-[#F7FCF7] px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[#286E36]">
        <CheckCircle2 className="size-3.5" />
        AI đã ghi nhận
      </div>
      <div className="flex flex-wrap gap-1.5">
        {criteriaChips.length
          ? criteriaChips.map((chip) => (
              <button
                aria-label={`Bỏ tiêu chí ${chip.label}`}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-left text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BDE8C7] disabled:cursor-not-allowed disabled:opacity-60 ${getCriteriaChipClass(chip.tone)}`}
                disabled={disabled}
                key={chip.key}
                title={`Bỏ ${chip.label}`}
                type="button"
                onClick={() => onRemoveCriterion?.(chip)}
              >
                <span className="truncate">{chip.label}</span>
                <X className="size-3 shrink-0" />
              </button>
            ))
          : requiredCriteria.slice(0, 8).map((label) => (
              <span
                className="rounded-full bg-[#E4F5E7] px-2.5 py-1 text-[11px] font-semibold text-[#286E36]"
                key={`required-${label}`}
              >
                {label}
              </span>
            ))}
        {!criteriaChips.length
          ? preferences.slice(0, 4).map((label) => (
              <span
                className="rounded-full border border-[#B7D9BE] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2F6E3A]"
                key={`preference-${label}`}
              >
                Ưu tiên {label}
              </span>
            ))
          : null}
      </div>
    </div>
  );
}

const REFINEMENT_OPTION_CLASS =
  "rounded-full border px-2.5 py-1 text-left text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BDE8C7] disabled:cursor-not-allowed disabled:opacity-60";

function SearchRefinementPanel({ disabled, onSelectRefinement, prompt }) {
  const [selectedLabels, setSelectedLabels] = useState([]);

  if (!prompt?.question) {
    return null;
  }

  const options = Array.isArray(prompt.options) ? prompt.options : [];
  const visibleOptions = prompt.multiSelect
    ? options.slice(0, 8)
    : options.slice(0, 5);
  const selectedOptions = visibleOptions.filter((option) =>
    selectedLabels.includes(getRefinementOptionLabel(option)),
  );

  function toggleOption(option) {
    const label = getRefinementOptionLabel(option);

    setSelectedLabels((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  function handleMultiSelectSubmit() {
    if (!selectedOptions.length) {
      return;
    }

    onSelectRefinement(
      selectedOptions,
      buildMultiSelectRefinementMessage(prompt, selectedOptions),
    );
  }

  return (
    <div className="rounded-2xl bg-[#F1F8F2] px-3 py-2.5 text-[#2C6338]">
      <p className="text-[13px] font-semibold leading-5">{prompt.question}</p>
      {visibleOptions.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visibleOptions.map((option) => {
            const label = getRefinementOptionLabel(option);
            const message = getRefinementOptionMessage(option);
            const isMultiSelectable = prompt.multiSelect && !option?.exclusive;
            const isSelected =
              isMultiSelectable && selectedLabels.includes(label);

            return (
              <button
                aria-pressed={isMultiSelectable ? isSelected : undefined}
                className={`${REFINEMENT_OPTION_CLASS} ${
                  isSelected
                    ? "border-[#247D38] bg-[#247D38] text-white hover:bg-[#1F6F31]"
                    : "border-[#B7D9BE] bg-white text-[#286E36] hover:border-[#8BC79A] hover:bg-[#F8FFF8]"
                }`}
                disabled={disabled || !message}
                key={label}
                type="button"
                onClick={() =>
                  isMultiSelectable
                    ? toggleOption(option)
                    : onSelectRefinement(option)
                }
              >
                {isSelected ? (
                  <CheckCheck className="mr-1 inline size-3" />
                ) : null}
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
      {prompt.multiSelect ? (
        <button
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#247D38] px-3 py-2 text-[12px] font-bold text-white transition hover:bg-[#1F6F31] focus:outline-none focus:ring-2 focus:ring-[#BDE8C7] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || !selectedOptions.length}
          type="button"
          onClick={handleMultiSelectSubmit}
        >
          <Send className="size-3.5" />
          {prompt.submitLabel ?? "Tìm với tiêu chí đã chọn"}
          {selectedOptions.length ? ` (${selectedOptions.length})` : ""}
        </button>
      ) : null}
    </div>
  );
}

function SelectedAmenityRelaxationPanel({
  amenities,
  disabled,
  onRemoveAmenity,
}) {
  if (!amenities.length) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-[#FFF8EC] px-3 py-2.5 text-[#76521B]">
      <p className="text-[13px] font-bold leading-5">Tiện ích đang chọn</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {amenities.map((amenity) => (
          <button
            aria-label={`Bỏ tiện ích ${amenity.label}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E6C88B] bg-white px-2.5 py-1 text-left text-[11px] font-semibold text-[#76521B] transition hover:border-[#D8A947] hover:bg-[#FFF3D6] focus:outline-none focus:ring-2 focus:ring-[#F2C15B] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            key={`${amenity.criteriaKey}-${amenity.value}`}
            title={`Bỏ ${amenity.label}`}
            type="button"
            onClick={() => onRemoveAmenity(amenity)}
          >
            <span className="truncate">
              {amenity.prefix} {amenity.label}
            </span>
            <X className="size-3 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadMoreListingsButton({ disabled, isLoading, onClick }) {
  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#B7D9BE] bg-white px-3 py-2.5 text-[13px] font-bold text-[#286E36] transition hover:border-[#8BC79A] hover:bg-[#F3FBF4] focus:outline-none focus:ring-2 focus:ring-[#BDE8C7] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || isLoading}
      type="button"
      onClick={onClick}
    >
      {isLoading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <MoreHorizontal className="size-4" />
      )}
      Xem thêm tin đăng
    </button>
  );
}

function SearchResultContent({
  disabled,
  isLoadingMore,
  onLoadMoreListings,
  onRemoveAmenity,
  onRemoveCriterion,
  onSelectRefinement,
  result,
}) {
  const listings = result?.listings ?? [];
  const hasMoreListings = Boolean(result?.pagination?.hasMore);
  const criteriaLabels = result?.criteriaLabels ?? [];
  const refinementPrompt = result?.refinementPrompt;
  const followUpPrompt = result?.followUpPrompt;
  const blockingRefinementPrompt = refinementPrompt?.blocksSearch
    ? refinementPrompt
    : null;
  const nextRefinementPrompt =
    refinementPrompt && !refinementPrompt.blocksSearch
      ? refinementPrompt
      : followUpPrompt;
  const selectedAmenities = getSelectedSearchAmenities(result?.criteria);
  const hasBudgetCriteria = Boolean(
    result?.criteria?.maxPrice || result?.criteria?.minPrice,
  );
  const showAmenityRelaxation =
    !listings.length &&
    !blockingRefinementPrompt &&
    hasBudgetCriteria &&
    selectedAmenities.length;

  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line">{result?.reply}</p>

      <RecognizedCriteriaPanel
        criteria={result?.criteria}
        criteriaLabels={criteriaLabels}
        disabled={disabled}
        onRemoveCriterion={onRemoveCriterion}
        recognizedCriteria={result?.recognizedCriteria}
      />

      {showAmenityRelaxation ? (
        <SelectedAmenityRelaxationPanel
          amenities={selectedAmenities}
          disabled={disabled}
          onRemoveAmenity={onRemoveAmenity}
        />
      ) : null}

      <SearchRefinementPanel
        disabled={disabled}
        prompt={blockingRefinementPrompt}
        onSelectRefinement={onSelectRefinement}
      />

      {listings.length ? (
        <div className="space-y-2">
          {listings.map((listing) => (
            <SearchListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}

      <SearchRefinementPanel
        disabled={disabled}
        prompt={nextRefinementPrompt}
        onSelectRefinement={onSelectRefinement}
      />

      {hasMoreListings ? (
        <LoadMoreListingsButton
          disabled={disabled}
          isLoading={isLoadingMore}
          onClick={onLoadMoreListings}
        />
      ) : null}

      {result?.loadMoreError ? (
        <p className="rounded-2xl bg-[#FFF7F0] px-3 py-2 text-[12px] leading-5 text-[#9A4D15]">
          {result.loadMoreError}
        </p>
      ) : null}
    </div>
  );
}

function FaqAnswerContent({ answer }) {
  return (
    <div className="space-y-3">
      {answer.intro ? <p>{answer.intro}</p> : null}

      {Array.isArray(answer.steps) && answer.steps.length ? (
        <ol className="space-y-2">
          {answer.steps.map((step, index) => (
            <li className="flex gap-3" key={step}>
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#247D38] text-xs font-bold leading-none text-white">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {Array.isArray(answer.bullets) && answer.bullets.length ? (
        <ul className="space-y-1.5">
          {answer.bullets.map((bullet) => (
            <li className="flex gap-2" key={bullet}>
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2F954B]" />
              <span className="min-w-0 flex-1">{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {answer.note ? (
        <p className="rounded-2xl bg-[#F0F8F1] px-3 py-2 text-[13px] leading-5 text-[#356A3F]">
          {answer.note}
        </p>
      ) : null}
    </div>
  );
}

function FaqChip({ disabled = false, faq, onSelect }) {
  return (
    <button
      className="w-fit max-w-full rounded-full border border-[#B7D9BE] bg-white px-3.5 py-2 text-left text-[13px] font-semibold leading-tight text-[#286E36] transition hover:border-[#8BC79A] hover:bg-[#F3FBF4] disabled:opacity-60"
      disabled={disabled}
      type="button"
      onClick={() => onSelect(faq)}
    >
      {faq.question}
    </button>
  );
}

function MoreFaqButton({ disabled = false, onClick }) {
  return (
    <button
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#B7D9BE] bg-white px-3.5 py-2 text-left text-[13px] font-semibold leading-tight text-[#286E36] transition hover:border-[#8BC79A] hover:bg-[#F3FBF4] disabled:opacity-60"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <MoreHorizontal className="size-4 shrink-0" />
      Câu hỏi khác
    </button>
  );
}

function InitialFaqSuggestions({ disabled, faqPage, onMore, onSelect }) {
  const faqIds =
    faqPage === 0
      ? POPULAR_FAQ_IDS
      : MORE_FAQ_GROUPS[(faqPage - 1) % MORE_FAQ_GROUPS.length];
  const items = getFaqItems(faqIds);

  return (
    <div className="ml-11 w-[80%] rounded-[18px] border border-[#DDEEDD] bg-[#F1FAF2] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#286E36]">
        <Lightbulb className="size-4 text-[#E0A500]" />
        Gợi ý cho bạn:
      </div>
      <div className="flex flex-col items-start gap-2">
        {items.map((faq) => (
          <FaqChip
            disabled={disabled}
            faq={faq}
            key={faq.id}
            onSelect={onSelect}
          />
        ))}
        <MoreFaqButton disabled={disabled} onClick={onMore} />
      </div>
    </div>
  );
}

function RelatedFaqSuggestions({ disabled, ids, onMore, onSelect, page }) {
  const faqIds =
    page === 0 ? ids : MORE_FAQ_GROUPS[(page - 1) % MORE_FAQ_GROUPS.length];
  const items = getFaqItems(faqIds).slice(0, 4);

  if (!items.length) {
    return null;
  }

  return (
    <div className="ml-11 w-[80%] rounded-[18px] border border-[#DDEEDD] bg-[#F1FAF2] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#286E36]">
        <Lightbulb className="size-4 text-[#E0A500]" />
        Gợi ý cho bạn:
      </div>
      <div className="flex flex-col items-start gap-2">
        {items.map((faq) => (
          <FaqChip
            disabled={disabled}
            faq={faq}
            key={faq.id}
            onSelect={onSelect}
          />
        ))}
        <MoreFaqButton disabled={disabled} onClick={onMore} />
      </div>
    </div>
  );
}

function AiAvatar({ compact = false }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-[#E3F3E6] text-[#247D38] shadow-inner ${
        compact ? "size-9" : "size-10"
      }`}
    >
      <Bot className={compact ? "size-5" : "size-6"} />
      <Sparkles
        className={`absolute -right-0.5 -top-0.5 text-[#38A957] ${
          compact ? "size-3" : "size-3.5"
        }`}
      />
    </span>
  );
}

function AiChatWidget({ currentUser, currentView }) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingMoreSearchMessageId, setLoadingMoreSearchMessageId] =
    useState("");
  const [faqPage, setFaqPage] = useState(0);
  const [relatedFaqPages, setRelatedFaqPages] = useState({});
  const [searchCriteriaContext, setSearchCriteriaContext] = useState(null);
  const [isAwaitingSearchAnswer, setIsAwaitingSearchAnswer] = useState(false);
  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
  const scrollRef = useRef(null);
  const scrollTargetMessageIdRef = useRef("");
  const textareaRef = useRef(null);

  const context = useMemo(
    () => ({
      currentView,
      isAuthenticated: Boolean(currentUser),
      kycStatus: currentUser?.kycStatus
        ? getKycStatusLabel(currentUser.kycStatus)
        : undefined,
    }),
    [currentUser, currentView],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollContainer = scrollRef.current;

    if (!scrollContainer) {
      return;
    }

    const scrollTargetMessageId = scrollTargetMessageIdRef.current;

    if (scrollTargetMessageId) {
      const targetElement = scrollContainer.querySelector(
        `[data-chat-message-id="${scrollTargetMessageId}"]`,
      );

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        scrollTargetMessageIdRef.current = "";
        return;
      }
    }

    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [isOpen, isSending, loadingMoreSearchMessageId, messages]);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  async function submitMessage(content, quickAction, options = {}) {
    const trimmedContent = content.trim();

    if (!trimmedContent || isSending) {
      return;
    }

    const userMessage = createChatMessage("user", trimmedContent);
    const previousMessages = messages;
    const previousSearchCriteria =
      options.previousSearchCriteria ?? searchCriteriaContext ?? {};
    const selectedFaq = options.faqId ? getFaqById(options.faqId) : null;
    const hasSearchContext = hasActiveSearchCriteria(previousSearchCriteria);
    const isAnsweringSearchQuestion =
      isAwaitingSearchAnswer && !findFaqByQuestion(trimmedContent);
    const shouldSearchProperties =
      !selectedFaq &&
      (options.forcePropertySearch ||
        isAnsweringSearchQuestion ||
        isPropertySearchQuestion(trimmedContent) ||
        (hasSearchContext && isPropertySearchFollowUpQuestion(trimmedContent)));
    const matchedFaq =
      selectedFaq ??
      (!shouldSearchProperties ? findFaqByQuestion(trimmedContent) : null);

    setInput("");
    setMessages((current) =>
      [...current, userMessage].slice(-MAX_VISIBLE_HISTORY),
    );

    if (matchedFaq) {
      const assistantMessage = createChatMessage(
        "assistant",
        matchedFaq.question,
        {
          answer: matchedFaq.answer,
          relatedQuestionIds: matchedFaq.related,
          source: "faq",
        },
      );

      setSearchCriteriaContext(null);
      setIsAwaitingSearchAnswer(false);
      scrollTargetMessageIdRef.current = assistantMessage.id;
      setMessages((current) =>
        [...current, assistantMessage].slice(-MAX_VISIBLE_HISTORY),
      );
      return;
    }

    if (shouldSearchProperties) {
      setIsSending(true);

      try {
        const response = await searchListingsWithAi({
          limit: SEARCH_LISTING_PAGE_SIZE,
          message: trimmedContent,
          previousCriteria: previousSearchCriteria,
        });
        const result = response.data ?? {};
        const assistantReply =
          result.reply ||
          "Mình chưa tìm thấy tin phù hợp trong dữ liệu WeRent. Bạn thử thêm khu vực, ngân sách hoặc loại nhà nhé.";
        const assistantMessage = createChatMessage(
          "assistant",
          assistantReply,
          {
            searchResult: {
              ...result,
              request: {
                message: trimmedContent,
                previousCriteria: previousSearchCriteria,
              },
              reply: assistantReply,
            },
            source: "property-search",
          },
        );

        if (result.criteria) {
          setSearchCriteriaContext(result.criteria);
        }
        setIsAwaitingSearchAnswer(
          Boolean(result.refinementPrompt?.blocksSearch),
        );
        scrollTargetMessageIdRef.current = assistantMessage.id;
        setMessages((current) =>
          [...current, assistantMessage].slice(-MAX_VISIBLE_HISTORY),
        );
      } catch (error) {
        setMessages((current) =>
          [
            ...current,
            createChatMessage(
              "assistant",
              error.message ||
                "Mình chưa thể tìm tin đăng lúc này. Bạn thử lại sau ít phút nhé.",
              { isError: true },
            ),
          ].slice(-MAX_VISIBLE_HISTORY),
        );
      } finally {
        setIsSending(false);
      }

      return;
    }

    setIsSending(true);

    try {
      const response = await sendAiChatMessage({
        context: {
          ...context,
          quickAction,
        },
        message: trimmedContent,
        messages: buildHistory(previousMessages),
      });
      const reply = response.data?.reply?.trim();
      setSearchCriteriaContext(null);
      setIsAwaitingSearchAnswer(false);

      setMessages((current) =>
        [
          ...current,
          createChatMessage(
            "assistant",
            reply ||
              "Tôi chưa có câu trả lời phù hợp. Bạn thử diễn đạt lại giúp tôi nhé.",
            {
              relatedQuestionIds: getRelatedFaqIdsForText(trimmedContent),
            },
          ),
        ].slice(-MAX_VISIBLE_HISTORY),
      );
    } catch (error) {
      setMessages((current) =>
        [
          ...current,
          createChatMessage(
            "assistant",
            error.message ||
              "Tôi chưa thể kết nối lúc này. Bạn thử lại sau ít phút nhé.",
            { isError: true },
          ),
        ].slice(-MAX_VISIBLE_HISTORY),
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleLoadMoreSearchListings(message) {
    const searchResult = message.searchResult ?? {};
    const pagination = searchResult.pagination ?? {};

    if (!pagination.hasMore || isSending || loadingMoreSearchMessageId) {
      return;
    }

    const searchRequest = searchResult.request ?? {};
    const searchMessage = searchRequest.message || message.content || "";
    const nextOffset =
      pagination.nextOffset ?? (searchResult.listings ?? []).length;

    setLoadingMoreSearchMessageId(message.id);
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? {
              ...item,
              searchResult: {
                ...item.searchResult,
                loadMoreError: "",
              },
            }
          : item,
      ),
    );

    try {
      const response = await searchListingsWithAi({
        limit: SEARCH_LISTING_PAGE_SIZE,
        message: searchMessage,
        offset: nextOffset,
        previousCriteria:
          searchResult.criteria ??
          searchRequest.previousCriteria ??
          searchCriteriaContext ??
          {},
      });
      const result = response.data ?? {};

      setMessages((current) =>
        current.map((item) => {
          if (item.id !== message.id) {
            return item;
          }

          const currentSearchResult = item.searchResult ?? searchResult;
          const listings = mergeListingResults(
            currentSearchResult.listings,
            result.listings,
          );
          const nextSearchResult = {
            ...currentSearchResult,
            ...result,
            listings,
            loadMoreError: "",
            request: {
              message: searchMessage,
              previousCriteria:
                searchRequest.previousCriteria ?? searchResult.criteria ?? {},
            },
            reply: result.reply || currentSearchResult.reply,
          };

          return {
            ...item,
            content: nextSearchResult.reply || item.content,
            searchResult: nextSearchResult,
          };
        }),
      );

      if (result.criteria) {
        setSearchCriteriaContext(result.criteria);
      }
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                searchResult: {
                  ...item.searchResult,
                  loadMoreError:
                    error.message ||
                    "Không thể tải thêm tin đăng lúc này. Bạn thử lại sau nhé.",
                },
              }
            : item,
        ),
      );
    } finally {
      setLoadingMoreSearchMessageId("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage(input);
  }

  function handleFaqSelect(faq) {
    submitMessage(faq.question, faq.category, { faqId: faq.id });
  }

  function handleMoreFaqs() {
    setFaqPage((current) => current + 1);
  }

  function handleMoreRelatedFaqs(messageId) {
    setRelatedFaqPages((current) => ({
      ...current,
      [messageId]: (current[messageId] ?? 0) + 1,
    }));
  }

  function handleSearchRefinementSelect(option, combinedMessage) {
    const nextMessage = combinedMessage || getRefinementOptionMessage(option);
    const nextSearchCriteria = getSearchCriteriaForRefinement(
      searchCriteriaContext ?? {},
      option,
    );

    if (!nextMessage) {
      return;
    }

    submitMessage(nextMessage, "property-search-refine", {
      forcePropertySearch: true,
      previousSearchCriteria: nextSearchCriteria,
    });
  }

  function handleRemoveSearchCriterion(result, criterion) {
    const nextSearchCriteria = removeSearchCriterion(
      result?.criteria ?? searchCriteriaContext ?? {},
      criterion,
    );

    submitMessage(
      buildSearchCriteriaMessage(nextSearchCriteria),
      "property-search-refine",
      {
        forcePropertySearch: true,
        previousSearchCriteria: nextSearchCriteria,
      },
    );
  }

  function handleRemoveSearchAmenity(result, selection) {
    const nextSearchCriteria = removeSelectedSearchAmenity(
      result?.criteria ?? searchCriteriaContext ?? {},
      selection,
    );

    submitMessage(
      buildSearchCriteriaMessage(nextSearchCriteria),
      "property-search-refine",
      {
        forcePropertySearch: true,
        previousSearchCriteria: nextSearchCriteria,
      },
    );
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  if (!isOpen) {
    return (
      <button
        aria-label="Mở Trợ lý AI WeRent"
        className="werent-ai-shimmer fixed bottom-8 right-5 z-[80] flex size-16 items-center justify-center rounded-full bg-[#247D38] text-white shadow-[0_18px_42px_rgba(36,125,56,0.32)] transition hover:bg-[#1F6F31] focus:outline-none focus:ring-4 focus:ring-[#BDE8C7]"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="size-8" />
      </button>
    );
  }

  return (
    <section
      aria-label="Trợ lý AI WeRent"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-[440px] rounded-[24px] border border-[#DFE7DE] bg-white shadow-[0_24px_70px_rgba(44,64,51,0.2)] sm:bottom-5 sm:right-5 sm:left-auto sm:mx-0"
    >
      <header className="flex items-center gap-2.5 border-b border-[#EEF2EE] px-4 py-2.5">
        <AiAvatar />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[15px] font-bold leading-5 text-[#1D2B22]">
              Trợ lý AI WeRent
            </h2>
            <Sparkles className="size-3.5 shrink-0 text-[#38A957]" />
          </div>
          <p className="truncate text-[11px] leading-4 text-[#68736D]">
            Hỗ trợ tìm nhà, đăng tin và giải đáp nhanh
          </p>
        </div>
        <button
          aria-label="Thu nhỏ chatbot"
          className="flex size-8 items-center justify-center rounded-lg text-[#47524B] transition hover:bg-[#F0F4F1]"
          title="Thu nhỏ"
          type="button"
          onClick={() => setIsOpen(false)}
        >
          <Minus className="size-4" />
        </button>
        <button
          aria-label="Đóng chatbot"
          className="flex size-8 items-center justify-center rounded-lg text-[#47524B] transition hover:bg-[#F0F4F1]"
          title="Đóng"
          type="button"
          onClick={() => setIsOpen(false)}
        >
          <X className="size-4" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="max-h-[440px] min-h-[310px] overflow-y-auto px-4 py-5 sm:max-h-[58vh]"
      >
        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                className="space-y-3"
                data-chat-message-id={message.id}
                key={message.id}
              >
                <div
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser ? <AiAvatar compact /> : null}
                  <div
                    className={`max-w-[80%] rounded-[18px] px-4 py-3 text-sm leading-6 shadow-sm ${
                      isUser
                        ? "rounded-br-md border border-[#D3E8D7] bg-[#EAF7E9] text-[#203124]"
                        : message.isError
                          ? "rounded-bl-md border border-[#F4D2D2] bg-[#FFF7F7] text-[#8A2626]"
                          : "rounded-bl-md border border-[#E5EAE4] bg-[#FBFCFA] text-[#26312B]"
                    }`}
                  >
                    {message.searchResult ? (
                      <SearchResultContent
                        disabled={
                          isSending || Boolean(loadingMoreSearchMessageId)
                        }
                        isLoadingMore={
                          loadingMoreSearchMessageId === message.id
                        }
                        result={message.searchResult}
                        onLoadMoreListings={() =>
                          handleLoadMoreSearchListings(message)
                        }
                        onRemoveCriterion={(criterion) =>
                          handleRemoveSearchCriterion(
                            message.searchResult,
                            criterion,
                          )
                        }
                        onRemoveAmenity={(selection) =>
                          handleRemoveSearchAmenity(
                            message.searchResult,
                            selection,
                          )
                        }
                        onSelectRefinement={handleSearchRefinementSelect}
                      />
                    ) : message.answer ? (
                      <FaqAnswerContent answer={message.answer} />
                    ) : (
                      <p className="whitespace-pre-line">{message.content}</p>
                    )}
                    <div
                      className={`mt-2 flex items-center gap-1 text-[11px] ${
                        isUser ? "justify-end text-[#5C7B63]" : "text-[#7D8881]"
                      }`}
                    >
                      <span>{getDisplayTime(message.createdAt)}</span>
                      {isUser ? <CheckCheck className="size-3.5" /> : null}
                    </div>
                  </div>
                </div>

                {message.showInitialFaq ? (
                  <InitialFaqSuggestions
                    disabled={isSending}
                    faqPage={faqPage}
                    onMore={handleMoreFaqs}
                    onSelect={handleFaqSelect}
                  />
                ) : null}

                {!isUser && message.relatedQuestionIds?.length ? (
                  <RelatedFaqSuggestions
                    disabled={isSending}
                    ids={message.relatedQuestionIds}
                    page={relatedFaqPages[message.id] ?? 0}
                    onMore={() => handleMoreRelatedFaqs(message.id)}
                    onSelect={handleFaqSelect}
                  />
                ) : null}
              </div>
            );
          })}

          {isSending ? (
            <div className="flex items-end gap-2">
              <AiAvatar compact />
              <div className="flex items-center gap-2 rounded-[18px] rounded-bl-md border border-[#E5EAE4] bg-[#FBFCFA] px-4 py-3 text-sm text-[#647069] shadow-sm">
                <LoaderCircle className="size-4 animate-spin" />
                Đang trả lời...
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#EEF2EE] px-3 py-2.5">
        <form
          className="flex items-end gap-2 rounded-[16px] border border-[#DCE5DD] bg-white p-1.5 shadow-sm focus-within:border-[#9FD1AA] focus-within:ring-4 focus-within:ring-[#E5F6E8]"
          onSubmit={handleSubmit}
        >
          <Sparkles className="mb-2 ml-1 size-4 shrink-0 text-[#9EAAA2]" />
          <textarea
            className="max-h-24 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-[#1F2A24] outline-none placeholder:text-[#9AA4A0]"
            disabled={isSending}
            placeholder="Nhập câu hỏi của bạn..."
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button
            aria-label="Gửi tin nhắn"
            className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-[#247D38] text-white shadow-[0_10px_22px_rgba(36,125,56,0.24)] transition hover:bg-[#1F6F31] disabled:cursor-not-allowed disabled:bg-[#AAB6AE] disabled:shadow-none"
            disabled={isSending || !input.trim()}
            type="submit"
          >
            {isSending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AiChatWidget;
