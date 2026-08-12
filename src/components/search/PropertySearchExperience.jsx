import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Heart,
  Home,
  House,
  Landmark,
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  buildSearchStateFromKeyword,
  getListingSearchRelevanceScore,
} from "./propertySearchUtils";

const defaultPropertySearchState = Object.freeze({
  keyword: "",
  propertyType: "",
  city: "",
  district: "",
  ward: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  bedrooms: "",
  bathrooms: "",
});

const keywordSearchCarryoverFields = [
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "bedrooms",
  "bathrooms",
];

const fallbackAdministrativeDivisions = [
  {
    name: "TP. Hồ Chí Minh",
    districts: [
      {
        name: "Quận 1",
        wards: [{ name: "Phường Bến Nghé" }, { name: "Phường Bến Thành" }],
      },
      {
        name: "Quận 7",
        wards: [{ name: "Phường Tân Phong" }, { name: "Phường Tân Phú" }],
      },
      {
        name: "Quận Bình Thạnh",
        wards: [{ name: "Phường 22" }, { name: "Phường Bình An" }],
      },
      {
        name: "TP. Thủ Đức",
        wards: [{ name: "Phường An Phú" }, { name: "Phường Thảo Điền" }],
      },
    ],
  },
  {
    name: "Hà Nội",
    districts: [
      {
        name: "Quận Cầu Giấy",
        wards: [{ name: "Phường Dịch Vọng" }, { name: "Phường Nghĩa Tân" }],
      },
      {
        name: "Quận Nam Từ Liêm",
        wards: [{ name: "Phường Mỹ Đình 1" }, { name: "Phường Mễ Trì" }],
      },
    ],
  },
];

const propertyTypeOptions = [
  { label: "Tất cả loại hình", value: "", icon: Landmark },
  { label: "Căn hộ chung cư", value: "Căn hộ chung cư", icon: Building2 },
  { label: "Nhà nguyên căn", value: "Nhà nguyên căn", icon: House },
  { label: "Phòng trọ", value: "Phòng trọ", icon: Home },
  { label: "Chung cư mini", value: "Chung cư mini", icon: Building2 },
  { label: "Studio", value: "Studio", icon: BedDouble },
  { label: "Ký túc xá, ở ghép", value: "Ký túc xá, ở ghép", icon: Building2 },
];

const bedroomOptions = [
  { label: "Bất kỳ", value: "" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
];

const bathroomOptions = [
  { label: "Bất kỳ", value: "" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
];

const pricePresetOptions = [
  { label: "Dưới 5 triệu", minPrice: "0", maxPrice: "5000000" },
  { label: "5 - 10 triệu", minPrice: "5000000", maxPrice: "10000000" },
  { label: "10 - 15 triệu", minPrice: "10000000", maxPrice: "15000000" },
  { label: "Trên 15 triệu", minPrice: "15000000", maxPrice: "" },
];

const areaPresetOptions = [
  { label: "Dưới 30 m²", minArea: "0", maxArea: "30" },
  { label: "30 - 50 m²", minArea: "30", maxArea: "50" },
  { label: "50 - 80 m²", minArea: "50", maxArea: "80" },
  { label: "Trên 80 m²", minArea: "80", maxArea: "" },
];

const SEARCH_HISTORY_STORAGE_KEY = "werent.propertySearchHistory";
const SEARCH_HISTORY_LIMIT = 5;
const keywordSuggestionOptions = [
  "Căn hộ gần cầu Phú Mỹ",
  "Nhà nguyên căn hẻm xe hơi",
  "Phòng trọ giá rẻ sinh viên",
  "Chung cư cao cấp Quận 2",
  "Thuê nhà gần Đại học RMIT",
  "Vinhomes Grand Park, TP. Thủ Đức",
  "Landmark 81 Bình Thạnh",
];

const popularSearchCities = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng"];
const majorCitySuggestionPriorityMap = {
  "ho chi minh": 24,
  "hcm": 24,
  "tp ho chi minh": 24,
  "thanh pho ho chi minh": 24,
  "ha noi": 23,
  "thanh pho ha noi": 23,
  "da nang": 22,
  "thanh pho da nang": 22,
};
const intentSuggestionGroups = [
  {
    keywords: ["nha", "nha dat", "nha rieng", "nha nguyen can"],
    templates: [
      "Thuê nhà đất tại {city}",
      "Thuê nhà riêng tại {city}",
      "Thuê nhà liền kề tại {city}",
    ],
  },
  {
    keywords: ["phong", "phong tro", "phong cho thue", "nha tro"],
    templates: [
      "Phòng cho thuê tại {city}",
      "Thuê phòng trọ tại {city}",
      "Thuê văn phòng tại {city}",
    ],
  },
  {
    keywords: ["dat", "dat nen", "nha dat"],
    templates: ["Thuê đất tại {city}", "Thuê nhà đất tại {city}"],
  },
  {
    keywords: ["biet thu", "villa"],
    templates: [
      "Thuê biệt thự tại {city}",
      "Biệt thự cho thuê tại {city}",
      "Thuê villa tại {city}",
    ],
  },
  {
    keywords: ["can ho", "chung cu", "apartment"],
    templates: [
      "Thuê căn hộ tại {city}",
      "Căn hộ chung cư tại {city}",
      "Chung cư cho thuê tại {city}",
    ],
  },
  {
    keywords: ["van phong", "office"],
    templates: ["Thuê văn phòng tại {city}", "Văn phòng cho thuê tại {city}"],
  },
];
const locationSuggestionTemplates = [
  "Thuê BĐS tại {location}",
  "Thuê nhà đất tại {location}",
  "Thuê chung cư tại {location}",
  "Thuê phòng trọ tại {location}",
  "Thuê đất tại {location}",
  "Thuê biệt thự tại {location}",
  "Thuê shophouse tại {location}",
  "Thuê kho tại {location}",
];
const knownLocationSuggestionTargets = [
  {
    label: "Xã Phú Mỹ Hưng, Huyện Củ Chi, Hồ Chí Minh",
    aliases: ["phú mỹ hưng", "xã phú mỹ hưng", "phu my hung", "xa phu my hung"],
    priority: 30,
  },
  {
    label: "Phú Mỹ Hưng, Quận 7, Hồ Chí Minh",
    aliases: [
      "phú mỹ hưng",
      "khu phú mỹ hưng",
      "khu đô thị phú mỹ hưng",
      "phu my hung",
      "khu phu my hung",
    ],
    priority: 28,
  },
  {
    label: "Khu đô thị Sala, Quận 2, Hồ Chí Minh",
    aliases: ["sala", "khu sala", "khu sala quận 2", "khu do thi sala"],
    priority: 26,
  },
  {
    label: "Phường Thảo Điền, TP. Thủ Đức, Hồ Chí Minh",
    aliases: ["thảo điền", "phường thảo điền", "thao dien", "phuong thao dien"],
    priority: 24,
  },
  {
    label: "Quận Bình Tân, Hồ Chí Minh",
    aliases: ["bình tân", "quận bình tân", "binh tan", "quan binh tan"],
    priority: 23.5,
  },
  {
    label: "Quận Bình Thạnh, Hồ Chí Minh",
    aliases: ["bình thạnh", "quận bình thạnh", "binh thanh", "quan binh thanh"],
    priority: 23.5,
  },
  {
    label: "Quận 7, Hồ Chí Minh",
    aliases: ["quận 7", "q7", "quan 7"],
    priority: 23.5,
  },
  {
    label: "TP. Thủ Đức, Hồ Chí Minh",
    aliases: ["thủ đức", "tp thủ đức", "thu duc", "tp thu duc"],
    priority: 23.5,
  },
  {
    label: "Quận Cầu Giấy, Hà Nội",
    aliases: ["cầu giấy", "quận cầu giấy", "cau giay", "quan cau giay"],
    priority: 23,
  },
  {
    label: "Quận Thanh Xuân, Hà Nội",
    aliases: ["thanh xuân", "quận thanh xuân", "thanh xuan", "quan thanh xuan"],
    priority: 23,
  },
  {
    label: "Quận Nam Từ Liêm, Hà Nội",
    aliases: ["nam từ liêm", "quận nam từ liêm", "nam tu liem", "quan nam tu liem"],
    priority: 23,
  },
  {
    label: "Quận Ba Đình, Hà Nội",
    aliases: ["ba đình", "quận ba đình", "ba dinh", "quan ba dinh"],
    priority: 23,
  },
  {
    label: "Quận Hải Châu, Đà Nẵng",
    aliases: ["hải châu", "quận hải châu", "hai chau", "quan hai chau"],
    priority: 22,
  },
  {
    label: "Quận Sơn Trà, Đà Nẵng",
    aliases: ["sơn trà", "quận sơn trà", "son tra", "quan son tra"],
    priority: 22,
  },
  {
    label: "Quận Ngũ Hành Sơn, Đà Nẵng",
    aliases: ["ngũ hành sơn", "quận ngũ hành sơn", "ngu hanh son", "quan ngu hanh son"],
    priority: 22,
  },
  {
    label: "Hồ Chí Minh",
    aliases: ["hồ chí minh", "tp hcm", "tphcm", "sài gòn", "ho chi minh", "saigon"],
    priority: 18,
  },
  {
    label: "Hà Nội",
    aliases: ["hà nội", "ha noi"],
    priority: 17,
  },
  {
    label: "Đà Nẵng",
    aliases: ["đà nẵng", "da nang"],
    priority: 16,
  },
];

const tierPriorityMap = {
  vipDiamond: 4,
  vipGold: 3,
  vipSilver: 2,
  standard: 1,
};

function getAdministrativeDivisions(administrativeDivisions = []) {
  return administrativeDivisions.length
    ? administrativeDivisions
    : fallbackAdministrativeDivisions;
}

function getLocationLabel(searchState) {
  if (searchState.ward && searchState.district) {
    return searchState.ward;
  }

  if (searchState.district) {
    return searchState.district;
  }

  if (searchState.city) {
    return searchState.city;
  }

  return "Khu vực";
}

function getPropertyTypeLabel(value) {
  if (!value) {
    return "Loại BĐS";
  }

  if (value === "Nhà phố") {
    return "Nhà phố";
  }

  if (["Nhà đất", "Đất nền", "Biệt thự", "Văn phòng"].includes(value)) {
    return value;
  }

  return (
    propertyTypeOptions.find((option) => option.value === value)?.label ||
    "Loại BĐS"
  );
}

function getTierKey(listing) {
  return listing?.draft?.selectedTier || "standard";
}

function getTierLabel(listing) {
  const tierKey = getTierKey(listing);

  if (tierKey === "vipDiamond") {
    return "VIP Kim Cương";
  }

  if (tierKey === "vipGold") {
    return "VIP Vàng";
  }

  if (tierKey === "vipSilver") {
    return "VIP Bạc";
  }

  return "Tin thường";
}

function getTierBadgeClassName(listing) {
  const tierKey = getTierKey(listing);

  if (tierKey === "vipDiamond") {
    return "bg-[linear-gradient(135deg,#1E8B5B,#33C97A)] text-white";
  }

  if (tierKey === "vipGold") {
    return "bg-[linear-gradient(135deg,#B8841D,#E5B94E)] text-white";
  }

  if (tierKey === "vipSilver") {
    return "bg-[linear-gradient(135deg,#72839B,#B3C1D1)] text-white";
  }

  return "bg-[#F3F5F7] text-[#5F6976]";
}

function parseNumberValue(value) {
  const normalized = String(value ?? "").replace(/[^\d.]/g, "");
  return normalized ? Number(normalized) : 0;
}

function normalizePropertySearchState(searchState = {}) {
  return {
    ...defaultPropertySearchState,
    ...Object.fromEntries(
      Object.entries({ ...defaultPropertySearchState, ...searchState }).map(
        ([key, value]) => [
          key,
          key === "keyword" ? String(value ?? "") : String(value ?? "").trim(),
        ],
      ),
    ),
  };
}

function sortListingsBySearchPriority(listings = [], searchState = {}) {
  return [...listings].sort((left, right) => {
    const relevanceDiff =
      getListingSearchRelevanceScore(right, searchState) -
      getListingSearchRelevanceScore(left, searchState);

    if (relevanceDiff !== 0) {
      return relevanceDiff;
    }

    const tierDiff =
      (tierPriorityMap[getTierKey(right)] ?? 0) -
      (tierPriorityMap[getTierKey(left)] ?? 0);

    if (tierDiff !== 0) {
      return tierDiff;
    }

    const rightTime = new Date(
      right.publishedAtRaw || right.updatedAtRaw || right.createdAtRaw || 0,
    ).getTime();
    const leftTime = new Date(
      left.publishedAtRaw || left.updatedAtRaw || left.createdAtRaw || 0,
    ).getTime();

    return rightTime - leftTime;
  });
}

function formatCurrencyCompact(value) {
  const amount = parseNumberValue(value);

  if (!amount) {
    return "Thỏa thuận";
  }

  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: millions < 10 ? 1 : 0,
    }).format(millions)} triệu`;
  }

  return new Intl.NumberFormat("vi-VN").format(amount);
}

function buildActiveSearchChips(searchState) {
  const normalizedState = normalizePropertySearchState(searchState);
  const chips = [];

  if (
    normalizedState.district ||
    normalizedState.city ||
    normalizedState.ward
  ) {
    chips.push({
      key: "location",
      label: [
        normalizedState.ward,
        normalizedState.district,
        normalizedState.city,
      ]
        .filter(Boolean)
        .join(" • "),
    });
  }

  if (normalizedState.propertyType) {
    chips.push({ key: "propertyType", label: normalizedState.propertyType });
  }

  if (normalizedState.minPrice || normalizedState.maxPrice) {
    chips.push({
      key: "price",
      label: `Giá: ${formatCurrencyCompact(normalizedState.minPrice)} - ${formatCurrencyCompact(normalizedState.maxPrice)}`,
    });
  }

  if (normalizedState.minArea || normalizedState.maxArea) {
    chips.push({
      key: "area",
      label: `Diện tích: ${normalizedState.minArea || "0"} - ${normalizedState.maxArea || "∞"} m²`,
    });
  }

  if (normalizedState.bedrooms) {
    chips.push({ key: "bedrooms", label: `${normalizedState.bedrooms}+ PN` });
  }

  if (normalizedState.bathrooms) {
    chips.push({ key: "bathrooms", label: `${normalizedState.bathrooms}+ WC` });
  }

  if (normalizedState.keyword) {
    chips.push({
      key: "keyword",
      label: `Từ khóa: ${normalizedState.keyword}`,
    });
  }

  return chips;
}

function getPresetButtonClassName(isActive) {
  return `rounded-xl border px-3 py-2 text-xs font-medium transition ${
    isActive
      ? "border-[#30A14E] bg-[#F1FBF3] text-[#278642]"
      : "border-[#E5E9E7] bg-white text-[#5F6976] hover:border-[#CBE6D1]"
  }`;
}

function getResultItemTags(listing) {
  return [
    listing.draft?.propertyType,
    listing.specs?.[1],
    listing.draft?.projectName,
    listing.draft?.locationNote,
  ]
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeSuggestionText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getIntentSuggestionGroup(keyword) {
  const normalizedKeyword = normalizeSuggestionText(keyword);

  if (!normalizedKeyword) {
    return null;
  }

  return (
    intentSuggestionGroups
      .map((group) => ({
        group,
        score: group.keywords.reduce((bestScore, item) => {
          const normalizedItem = normalizeSuggestionText(item);
          const isMatch =
            normalizedKeyword === normalizedItem ||
            normalizedKeyword.startsWith(`${normalizedItem} `) ||
            normalizedItem.startsWith(normalizedKeyword);

          return isMatch ? Math.max(bestScore, normalizedItem.length) : bestScore;
        }, 0),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)[0]?.group ?? null
  );
}

function getNormalizedSuggestionAliases(target) {
  return target.normalizedAliases ?? target.aliases.map(normalizeSuggestionText);
}

const suggestionAliasPrefixPattern =
  /^(?:thanh pho|tp|quan|huyen|thi xa|thi tran|phuong|xa|khu do thi|khu vuc|khu)\s+/;

function getSuggestionAliasVariants(normalizedAlias) {
  const variants = [normalizedAlias];
  let strippedAlias = normalizedAlias;

  while (suggestionAliasPrefixPattern.test(strippedAlias)) {
    strippedAlias = strippedAlias.replace(suggestionAliasPrefixPattern, "");

    if (strippedAlias && !variants.includes(strippedAlias)) {
      variants.push(strippedAlias);
    }
  }

  return variants;
}

function getSuggestionTargetMatchScore(keyword, target) {
  const normalizedKeyword = normalizeSuggestionText(keyword);

  if (normalizedKeyword.length < 2) {
    return 0;
  }

  return getNormalizedSuggestionAliases(target).reduce((bestScore, alias) => {
    const aliasScore = getSuggestionAliasVariants(alias).reduce(
      (bestAliasScore, aliasVariant) => {
        if (aliasVariant === normalizedKeyword) {
          return Math.max(bestAliasScore, 100);
        }

        if (aliasVariant.startsWith(normalizedKeyword)) {
          return Math.max(bestAliasScore, 85);
        }

        if (
          aliasVariant.length >= 4 &&
          (normalizedKeyword.startsWith(`${aliasVariant} `) ||
            normalizedKeyword.endsWith(` ${aliasVariant}`) ||
            normalizedKeyword.includes(` ${aliasVariant} `))
        ) {
          return Math.max(bestAliasScore, 70);
        }

        return bestAliasScore;
      },
      0,
    );

    return Math.max(bestScore, aliasScore);
  }, 0);
}

function getMajorCitySuggestionPriority(cityName) {
  const normalizedCityName = normalizeSuggestionText(cityName);

  return (
    Object.entries(majorCitySuggestionPriorityMap).find(([key]) =>
      normalizedCityName.includes(key),
    )?.[1] ?? 0
  );
}

function getAdministrativeLocationSuggestionTargets(divisions = []) {
  return divisions.flatMap((city) => {
    const cityPriority = getMajorCitySuggestionPriority(city.name);
    const cityTarget = {
      label: city.name,
      aliases: [city.name],
      priority: cityPriority || 8,
    };

    return [
      {
        ...cityTarget,
        normalizedAliases: cityTarget.aliases.map(normalizeSuggestionText),
      },
      ...(city.districts ?? []).flatMap((district) => [
        {
          label: `${district.name}, ${city.name}`,
          aliases: [district.name, `${district.name} ${city.name}`],
          normalizedAliases: [district.name, `${district.name} ${city.name}`].map(
            normalizeSuggestionText,
          ),
          priority: cityPriority ? cityPriority + 4 : 10,
        },
        ...(district.wards ?? []).map((ward) => ({
          label: `${ward.name}, ${district.name}, ${city.name}`,
          aliases: [
            ward.name,
            `${ward.name} ${district.name}`,
            `${ward.name} ${city.name}`,
          ],
          normalizedAliases: [
            ward.name,
            `${ward.name} ${district.name}`,
            `${ward.name} ${city.name}`,
          ].map(normalizeSuggestionText),
          priority: cityPriority ? cityPriority + 2 : 12,
        })),
      ]),
    ];
  });
}

function buildLocationKeywordSuggestions(keyword, administrativeLocationTargets = []) {
  const targets = [
    ...knownLocationSuggestionTargets,
    ...administrativeLocationTargets,
  ]
    .map((target) => ({
      ...target,
      matchScore: getSuggestionTargetMatchScore(keyword, target),
    }))
    .filter((target) => target.matchScore > 0)
    .sort(
      (left, right) => {
        return (
          right.matchScore - left.matchScore ||
          right.priority - left.priority ||
          left.label.length - right.label.length
        );
      },
    );
  const uniqueTargets = [];
  const seenLabels = new Set();

  targets.forEach((target) => {
    const key = normalizeSuggestionText(target.label);

    if (!seenLabels.has(key)) {
      seenLabels.add(key);
      uniqueTargets.push(target);
    }
  });

  if (uniqueTargets.length <= 1) {
    return uniqueTargets.flatMap((target) =>
      locationSuggestionTemplates.map((template) =>
        template.replace("{location}", target.label),
      ),
    );
  }

  const [primaryTarget, ...alternateTargets] = uniqueTargets;
  const primarySuggestions = locationSuggestionTemplates
    .slice(0, 3)
    .map((template) => template.replace("{location}", primaryTarget.label));
  const alternateHeadlineSuggestions = alternateTargets.map((target) =>
    locationSuggestionTemplates[0].replace("{location}", target.label),
  );
  const remainingSuggestions = [
    ...locationSuggestionTemplates
      .slice(3)
      .map((template) => template.replace("{location}", primaryTarget.label)),
    ...alternateTargets.flatMap((target) =>
      locationSuggestionTemplates
        .slice(1, 4)
        .map((template) => template.replace("{location}", target.label)),
    ),
  ];

  return [
    ...primarySuggestions,
    ...alternateHeadlineSuggestions,
    ...remainingSuggestions,
  ];
}

function buildIntentKeywordSuggestions(keyword) {
  const group = getIntentSuggestionGroup(keyword);

  if (!group) {
    return [];
  }

  return group.templates.flatMap((template) =>
    popularSearchCities.map((city) => template.replace("{city}", city)),
  );
}

function getStoredSearchHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(
      window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY) || "[]",
    );

    return Array.isArray(parsedHistory)
      ? parsedHistory.filter(Boolean).slice(0, SEARCH_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function saveStoredSearchHistory(items) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(items.slice(0, SEARCH_HISTORY_LIMIT)),
    );
  } catch {
    // Ignore storage failures so search keeps working in private/restricted mode.
  }
}

function addStoredSearchHistoryItem(history, keyword) {
  const normalizedKeyword = String(keyword ?? "").trim();

  if (!normalizedKeyword) {
    return history;
  }

  const nextHistory = [
    normalizedKeyword,
    ...history.filter(
      (item) => item.toLowerCase() !== normalizedKeyword.toLowerCase(),
    ),
  ].slice(0, SEARCH_HISTORY_LIMIT);

  saveStoredSearchHistory(nextHistory);
  return nextHistory;
}

function getNormalizedLocationName(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const administrativePrefixPattern =
  /^(thành phố|tp\.?|quận|huyện|thị xã|thị trấn|phường|xã|tỉnh)\s+/i;

function stripAdministrativePrefix(value = "") {
  return String(value)
    .replace(administrativePrefixPattern, "")
    .trim();
}

function isNumberBasedAdministrativeName(value = "") {
  const compactName = stripAdministrativePrefix(value);

  return /^\d+[a-z]?$/i.test(compactName);
}

function getCompactAdministrativeName(value = "") {
  const trimmedValue = String(value).trim();

  if (!trimmedValue) {
    return "";
  }

  return isNumberBasedAdministrativeName(trimmedValue)
    ? trimmedValue
    : stripAdministrativePrefix(trimmedValue);
}

function getCompactCityName(value = "") {
  const normalizedValue = getNormalizedLocationName(value);
  const directCityMap = {
    "can tho": "CẦN THƠ",
    "da nang": "TP. ĐN",
    "hai phong": "HẢI PHÒNG",
    "ha noi": "TP.HN",
    "ho chi minh": "TP.HCM",
    hcm: "TP.HCM",
    tphcm: "TP.HCM",
  };

  const matchedDirectCity = Object.entries(directCityMap).find(([key]) =>
    normalizedValue.includes(key),
  );

  if (matchedDirectCity) {
    return matchedDirectCity[1];
  }

  if (/^tỉnh\s+/i.test(value)) {
    return value.replace(/^tỉnh\s+/i, "T. ").trim();
  }

  if (/^(thành phố|tp\.?)\s+/i.test(value)) {
    return stripAdministrativePrefix(value);
  }

  const compactValue = stripAdministrativePrefix(value);

  return compactValue ? `T. ${compactValue}` : "";
}

function getLocationFilterSummary(searchState) {
  const ward = getCompactAdministrativeName(searchState.ward);
  const district = getCompactAdministrativeName(searchState.district);
  const city = getCompactCityName(searchState.city);
  const shouldJoinNumberBasedLocality =
    ward &&
    district &&
    isNumberBasedAdministrativeName(searchState.ward) &&
    isNumberBasedAdministrativeName(searchState.district);

  return (
    [
      shouldJoinNumberBasedLocality ? `${ward} ${district}` : ward,
      shouldJoinNumberBasedLocality ? "" : district,
      city,
    ]
      .filter(Boolean)
      .join(", ") || "Tất cả khu vực"
  );
}

function getPriceFilterSummary(searchState) {
  if (!searchState.minPrice && !searchState.maxPrice) {
    return "Mọi khoảng giá";
  }

  return `${formatCurrencyCompact(searchState.minPrice)} - ${formatCurrencyCompact(searchState.maxPrice)}`;
}

function getAreaFilterSummary(searchState) {
  if (!searchState.minArea && !searchState.maxArea) {
    return "Mọi diện tích";
  }

  return `${searchState.minArea || "0"} - ${searchState.maxArea || "∞"} m²`;
}

function getRoomFilterSummary(value, label) {
  return value ? `${value}+ ${label}` : "Bất kỳ";
}

const filterPopoverViewportMargin = 12;
const filterPopoverDesktopWidth = 300;
const filterPopoverMinimumVisibleHeight = 220;
const filterPopoverBottomMargin = 4;

function ResultsFilterPopover({
  actions,
  children,
  icon: Icon,
  isOpen,
  onToggle,
  summary,
  title,
}) {
  const triggerRef = useRef(null);
  const [popoverStyle, setPopoverStyle] = useState({});
  const updatePopoverPosition = useCallback(() => {
    if (typeof window === "undefined" || !triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = filterPopoverViewportMargin;
    const panelWidth = Math.min(
      filterPopoverDesktopWidth,
      Math.max(240, viewportWidth - margin * 2),
    );
    const hasRightRoom = viewportWidth - triggerRect.right - margin >= panelWidth;
    const hasLeftRoom = triggerRect.left - margin >= panelWidth;
    const shouldOpenRight = hasRightRoom || !hasLeftRoom;
    const preferredLeft = shouldOpenRight
      ? triggerRect.right + margin
      : triggerRect.left - panelWidth - margin;
    const minLeft = margin;
    const maxLeft = Math.max(margin, viewportWidth - panelWidth - margin);
    const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);
    const preferredTop = triggerRect.top;
    const maxTop = Math.max(
      margin,
      viewportHeight - filterPopoverMinimumVisibleHeight - filterPopoverBottomMargin,
    );
    const top = Math.min(Math.max(preferredTop, margin), maxTop);

    setPopoverStyle({
      left: `${left}px`,
      maxHeight: `${Math.max(220, viewportHeight - top - filterPopoverBottomMargin)}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(updatePopoverPosition);

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  return (
    <div className="relative min-w-0 max-w-full">
      <button
        ref={triggerRef}
        className={`flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition ${
          isOpen
            ? "border-[#35A554] bg-[#F4FBF5] shadow-[0_10px_24px_rgba(53,165,84,0.12)]"
            : "border-[#E2E8E3] bg-white hover:border-[#CFE6D5]"
        }`}
        type="button"
        onClick={(event) => {
          updatePopoverPosition();
          onToggle?.(event);
        }}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ECF8EF] text-[#35A554]">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate text-sm font-semibold text-[#26313D]">
            {title}
          </span>
          <span className="mt-0.5 block w-full min-w-0 max-w-full overflow-hidden truncate whitespace-nowrap text-xs font-medium text-[#7A838D]">
            {summary}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#8A929D] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div
          className="fixed z-[90] min-w-0 overflow-y-auto overflow-x-hidden rounded-[22px] border border-[#E2E8E3] bg-white p-4 shadow-[0_20px_48px_rgba(36,52,42,0.16)]"
          style={popoverStyle}
        >
          <div className="min-w-0 pr-1">
            {children}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}

function SearchResultsListItem({ listing, onViewListing }) {
  const tags = getResultItemTags(listing);

  return (
    <article className="grid gap-4 rounded-[26px] border border-[#E7ECE8] bg-white p-4 shadow-[0_12px_30px_rgba(42,66,52,0.055)] lg:grid-cols-[260px_minmax(0,1fr)_220px]">
      <button
        className="relative overflow-hidden rounded-[22px]"
        type="button"
        onClick={() => onViewListing?.(listing)}
      >
        <img
          alt={listing.title}
          className="h-[210px] w-full object-cover transition duration-300 hover:scale-[1.02]"
          src={listing.image}
        />
        <span
          className={`absolute left-3 top-3 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm ${getTierBadgeClassName(
            listing,
          )}`}
        >
          {getTierLabel(listing)}
        </span>
        <button
          aria-label="Lưu tin"
          className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-[#7B8590] shadow-sm"
          type="button"
        >
          <Heart className="size-4" />
        </button>
      </button>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <button
            className="text-left"
            type="button"
            onClick={() => onViewListing?.(listing)}
          >
            <h3 className="text-[22px] font-bold leading-[1.35] tracking-[-0.02em] text-[#1F252D] transition hover:text-[#2F9E4F]">
              {listing.title}
            </h3>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#64707C]">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 text-[#35A554]" />
            {listing.location}
          </span>
          {listing.draft?.projectName ? (
            <span className="text-[#50606E]">{listing.draft.projectName}</span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#4E5A66]">
          <span className="flex items-center gap-2 rounded-full bg-[#F5F8F6] px-3 py-1.5">
            <BedDouble className="size-4 text-[#5C6772]" />
            {listing.draft?.bedrooms ? `${listing.draft.bedrooms} PN` : "-- PN"}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-[#F5F8F6] px-3 py-1.5">
            <Bath className="size-4 text-[#5C6772]" />
            {listing.draft?.bathrooms
              ? `${listing.draft.bathrooms} WC`
              : "-- WC"}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-[#F5F8F6] px-3 py-1.5">
            <Ruler className="size-4 text-[#5C6772]" />
            {listing.area}
          </span>
        </div>

        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#EEF8F0] px-3 py-1.5 text-xs font-medium text-[#2E8E4B]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col justify-between rounded-[22px] border border-[#EEF2EE] bg-[#FCFDFC] p-4 lg:items-end">
        <div className="w-full lg:text-right">
          <p className="text-[28px] font-bold leading-none text-[#18924B]">
            {listing.price}
          </p>
          <p className="mt-1 text-sm text-[#6E7781]">/tháng</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#7B8590] lg:justify-end">
            <Clock3 className="size-4 text-[#35A554]" />
            <span>{listing.updatedAt || "Đăng gần đây"}</span>
          </div>
        </div>

        <div className="mt-5 grid w-full gap-3">
          <button
            className="h-11 rounded-xl border border-[#D7E2D9] bg-white px-4 text-sm font-semibold text-[#2F9E4F] transition hover:border-[#C5E4CC]"
            type="button"
            onClick={() => onViewListing?.(listing)}
          >
            Xem chi tiết
          </button>
          <button
            className="h-11 rounded-xl bg-[#35A554] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.2)] transition hover:bg-[#2E934C]"
            type="button"
          >
            Liên hệ
          </button>
        </div>
      </div>
    </article>
  );
}

export function PropertySearchHeaderBar({
  administrativeDivisions = [],
  searchState = defaultPropertySearchState,
  onSearchStateChange,
  onSubmit,
  variant = "full",
}) {
  const [openPanel, setOpenPanel] = useState("");
  const [searchHistory, setSearchHistory] = useState(() =>
    getStoredSearchHistory(),
  );
  const [keywordInput, setKeywordInput] = useState(
    () => searchState.keyword,
  );
  const deferredKeywordInput = useDeferredValue(keywordInput);
  const [pendingLocation, setPendingLocation] = useState({
    city: searchState.city,
    district: searchState.district,
    ward: searchState.ward,
  });
  const [priceDraft, setPriceDraft] = useState({
    minPrice: searchState.minPrice,
    maxPrice: searchState.maxPrice,
  });
  const [areaDraft, setAreaDraft] = useState({
    minArea: searchState.minArea,
    maxArea: searchState.maxArea,
  });
  const searchBarRef = useRef(null);
  const locationPanelRef = useRef(null);
  const propertyTypePanelRef = useRef(null);
  const keywordPanelRef = useRef(null);
  const divisions = useMemo(
    () => getAdministrativeDivisions(administrativeDivisions),
    [administrativeDivisions],
  );
  const administrativeLocationTargets = useMemo(
    () => getAdministrativeLocationSuggestionTargets(divisions),
    [divisions],
  );
  const selectedCity = useMemo(
    () => divisions.find((item) => item.name === pendingLocation.city) ?? null,
    [divisions, pendingLocation.city],
  );
  const selectedDistrict = useMemo(
    () =>
      selectedCity?.districts?.find(
        (item) => item.name === pendingLocation.district,
      ) ?? null,
    [pendingLocation.district, selectedCity],
  );
  const visibleKeywordSuggestions = useMemo(() => {
    const keyword = String(deferredKeywordInput ?? "");
    const normalizedKeyword = normalizeSuggestionText(keyword);

    if (!normalizedKeyword) {
      return keywordSuggestionOptions;
    }

    const locationSuggestions = buildLocationKeywordSuggestions(
      keyword,
      administrativeLocationTargets,
    );

    if (locationSuggestions.length) {
      return locationSuggestions.slice(0, 10);
    }

    const intentSuggestions = buildIntentKeywordSuggestions(keyword);

    if (intentSuggestions.length) {
      return intentSuggestions.slice(0, 9);
    }

    return keywordSuggestionOptions
      .filter((item) =>
        normalizeSuggestionText(item).includes(normalizedKeyword),
      )
      .slice(0, 5);
  }, [administrativeLocationTargets, deferredKeywordInput]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!searchBarRef.current?.contains(event.target)) {
        setOpenPanel("");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenPanel("");
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function emitSearchState(nextState) {
    onSearchStateChange?.(normalizePropertySearchState(nextState));
  }

  function buildFreshKeywordSearchState(currentSearchState, keyword) {
    const normalizedState = normalizePropertySearchState(currentSearchState);
    const nextState = {
      ...defaultPropertySearchState,
      keyword,
    };

    keywordSearchCarryoverFields.forEach((field) => {
      nextState[field] = normalizedState[field];
    });

    return nextState;
  }

  function commitKeywordSearch(keyword = keywordInput) {
    const committedKeyword = String(keyword ?? "").trim();
    const nextState = buildSearchStateFromKeyword(
      buildFreshKeywordSearchState(searchState, committedKeyword),
      divisions,
    );

    setKeywordInput(nextState.keyword);
    emitSearchState(nextState);
    setSearchHistory((current) =>
      addStoredSearchHistoryItem(current, nextState.keyword),
    );
    setOpenPanel("");
    onSubmit?.(nextState);
  }

  function removeSearchHistoryItem(keyword) {
    setSearchHistory((current) => {
      const nextHistory = current.filter((item) => item !== keyword);
      saveStoredSearchHistory(nextHistory);
      return nextHistory;
    });
  }

  function clearSearchHistory() {
    setSearchHistory([]);
    saveStoredSearchHistory([]);
  }

  function applyLocationFilter() {
    if (
      !pendingLocation.city ||
      !pendingLocation.district ||
      !pendingLocation.ward
    ) {
      return;
    }

    emitSearchState({
      ...searchState,
      city: pendingLocation.city,
      district: pendingLocation.district,
      ward: pendingLocation.ward,
    });
    setOpenPanel("");
  }

  function applyPriceFilter() {
    emitSearchState({
      ...searchState,
      minPrice: priceDraft.minPrice,
      maxPrice: priceDraft.maxPrice,
    });
    setOpenPanel("");
  }

  function resetPriceFilter() {
    const nextDraft = { minPrice: "", maxPrice: "" };

    setPriceDraft(nextDraft);
    emitSearchState({
      ...searchState,
      ...nextDraft,
    });
    setOpenPanel("");
  }

  function applyAreaFilter() {
    emitSearchState({
      ...searchState,
      minArea: areaDraft.minArea,
      maxArea: areaDraft.maxArea,
    });
    setOpenPanel("");
  }

  function resetAreaFilter() {
    const nextDraft = { minArea: "", maxArea: "" };

    setAreaDraft(nextDraft);
    emitSearchState({
      ...searchState,
      ...nextDraft,
    });
    setOpenPanel("");
  }

  if (variant === "basic") {
    return (
      <form
        ref={searchBarRef}
        className="relative w-full"
        onSubmit={(event) => {
          event.preventDefault();
          commitKeywordSearch();
        }}
      >
        <div className="relative" ref={keywordPanelRef}>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9CA4AD]" />
          <input
            className="h-11 w-full rounded-xl bg-[#F5F7F5] pl-11 pr-4 text-sm font-medium text-[#2B3440] outline-none transition placeholder:text-[#8D95A0] focus:bg-white focus:ring-2 focus:ring-[#35A554]/15"
            placeholder="Tìm theo địa chỉ, khu vực, trường học, ..."
            type="search"
            value={keywordInput}
            onFocus={() => setOpenPanel("keyword")}
            onChange={(event) => {
              setKeywordInput(event.target.value);
              setOpenPanel("keyword");
            }}
          />

          {openPanel === "keyword" ? (
            <div className="absolute left-0 top-[calc(100%+8px)] z-[90] w-full rounded-[18px] border border-[#E1E7E3] bg-white px-4 py-3 shadow-[0_24px_56px_rgba(42,62,49,0.14)]">
              {!String(keywordInput ?? "").trim() && searchHistory.length ? (
                <section>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-[#3C4653]">
                      Tìm kiếm gần đây
                    </h3>
                    <button
                      className="text-xs font-semibold text-[#159447] transition hover:text-[#0F7437]"
                      type="button"
                      onClick={clearSearchHistory}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div>
                    {searchHistory.map((item) => (
                      <button
                        key={item}
                        className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-medium leading-5 text-[#26313D] transition hover:bg-[#F6FAF7]"
                        type="button"
                        onClick={() => commitKeywordSearch(item)}
                      >
                        <Clock3 className="size-4 shrink-0 text-[#667384]" />
                        <span className="min-w-0 flex-1 truncate">{item}</span>
                        <span
                          aria-label={`Xóa ${item}`}
                          className="flex size-6 items-center justify-center rounded-full text-[#7A8490] opacity-100 transition hover:bg-[#EEF2EF] hover:text-[#2F3945] sm:opacity-0 sm:group-hover:opacity-100"
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeSearchHistoryItem(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              removeSearchHistoryItem(item);
                            }
                          }}
                        >
                          <X className="size-4" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {!String(keywordInput ?? "").trim() && searchHistory.length ? (
                <div className="my-2 h-px bg-[#E4EAE6]" />
              ) : null}

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-[#3C4653]">
                  Gợi ý từ khóa
                </h3>
                <div>
                  {visibleKeywordSuggestions.map((item) => (
                    <button
                      key={item}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-medium leading-5 text-[#26313D] transition hover:bg-[#F6FAF7]"
                      type="button"
                      onClick={() => commitKeywordSearch(item)}
                    >
                      <Search className="size-4 shrink-0 text-[#F04438]" />
                      <span className="min-w-0 flex-1 truncate">{item}</span>
                    </button>
                  ))}

                  {String(keywordInput ?? "").trim() ? (
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-semibold leading-5 text-[#159447] transition hover:bg-[#F1FBF4]"
                      type="button"
                      onClick={() => commitKeywordSearch()}
                    >
                      <Search className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        Tìm "{keywordInput.trim()}"
                      </span>
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <form
      ref={searchBarRef}
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        commitKeywordSearch();
      }}
    >
      <div className="grid gap-3 rounded-[28px] border border-[#E8EDE8] bg-white p-3 shadow-[0_18px_42px_rgba(39,57,45,0.1)] lg:grid-cols-2 lg:items-center xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_150px]">
        <div className="relative order-2">
          <button
            className={`flex h-12 w-full items-center justify-between gap-3 rounded-[16px] border bg-white px-4 text-[15px] font-semibold text-[#26313D] transition ${
              openPanel === "price"
                ? "border-[#3AA657] ring-2 ring-[#3AA657]/15"
                : "border-[#E5EBE6] hover:border-[#CCE4D2]"
            }`}
            type="button"
            onClick={() => {
              setPriceDraft({
                minPrice: searchState.minPrice,
                maxPrice: searchState.maxPrice,
              });
              setOpenPanel((current) =>
                current === "price" ? "" : "price",
              );
            }}
          >
            <span className="min-w-0 truncate">
              {searchState.minPrice || searchState.maxPrice
                ? getPriceFilterSummary(searchState)
                : "Khoảng giá"}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-[#8F97A2] transition ${
                openPanel === "price" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openPanel === "price" ? (
            <div className="absolute left-0 top-[calc(100%+12px)] z-[70] w-[320px] max-w-[calc(100vw-32px)] rounded-[24px] border border-[#E9EEEA] bg-white p-4 shadow-[0_24px_56px_rgba(42,62,49,0.14)]">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  inputMode="numeric"
                  placeholder="Từ"
                  value={priceDraft.minPrice}
                  onChange={(event) =>
                    setPriceDraft((current) => ({
                      ...current,
                      minPrice: event.target.value,
                    }))
                  }
                />
                <input
                  className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  inputMode="numeric"
                  placeholder="Đến"
                  value={priceDraft.maxPrice}
                  onChange={(event) =>
                    setPriceDraft((current) => ({
                      ...current,
                      maxPrice: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {pricePresetOptions.map((preset) => (
                  <button
                    key={preset.label}
                    className={getPresetButtonClassName(
                      priceDraft.minPrice === preset.minPrice &&
                        priceDraft.maxPrice === preset.maxPrice,
                    )}
                    type="button"
                    onClick={() =>
                      setPriceDraft({
                        minPrice: preset.minPrice,
                        maxPrice: preset.maxPrice,
                      })
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={resetPriceFilter}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={applyPriceFilter}
                >
                  Áp dụng
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative order-3" ref={locationPanelRef}>
          <button
            className={`flex h-12 w-full items-center justify-between gap-3 rounded-[16px] border bg-white px-4 text-[15px] font-semibold text-[#26313D] transition ${
              openPanel === "location"
                ? "border-[#3AA657] ring-2 ring-[#3AA657]/15"
                : "border-[#E5EBE6] hover:border-[#CCE4D2]"
            }`}
            type="button"
            onClick={() => {
              setPendingLocation({
                city: searchState.city,
                district: searchState.district,
                ward: searchState.ward,
              });
              setOpenPanel((current) =>
                current === "location" ? "" : "location",
              );
            }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0 text-[#35A554]" />
              <span className="truncate">{getLocationLabel(searchState)}</span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-[#8F97A2] transition ${
                openPanel === "location" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openPanel === "location" ? (
            <div className="absolute left-0 top-[calc(100%+12px)] z-[70] w-[320px] max-w-[calc(100vw-32px)] rounded-[24px] border border-[#E9EEEA] bg-white p-5 shadow-[0_24px_56px_rgba(42,62,49,0.14)]">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2B333C]">
                    Thành phố <span className="text-[#E05555]">*</span>
                  </span>
                  <select
                    className="h-12 w-full rounded-xl border border-[#DDE7DF] bg-white px-4 text-sm text-[#2C3440] outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                    value={pendingLocation.city}
                    onChange={(event) =>
                      setPendingLocation({
                        city: event.target.value,
                        district: "",
                        ward: "",
                      })
                    }
                  >
                    <option value="">Chọn thành phố</option>
                    {divisions.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2B333C]">
                    Quận / Huyện <span className="text-[#E05555]">*</span>
                  </span>
                  <select
                    className="h-12 w-full rounded-xl border border-[#DDE7DF] bg-white px-4 text-sm text-[#2C3440] outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                    value={pendingLocation.district}
                    onChange={(event) =>
                      setPendingLocation((current) => ({
                        ...current,
                        district: event.target.value,
                        ward: "",
                      }))
                    }
                  >
                    <option value="">Chọn quận/huyện</option>
                    {(selectedCity?.districts ?? []).map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2B333C]">
                    Phường / Xã <span className="text-[#E05555]">*</span>
                  </span>
                  <select
                    className="h-12 w-full rounded-xl border border-[#DDE7DF] bg-white px-4 text-sm text-[#2C3440] outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                    value={pendingLocation.ward}
                    onChange={(event) =>
                      setPendingLocation((current) => ({
                        ...current,
                        ward: event.target.value,
                      }))
                    }
                  >
                    <option value="">Chọn phường/xã</option>
                    {(selectedDistrict?.wards ?? []).map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  className="h-11 rounded-xl border border-[#DDE5DF] text-sm font-semibold text-[#59636F]"
                  type="button"
                  onClick={() => {
                    setPendingLocation({ city: "", district: "", ward: "" });
                    emitSearchState({
                      ...searchState,
                      city: "",
                      district: "",
                      ward: "",
                    });
                    setOpenPanel("");
                  }}
                >
                  Xóa chọn
                </button>
                <button
                  className="h-11 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !pendingLocation.city ||
                    !pendingLocation.district ||
                    !pendingLocation.ward
                  }
                  type="button"
                  onClick={applyLocationFilter}
                >
                  Áp dụng
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative order-4" ref={propertyTypePanelRef}>
          <button
            className={`flex h-12 w-full items-center justify-between gap-3 rounded-[16px] border bg-white px-4 text-[15px] font-semibold text-[#26313D] transition ${
              openPanel === "propertyType"
                ? "border-[#3AA657] ring-2 ring-[#3AA657]/15"
                : "border-[#E5EBE6] hover:border-[#CCE4D2]"
            }`}
            type="button"
            onClick={() =>
              setOpenPanel((current) =>
                current === "propertyType" ? "" : "propertyType",
              )
            }
          >
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="size-4 shrink-0 text-[#35A554]" />
              <span className="truncate">
                {getPropertyTypeLabel(searchState.propertyType)}
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-[#8F97A2] transition ${
                openPanel === "propertyType" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openPanel === "propertyType" ? (
            <div className="absolute left-0 top-[calc(100%+12px)] z-[70] w-[320px] max-w-[calc(100vw-32px)] rounded-[24px] border border-[#E9EEEA] bg-white p-4 shadow-[0_24px_56px_rgba(42,62,49,0.14)]">
              <div className="space-y-1">
                {propertyTypeOptions.map(({ icon: Icon, label, value }) => {
                  const isSelected = searchState.propertyType === value;

                  return (
                    <label
                      key={label}
                      className={`flex cursor-pointer items-center gap-3 rounded-[18px] px-3 py-3 transition ${
                        isSelected ? "bg-[#F2FBF4]" : "hover:bg-[#F8FBF8]"
                      }`}
                    >
                      <input
                        checked={isSelected}
                        className="size-4 accent-[#35A554]"
                        name="property-type"
                        type="radio"
                        value={value}
                        onChange={() => {
                          emitSearchState({
                            ...searchState,
                            propertyType: value,
                          });
                          setOpenPanel("");
                        }}
                      />
                      <Icon className="size-4 text-[#5D6874]" />
                      <span className="text-sm font-medium text-[#2D3540]">
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative order-5">
          <button
            className={`flex h-12 w-full items-center justify-between gap-3 rounded-[16px] border bg-white px-4 text-[15px] font-semibold text-[#26313D] transition ${
              openPanel === "area"
                ? "border-[#3AA657] ring-2 ring-[#3AA657]/15"
                : "border-[#E5EBE6] hover:border-[#CCE4D2]"
            }`}
            type="button"
            onClick={() => {
              setAreaDraft({
                minArea: searchState.minArea,
                maxArea: searchState.maxArea,
              });
              setOpenPanel((current) => (current === "area" ? "" : "area"));
            }}
          >
            <span className="min-w-0 truncate">
              {searchState.minArea || searchState.maxArea
                ? getAreaFilterSummary(searchState)
                : "Diện tích"}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-[#8F97A2] transition ${
                openPanel === "area" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openPanel === "area" ? (
            <div className="absolute left-0 top-[calc(100%+12px)] z-[70] w-[320px] max-w-[calc(100vw-32px)] rounded-[24px] border border-[#E9EEEA] bg-white p-4 shadow-[0_24px_56px_rgba(42,62,49,0.14)]">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  inputMode="numeric"
                  placeholder="Từ m²"
                  value={areaDraft.minArea}
                  onChange={(event) =>
                    setAreaDraft((current) => ({
                      ...current,
                      minArea: event.target.value,
                    }))
                  }
                />
                <input
                  className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                  inputMode="numeric"
                  placeholder="Đến m²"
                  value={areaDraft.maxArea}
                  onChange={(event) =>
                    setAreaDraft((current) => ({
                      ...current,
                      maxArea: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {areaPresetOptions.map((preset) => (
                  <button
                    key={preset.label}
                    className={getPresetButtonClassName(
                      areaDraft.minArea === preset.minArea &&
                        areaDraft.maxArea === preset.maxArea,
                    )}
                    type="button"
                    onClick={() =>
                      setAreaDraft({
                        minArea: preset.minArea,
                        maxArea: preset.maxArea,
                      })
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={resetAreaFilter}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={applyAreaFilter}
                >
                  Áp dụng
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="relative order-1 min-w-0 pb-3 after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-[94%] after:-translate-x-1/2 after:bg-[#E3E8E4] lg:col-span-2 xl:col-span-5"
          ref={keywordPanelRef}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#747C86]" />
          <input
            className="h-12 w-full rounded-[16px] bg-transparent pl-11 pr-4 text-[16px] font-medium text-[#2B3440] outline-none transition placeholder:text-[#7D858F] focus:bg-[#F8FBF8]"
            placeholder="Tìm theo địa chỉ, khu vực, trường học, ..."
            type="search"
            value={keywordInput}
            onFocus={() => setOpenPanel("keyword")}
            onChange={(event) => {
              setKeywordInput(event.target.value);
              setOpenPanel("keyword");
            }}
          />

          {openPanel === "keyword" ? (
            <div className="absolute left-0 top-[calc(100%-4px)] z-[80] w-full rounded-[18px] border border-[#E1E7E3] bg-white px-4 py-3 shadow-[0_24px_56px_rgba(42,62,49,0.14)]">
              {!String(keywordInput ?? "").trim() &&
              searchHistory.length ? (
                <section>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-[#3C4653]">
                      Tìm kiếm gần đây
                    </h3>
                    <button
                      className="text-xs font-semibold text-[#159447] transition hover:text-[#0F7437]"
                      type="button"
                      onClick={clearSearchHistory}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div>
                    {searchHistory.map((item) => (
                      <button
                        key={item}
                        className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-medium leading-5 text-[#26313D] transition hover:bg-[#F6FAF7]"
                        type="button"
                        onClick={() => commitKeywordSearch(item)}
                      >
                        <Clock3 className="size-4 shrink-0 text-[#667384]" />
                        <span className="min-w-0 flex-1 truncate">{item}</span>
                        <span
                          aria-label={`Xóa ${item}`}
                          className="flex size-6 items-center justify-center rounded-full text-[#7A8490] opacity-100 transition hover:bg-[#EEF2EF] hover:text-[#2F3945] sm:opacity-0 sm:group-hover:opacity-100"
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeSearchHistoryItem(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              removeSearchHistoryItem(item);
                            }
                          }}
                        >
                          <X className="size-4" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {!String(keywordInput ?? "").trim() &&
              searchHistory.length ? (
                <div className="my-2 h-px bg-[#E4EAE6]" />
              ) : null}

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-[#3C4653]">
                  Gợi ý từ khóa
                </h3>
                <div>
                  {visibleKeywordSuggestions.map((item) => (
                    <button
                      key={item}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-medium leading-5 text-[#26313D] transition hover:bg-[#F6FAF7]"
                      type="button"
                      onClick={() => commitKeywordSearch(item)}
                    >
                      <Search className="size-4 shrink-0 text-[#F04438]" />
                      <span className="min-w-0 flex-1 truncate">{item}</span>
                    </button>
                  ))}

                  {String(keywordInput ?? "").trim() ? (
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-semibold leading-5 text-[#159447] transition hover:bg-[#F1FBF4]"
                      type="button"
                      onClick={() => commitKeywordSearch()}
                    >
                      <Search className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        Tìm "{keywordInput.trim()}"
                      </span>
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </div>

        <button
          className="order-6 flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(90deg,#1A8F41_0%,#2DB35A_100%)] px-4 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(53,165,84,0.24)] transition hover:brightness-105"
          type="submit"
        >
          <Search className="size-4" />
          <span>Tìm kiếm</span>
        </button>
      </div>
    </form>
  );
}

export function PropertySearchResultsPage({
  administrativeDivisions = [],
  appliedSearchState = defaultPropertySearchState,
  listings = [],
  onApplyFilters,
  onClearFilters,
  onSearchStateChange,
  onViewListing,
  searchState = defaultPropertySearchState,
}) {
  const [sortMode, setSortMode] = useState("priority");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState("");
  const [filterDraft, setFilterDraft] = useState(() =>
    normalizePropertySearchState(searchState),
  );
  const filtersRef = useRef(null);
  const divisions = useMemo(
    () => getAdministrativeDivisions(administrativeDivisions),
    [administrativeDivisions],
  );
  const selectedFilterCity = useMemo(
    () => divisions.find((item) => item.name === filterDraft.city) ?? null,
    [divisions, filterDraft.city],
  );
  const selectedFilterDistrict = useMemo(
    () =>
      selectedFilterCity?.districts?.find(
        (item) => item.name === filterDraft.district,
      ) ?? null,
    [filterDraft.district, selectedFilterCity],
  );
  const activeChips = useMemo(
    () => buildActiveSearchChips(appliedSearchState),
    [appliedSearchState],
  );
  const sortedListings = useMemo(() => {
    const baseListings = [...listings];

    if (sortMode === "priceAsc") {
      return baseListings.sort(
        (left, right) =>
          parseNumberValue(left.draft?.rentPrice || left.price) -
          parseNumberValue(right.draft?.rentPrice || right.price),
      );
    }

    if (sortMode === "priceDesc") {
      return baseListings.sort(
        (left, right) =>
          parseNumberValue(right.draft?.rentPrice || right.price) -
          parseNumberValue(left.draft?.rentPrice || left.price),
      );
    }

    if (sortMode === "latest") {
      return baseListings.sort((left, right) => {
        const rightTime = new Date(
          right.publishedAtRaw || right.updatedAtRaw || right.createdAtRaw || 0,
        ).getTime();
        const leftTime = new Date(
          left.publishedAtRaw || left.updatedAtRaw || left.createdAtRaw || 0,
        ).getTime();

        return rightTime - leftTime;
      });
    }

    return sortListingsBySearchPriority(baseListings, appliedSearchState);
  }, [appliedSearchState, listings, sortMode]);
  const totalPages = Math.max(1, Math.ceil(sortedListings.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const currentListings = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return sortedListings.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, pageSize, sortedListings]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!filtersRef.current?.contains(event.target)) {
        setOpenFilter("");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenFilter("");
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function emitSearchState(patch) {
    onSearchStateChange?.(normalizePropertySearchState(patch));
  }

  function openFilterPanel(key) {
    setFilterDraft(normalizePropertySearchState(searchState));
    setOpenFilter((current) => (current === key ? "" : key));
  }

  function updateFilterDraft(patch) {
    setFilterDraft((current) => normalizePropertySearchState({ ...current, ...patch }));
  }

  function applyFilterDraft(nextDraft = filterDraft) {
    const nextState = normalizePropertySearchState(nextDraft);

    setCurrentPage(1);
    emitSearchState(nextState);
    onApplyFilters?.(nextState);
    setOpenFilter("");
  }

  function resetFilterFields(fields) {
    setFilterDraft((current) =>
      normalizePropertySearchState({
        ...current,
        ...Object.fromEntries(fields.map((field) => [field, ""])),
      }),
    );
  }

  function removeChip(key) {
    const nextState = { ...appliedSearchState };

    if (key === "location") {
      nextState.city = "";
      nextState.district = "";
      nextState.ward = "";
    }

    if (key === "price") {
      nextState.minPrice = "";
      nextState.maxPrice = "";
    }

    if (key === "area") {
      nextState.minArea = "";
      nextState.maxArea = "";
    }

    if (
      key === "propertyType" ||
      key === "bedrooms" ||
      key === "bathrooms" ||
      key === "keyword"
    ) {
      nextState[key] = "";
    }

    emitSearchState(nextState);
    onApplyFilters?.(nextState);
  }

  return (
    <div className="mt-5 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        ref={filtersRef}
        className="min-w-0 rounded-[28px] border border-[#E7ECE8] bg-white p-5 shadow-[0_14px_36px_rgba(43,64,51,0.06)] xl:h-fit"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#ECF8EF] text-[#35A554]">
              <SlidersHorizontal className="size-4" />
            </span>
            <div>
              <p className="text-base font-bold text-[#202730]">
                Bộ lọc tìm kiếm
              </p>
              <p className="text-sm text-[#7A838D]">MVP 6 tiêu chí cơ bản</p>
            </div>
          </div>
          <button
            className="text-sm font-semibold text-[#58626D] transition hover:text-[#2E944B]"
            type="button"
            onClick={() => {
              setCurrentPage(1);
              setOpenFilter("");
              setFilterDraft(defaultPropertySearchState);
              emitSearchState(defaultPropertySearchState);
              onClearFilters?.();
            }}
          >
            Đặt lại
          </button>
        </div>

        <div className="mt-6 grid min-w-0 gap-3">
          <ResultsFilterPopover
            actions={
              <>
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={() => resetFilterFields(["city", "district", "ward"])}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={() => applyFilterDraft()}
                >
                  Áp dụng
                </button>
              </>
            }
            icon={MapPin}
            isOpen={openFilter === "location"}
            onToggle={() => openFilterPanel("location")}
            summary={getLocationFilterSummary(searchState)}
            title="Vị trí"
          >
            <div className="space-y-3">
              <select
                className="h-11 w-full rounded-xl border border-[#DFE6E1] bg-white px-4 text-sm text-[#2E3742] outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                value={filterDraft.city}
                onChange={(event) =>
                  updateFilterDraft({
                    city: event.target.value,
                    district: "",
                    ward: "",
                  })
                }
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {divisions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                className="h-11 w-full rounded-xl border border-[#DFE6E1] bg-white px-4 text-sm text-[#2E3742] outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                disabled={!filterDraft.city}
                value={filterDraft.district}
                onChange={(event) =>
                  updateFilterDraft({
                    district: event.target.value,
                    ward: "",
                  })
                }
              >
                <option value="">Chọn quận/huyện</option>
                {(selectedFilterCity?.districts ?? []).map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                className="h-11 w-full rounded-xl border border-[#DFE6E1] bg-white px-4 text-sm text-[#2E3742] outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                disabled={!filterDraft.district}
                value={filterDraft.ward}
                onChange={(event) => updateFilterDraft({ ward: event.target.value })}
              >
                <option value="">Chọn phường/xã</option>
                {(selectedFilterDistrict?.wards ?? []).map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </ResultsFilterPopover>

          <ResultsFilterPopover
            actions={
              <>
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={() => resetFilterFields(["propertyType"])}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={() => applyFilterDraft()}
                >
                  Áp dụng
                </button>
              </>
            }
            icon={Building2}
            isOpen={openFilter === "propertyType"}
            onToggle={() => openFilterPanel("propertyType")}
            summary={searchState.propertyType || "Tất cả loại hình"}
            title="Loại bất động sản"
          >
            <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
              {propertyTypeOptions.map((option) => {
                const isSelected = filterDraft.propertyType === option.value;

                return (
                  <label
                    key={option.label}
                    className={`flex cursor-pointer items-center gap-3 rounded-[16px] px-3 py-2.5 transition ${
                      isSelected ? "bg-[#F2FBF4]" : "hover:bg-[#F8FBF8]"
                    }`}
                  >
                    <input
                      checked={isSelected}
                      className="size-4 accent-[#35A554]"
                      name="results-property-type"
                      type="radio"
                      onChange={() => updateFilterDraft({ propertyType: option.value })}
                    />
                    <option.icon className="size-4 text-[#64717D]" />
                    <span className="text-sm font-medium text-[#2D3440]">
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </ResultsFilterPopover>

          <ResultsFilterPopover
            actions={
              <>
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={() => resetFilterFields(["minPrice", "maxPrice"])}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={() => applyFilterDraft()}
                >
                  Áp dụng
                </button>
              </>
            }
            icon={CircleDollarSign}
            isOpen={openFilter === "price"}
            onToggle={() => openFilterPanel("price")}
            summary={getPriceFilterSummary(searchState)}
            title="Khoảng giá"
          >
            <div className="grid grid-cols-2 gap-3">
              <input
                className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                inputMode="numeric"
                placeholder="Từ"
                value={filterDraft.minPrice}
                onChange={(event) => updateFilterDraft({ minPrice: event.target.value })}
              />
              <input
                className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                inputMode="numeric"
                placeholder="Đến"
                value={filterDraft.maxPrice}
                onChange={(event) => updateFilterDraft({ maxPrice: event.target.value })}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {pricePresetOptions.map((preset) => {
                const isActive =
                  filterDraft.minPrice === preset.minPrice &&
                  filterDraft.maxPrice === preset.maxPrice;

                return (
                  <button
                    key={preset.label}
                    className={getPresetButtonClassName(isActive)}
                    type="button"
                    onClick={() =>
                      updateFilterDraft({
                        minPrice: preset.minPrice,
                        maxPrice: preset.maxPrice,
                      })
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </ResultsFilterPopover>

          <ResultsFilterPopover
            actions={
              <>
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={() => resetFilterFields(["minArea", "maxArea"])}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={() => applyFilterDraft()}
                >
                  Áp dụng
                </button>
              </>
            }
            icon={Ruler}
            isOpen={openFilter === "area"}
            onToggle={() => openFilterPanel("area")}
            summary={getAreaFilterSummary(searchState)}
            title="Diện tích"
          >
            <div className="grid grid-cols-2 gap-3">
              <input
                className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                inputMode="numeric"
                placeholder="Từ m²"
                value={filterDraft.minArea}
                onChange={(event) => updateFilterDraft({ minArea: event.target.value })}
              />
              <input
                className="h-11 rounded-xl border border-[#DFE6E1] px-4 text-sm outline-none focus:border-[#35A554] focus:ring-2 focus:ring-[#35A554]/15"
                inputMode="numeric"
                placeholder="Đến m²"
                value={filterDraft.maxArea}
                onChange={(event) => updateFilterDraft({ maxArea: event.target.value })}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {areaPresetOptions.map((preset) => {
                const isActive =
                  filterDraft.minArea === preset.minArea &&
                  filterDraft.maxArea === preset.maxArea;

                return (
                  <button
                    key={preset.label}
                    className={getPresetButtonClassName(isActive)}
                    type="button"
                    onClick={() =>
                      updateFilterDraft({
                        minArea: preset.minArea,
                        maxArea: preset.maxArea,
                      })
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </ResultsFilterPopover>

          <ResultsFilterPopover
            actions={
              <>
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={() => resetFilterFields(["bedrooms"])}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={() => applyFilterDraft()}
                >
                  Áp dụng
                </button>
              </>
            }
            icon={BedDouble}
            isOpen={openFilter === "bedrooms"}
            onToggle={() => openFilterPanel("bedrooms")}
            summary={getRoomFilterSummary(searchState.bedrooms, "phòng ngủ")}
            title="Số phòng ngủ"
          >
            <div className="grid grid-cols-3 gap-2">
              {bedroomOptions.map((option) => (
                <button
                  key={option.label}
                  className={getPresetButtonClassName(
                    filterDraft.bedrooms === option.value,
                  )}
                  type="button"
                  onClick={() => updateFilterDraft({ bedrooms: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </ResultsFilterPopover>

          <ResultsFilterPopover
            actions={
              <>
                <button
                  className="h-10 rounded-xl border border-[#DCE2DD] text-sm font-semibold text-[#5B6571]"
                  type="button"
                  onClick={() => resetFilterFields(["bathrooms"])}
                >
                  Xóa
                </button>
                <button
                  className="h-10 rounded-xl bg-[#35A554] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(53,165,84,0.18)]"
                  type="button"
                  onClick={() => applyFilterDraft()}
                >
                  Áp dụng
                </button>
              </>
            }
            icon={Bath}
            isOpen={openFilter === "bathrooms"}
            onToggle={() => openFilterPanel("bathrooms")}
            summary={getRoomFilterSummary(searchState.bathrooms, "WC")}
            title="Số phòng vệ sinh"
          >
            <div className="grid grid-cols-2 gap-2">
              {bathroomOptions.map((option) => (
                <button
                  key={option.label}
                  className={getPresetButtonClassName(
                    filterDraft.bathrooms === option.value,
                  )}
                  type="button"
                  onClick={() => updateFilterDraft({ bathrooms: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </ResultsFilterPopover>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="rounded-[28px] border border-[#E7ECE8] bg-white p-5 shadow-[0_14px_36px_rgba(43,64,51,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#7B8590]">
                <span>Trang chủ</span>
                <ChevronRight className="size-4" />
                <span className="font-semibold text-[#2A313A]">Tìm kiếm</span>
              </div>
              <h1 className="mt-2 text-[32px] font-bold tracking-[-0.03em] text-[#1F252D]">
                Kết quả tìm kiếm
              </h1>
              <p className="mt-1 text-sm text-[#6D7681]">
                {sortedListings.length.toLocaleString("vi-VN")} tin đăng phù hợp
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="h-11 rounded-xl border border-[#DFE5E0] bg-white px-4 text-sm text-[#2B3540] outline-none focus:border-[#35A554]"
                value={sortMode}
                onChange={(event) => {
                  setSortMode(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="priority">Ưu tiên gói tin</option>
                <option value="latest">Mới nhất</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
              </select>
              <select
                className="h-11 rounded-xl border border-[#DFE5E0] bg-white px-4 text-sm text-[#2B3540] outline-none focus:border-[#35A554]"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>Hiển thị 10/trang</option>
                <option value={20}>Hiển thị 20/trang</option>
                <option value={30}>Hiển thị 30/trang</option>
              </select>
            </div>
          </div>

          {activeChips.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  className="inline-flex items-center gap-2 rounded-full border border-[#DCE7DF] bg-[#F8FBF8] px-3 py-2 text-sm text-[#33414E] transition hover:border-[#CBE3D1]"
                  type="button"
                  onClick={() => removeChip(chip.key)}
                >
                  <span>{chip.label}</span>
                  <X className="size-3.5 text-[#7E8994]" />
                </button>
              ))}
              <button
                className="text-sm font-semibold text-[#2E944B]"
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setOpenFilter("");
                  setFilterDraft(defaultPropertySearchState);
                  emitSearchState(defaultPropertySearchState);
                  onClearFilters?.();
                }}
              >
                Xóa tất cả
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {currentListings.length ? (
            currentListings.map((listing) => (
              <SearchResultsListItem
                key={listing.id}
                listing={listing}
                onViewListing={onViewListing}
              />
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#D7E4D9] bg-white px-6 py-14 text-center shadow-[0_12px_30px_rgba(42,66,52,0.04)]">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EDF8F0] text-[#35A554]">
                <Search className="size-7" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[#1F252D]">
                Chưa có tin phù hợp
              </h2>
              <p className="mt-2 text-sm text-[#6E7781]">
                Hãy thử nới rộng khu vực, khoảng giá hoặc loại bất động sản.
              </p>
            </div>
          )}
        </div>

        {sortedListings.length ? (
          <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-[#E7ECE8] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(42,66,52,0.05)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#6B7681]">
              Hiển thị{" "}
              {Math.min(
                (currentPageSafe - 1) * pageSize + 1,
                sortedListings.length,
              )}{" "}
              - {Math.min(currentPageSafe * pageSize, sortedListings.length)} /{" "}
              {sortedListings.length} kết quả
            </p>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                className="flex size-10 items-center justify-center rounded-xl border border-[#DDE3DE] text-[#5B6772] disabled:opacity-45"
                disabled={currentPageSafe === 1}
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (page) =>
                    totalPages <= 5 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPageSafe) <= 1,
                )
                .map((page, index, pages) => {
                  const previousPage = pages[index - 1];
                  const shouldInsertGap =
                    previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {shouldInsertGap ? (
                        <span className="px-1 text-sm text-[#8D96A1]">...</span>
                      ) : null}
                      <button
                        className={`flex size-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                          currentPageSafe === page
                            ? "bg-[#35A554] text-white shadow-[0_10px_18px_rgba(53,165,84,0.18)]"
                            : "border border-[#DDE3DE] text-[#55616D] hover:border-[#CDE4D3]"
                        }`}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}

              <button
                className="flex size-10 items-center justify-center rounded-xl border border-[#DDE3DE] text-[#5B6772] disabled:opacity-45"
                disabled={currentPageSafe === totalPages}
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

