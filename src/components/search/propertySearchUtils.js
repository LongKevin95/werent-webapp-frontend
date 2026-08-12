export const defaultPropertySearchState = Object.freeze({
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

const tierPriorityMap = {
  vipDiamond: 4,
  vipGold: 3,
  vipSilver: 2,
  standard: 1,
};

const PROPERTY_TYPE_SEARCH_GROUPS = [
  {
    value: "Căn hộ chung cư",
    aliases: [
      "căn hộ chung cư",
      "căn hộ",
      "chung cư",
      "căn hộ dịch vụ",
      "apartment",
    ],
    matchers: [
      "căn hộ chung cư",
      "căn hộ",
      "chung cư",
      "căn hộ dịch vụ",
      "chung cư mini",
      "studio",
    ],
  },
  {
    value: "Phòng trọ",
    aliases: [
      "phòng trọ",
      "phòng cho thuê",
      "phòng thuê",
      "nhà trọ",
      "ở trọ",
      "trọ",
    ],
    matchers: ["phòng trọ", "phòng cho thuê", "nhà trọ", "ký túc xá", "ở ghép"],
  },
  {
    value: "Nhà nguyên căn",
    aliases: [
      "nhà nguyên căn",
      "nhà riêng",
      "nhà thuê nguyên căn",
      "nguyên căn",
      "nhà",
    ],
    matchers: ["nhà nguyên căn", "nhà riêng", "nhà thuê nguyên căn", "nguyên căn"],
  },
  {
    value: "Nhà phố",
    aliases: ["nhà phố", "nhà mặt tiền", "mặt tiền"],
    matchers: ["nhà phố", "nhà mặt tiền", "mặt tiền"],
  },
];

PROPERTY_TYPE_SEARCH_GROUPS.push(
  {
    value: "Nhà đất",
    aliases: ["nhà đất", "thuê nhà đất"],
    matchers: [
      "nhà đất",
      "nhà nguyên căn",
      "nhà riêng",
      "nhà thuê nguyên căn",
      "nhà phố",
      "nhà mặt tiền",
      "mặt tiền",
      "đất",
      "đất nền",
    ],
  },
  {
    value: "Phòng trọ",
    aliases: ["phòng"],
    matchers: ["phòng trọ", "phòng cho thuê", "nhà trọ", "ký túc xá", "ở ghép"],
  },
  {
    value: "Đất nền",
    aliases: ["đất", "đất nền", "nhà đất", "thuê đất"],
    matchers: ["đất", "đất nền", "nhà đất"],
  },
  {
    value: "Biệt thự",
    aliases: ["biệt thự", "villa"],
    matchers: ["biệt thự", "villa"],
  },
  {
    value: "Văn phòng",
    aliases: ["văn phòng", "office"],
    matchers: ["văn phòng", "office"],
  },
);

const PROJECT_SEARCH_GROUPS = [
  ["Vinhomes Grand Park", "vinhome grand park", "vinhomes grand park"],
  ["Vinhomes Central Park", "vinhome central park", "vinhomes central park"],
  ["Vinhomes Metropolis", "vinhome metropolis", "vinhomes metropolis"],
  ["The Metropole", "metropole", "the metropole"],
  ["New City Thủ Thiêm", "new city thủ thiêm", "new city thu thiem"],
  ["Landmark 81", "landmark 81", "vinhomes landmark 81"],
  ["Sunrise City", "sunrise city"],
  ["The Sun Avenue", "sun avenue", "the sun avenue"],
  ["Pearl Plaza Residence", "pearl plaza", "pearl plaza residence"],
].map(([label, ...aliases]) => ({ label, aliases: [label, ...aliases] }));

const LOCATION_SEARCH_GROUPS = [
  ["TP. Hồ Chí Minh", "tp hồ chí minh", "tp hcm", "tphcm", "hồ chí minh", "sài gòn", "saigon"],
  ["Hà Nội", "hà nội", "ha noi"],
  ["TP. Thủ Đức", "tp thủ đức", "thủ đức", "thu duc"],
  ["Quận 1", "quận 1", "q1"],
  ["Quận 2", "quận 2", "q2"],
  ["Quận 3", "quận 3", "q3"],
  ["Quận 7", "quận 7", "q7"],
  ["Quận 10", "quận 10", "q10"],
  ["Bình Thạnh", "bình thạnh"],
  ["Tân Bình", "tân bình"],
  ["Gò Vấp", "gò vấp"],
  ["Phú Mỹ Hưng", "phú mỹ hưng", "phu my hung"],
  ["Hồ Gươm", "hồ gươm", "ho guom"],
  ["Cầu Phú Mỹ", "cầu phú mỹ", "cau phu my"],
  ["Cầu Long Biên", "cầu long biên", "cau long bien"],
  ["Bến xe Miền Đông", "bến xe miền đông", "ben xe mien dong"],
  ["Đại học RMIT", "đại học rmit", "dh rmit", "rmit"],
  ["Đại học Bách Khoa", "đại học bách khoa", "dh bách khoa", "bách khoa"],
  ["Lotte Mart", "lotte mart"],
].map(([label, ...aliases]) => ({ label, aliases: [label, ...aliases] }));

const HCMC_CITY_NAME = "TP. Hồ Chí Minh";
const HCMC_DISTRICT_SEARCH_GROUPS = [
  ["Quận 1", "quận 1", "q1", "quan 1", "district 1"],
  ["Quận 2", "quận 2", "q2", "quan 2", "district 2"],
  ["Quận 3", "quận 3", "q3", "quan 3", "district 3"],
  ["Quận 4", "quận 4", "q4", "quan 4", "district 4"],
  ["Quận 5", "quận 5", "q5", "quan 5", "district 5"],
  ["Quận 6", "quận 6", "q6", "quan 6", "district 6"],
  ["Quận 7", "quận 7", "q7", "quan 7", "district 7"],
  ["Quận 8", "quận 8", "q8", "quan 8", "district 8"],
  ["Quận 9", "quận 9", "q9", "quan 9", "district 9"],
  ["Quận 10", "quận 10", "q10", "quan 10", "district 10"],
  ["Quận 11", "quận 11", "q11", "quan 11", "district 11"],
  ["Quận 12", "quận 12", "q12", "quan 12", "district 12"],
  ["Quận Bình Tân", "bình tân", "quận bình tân", "q bình tân", "binh tan", "quan binh tan"],
  ["Quận Bình Thạnh", "bình thạnh", "quận bình thạnh", "q bình thạnh", "binh thanh", "quan binh thanh"],
  ["Quận Gò Vấp", "gò vấp", "quận gò vấp", "q gò vấp", "go vap", "quan go vap"],
  ["Quận Phú Nhuận", "phú nhuận", "quận phú nhuận", "q phú nhuận", "phu nhuan", "quan phu nhuan"],
  ["Quận Tân Bình", "tân bình", "quận tân bình", "q tân bình", "tan binh", "quan tan binh"],
  ["Quận Tân Phú", "tân phú", "quận tân phú", "q tân phú", "tan phu", "quan tan phu"],
  ["TP. Thủ Đức", "thủ đức", "tp thủ đức", "thành phố thủ đức", "thu duc", "tp thu duc"],
  ["Huyện Bình Chánh", "bình chánh", "huyện bình chánh", "binh chanh", "huyen binh chanh"],
  ["Huyện Cần Giờ", "cần giờ", "huyện cần giờ", "can gio", "huyen can gio"],
  ["Huyện Củ Chi", "củ chi", "huyện củ chi", "cu chi", "huyen cu chi"],
  ["Huyện Hóc Môn", "hóc môn", "huyện hóc môn", "hoc mon", "huyen hoc mon"],
  ["Huyện Nhà Bè", "nhà bè", "huyện nhà bè", "nha be", "huyen nha be"],
].map(([district, ...aliases]) => ({
  aliases: [district, ...aliases],
  city: HCMC_CITY_NAME,
  district,
  label: district,
  level: "district",
}));

LOCATION_SEARCH_GROUPS.push(...HCMC_DISTRICT_SEARCH_GROUPS);

LOCATION_SEARCH_GROUPS.push(
  {
    label: "Đà Nẵng",
    aliases: ["đà nẵng", "da nang"],
  },
  {
    label: "Huyện Củ Chi",
    aliases: ["huyện củ chi", "củ chi", "huyen cu chi", "cu chi"],
  },
  {
    label: "Xã Phú Mỹ Hưng",
    aliases: ["xã phú mỹ hưng", "xa phu my hung"],
  },
  {
    label: "Khu đô thị Sala",
    aliases: ["khu đô thị sala", "khu sala", "sala", "khu sala quận 2"],
  },
  {
    label: "Thảo Điền",
    aliases: ["thảo điền", "phường thảo điền", "thao dien", "phuong thao dien"],
  },
);

const BROAD_REAL_ESTATE_ALIASES = [
  "nhà đất",
  "thuê nhà đất",
  "bất động sản",
  "bds",
  "BĐS",
];

const SEARCH_STOP_WORDS = new Set([
  "can",
  "cho",
  "du",
  "duong",
  "gan",
  "hem",
  "khu",
  "khuvuc",
  "o",
  "phuong",
  "quan",
  "tai",
  "thue",
  "tim",
  "tp",
  "tx",
  "va",
  "vung",
  "xa",
]);

function normalizeSearchText(value = "") {
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

function getWordTokens(value = "") {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function includesSearchPhrase(text, phrase) {
  const normalizedText = normalizeSearchText(text);
  const normalizedPhrase = normalizeSearchText(phrase);

  if (!normalizedText || !normalizedPhrase) {
    return false;
  }

  return normalizedText.includes(normalizedPhrase);
}

function removeSearchPhrases(text, phrases = []) {
  let normalizedText = ` ${normalizeSearchText(text)} `;

  phrases.forEach((phrase) => {
    const normalizedPhrase = normalizeSearchText(phrase);

    if (!normalizedPhrase) {
      return;
    }

    normalizedText = normalizedText
      .replaceAll(` ${normalizedPhrase} `, " ")
      .replaceAll(normalizedPhrase, " ");
  });

  return normalizedText.replace(/\s+/g, " ").trim();
}

function findMatchingGroups(keyword, groups) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  return groups.filter((group) =>
    group.aliases.some((alias) => includesSearchPhrase(normalizedKeyword, alias)),
  );
}

function getLongestMatchedAliasLength(keyword, group) {
  return group.aliases.reduce((longestLength, alias) => {
    if (!includesSearchPhrase(keyword, alias)) {
      return longestLength;
    }

    return Math.max(longestLength, normalizeSearchText(alias).length);
  }, 0);
}

function buildListingText(listing, fields) {
  return fields
    .map((field) =>
      field.split(".").reduce((value, key) => value?.[key], listing),
    )
    .filter(Boolean)
    .join(" ");
}

function getListingSearchText(listing) {
  return buildListingText(listing, [
    "title",
    "location",
    "meta",
    "packageLabel",
    "detail.publishedAt",
    "detail.ownerName",
    "detail.formattedAddress",
    "draft.propertyType",
    "draft.city",
    "draft.district",
    "draft.ward",
    "draft.street",
    "draft.addressLine",
    "draft.projectName",
    "draft.description",
    "draft.locationNote",
    "draft.formattedAddress",
  ]);
}

function getListingLocationText(listing) {
  return buildListingText(listing, [
    "location",
    "detail.formattedAddress",
    "draft.city",
    "draft.district",
    "draft.ward",
    "draft.street",
    "draft.addressLine",
    "draft.locationNote",
    "draft.formattedAddress",
  ]);
}

function getListingProjectText(listing) {
  return buildListingText(listing, [
    "title",
    "location",
    "draft.projectName",
    "draft.description",
    "draft.locationNote",
    "draft.formattedAddress",
  ]);
}

function findPropertyTypeGroup(value) {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    PROPERTY_TYPE_SEARCH_GROUPS.find(
      (group) =>
        normalizeSearchText(group.value) === normalizedValue ||
        group.aliases.some((alias) => normalizeSearchText(alias) === normalizedValue) ||
        group.matchers.some((matcher) => normalizeSearchText(matcher) === normalizedValue),
    ) ?? null
  );
}

function matchesPropertyTypeGroup(actualValue, group) {
  if (!group) {
    return true;
  }

  const normalizedActual = normalizeSearchText(actualValue);

  if (!normalizedActual) {
    return false;
  }

  return group.matchers.some((matcher) => {
    const normalizedMatcher = normalizeSearchText(matcher);

    return (
      normalizedActual.includes(normalizedMatcher) ||
      normalizedMatcher.includes(normalizedActual)
    );
  });
}

function matchesProjectGroup(listing, group) {
  const projectText = getListingProjectText(listing);

  return group.aliases.some((alias) => includesSearchPhrase(projectText, alias));
}

function matchesLocationGroup(listing, group) {
  const locationText = getListingLocationText(listing);

  return group.aliases.some((alias) => includesSearchPhrase(locationText, alias));
}

function getMatchedBroadRealEstateAliases(keyword) {
  return BROAD_REAL_ESTATE_ALIASES.filter((alias) =>
    includesSearchPhrase(keyword, alias),
  );
}

function findStaticAdministrativeLocationMatch(keyword) {
  const matchedDistrict = HCMC_DISTRICT_SEARCH_GROUPS
    .map((group) => ({
      group,
      score: group.aliases.reduce((bestScore, alias) => {
        if (!includesSearchPhrase(keyword, alias)) {
          return bestScore;
        }

        return Math.max(bestScore, normalizeSearchText(alias).length);
      }, 0),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.group;

  if (matchedDistrict) {
    return {
      city: matchedDistrict.city,
      district: matchedDistrict.district,
      ward: "",
    };
  }

  return {};
}

export function parsePropertyKeywordIntent(keyword = "") {
  const broadRealEstateAliases = getMatchedBroadRealEstateAliases(keyword);
  const matchedPropertyTypeGroups = findMatchingGroups(
    keyword,
    PROPERTY_TYPE_SEARCH_GROUPS,
  );
  const propertyTypeGroups = broadRealEstateAliases.length
    ? []
    : matchedPropertyTypeGroups.sort(
        (left, right) =>
          getLongestMatchedAliasLength(keyword, right) -
          getLongestMatchedAliasLength(keyword, left),
      );
  const projectGroups = findMatchingGroups(keyword, PROJECT_SEARCH_GROUPS);
  const locationGroups = findMatchingGroups(keyword, LOCATION_SEARCH_GROUPS);
  const matchedPhrases = [
    ...broadRealEstateAliases,
    ...(broadRealEstateAliases.length
      ? matchedPropertyTypeGroups.flatMap((group) => group.aliases)
      : []),
    ...propertyTypeGroups.flatMap((group) => group.aliases),
    ...projectGroups.flatMap((group) => group.aliases),
    ...locationGroups.flatMap((group) => group.aliases),
  ];
  const remainingKeyword = removeSearchPhrases(keyword, matchedPhrases);

  return {
    propertyType: propertyTypeGroups[0]?.value ?? "",
    propertyTypeGroups,
    projectGroups,
    locationGroups,
    broadRealEstateAliases,
    remainingKeyword,
    remainingTokens: getWordTokens(remainingKeyword).filter(
      (token) => !SEARCH_STOP_WORDS.has(token),
    ),
  };
}

function findAdministrativeDivisionMatch(keyword, administrativeDivisions = []) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword || !administrativeDivisions.length) {
    return {};
  }

  let bestMatch = {};
  let bestScore = 0;

  administrativeDivisions.forEach((city) => {
    if (includesSearchPhrase(normalizedKeyword, city.name) && bestScore < 1) {
      bestMatch = { city: city.name };
      bestScore = 1;
    }

    (city.districts ?? []).forEach((district) => {
      if (includesSearchPhrase(normalizedKeyword, district.name) && bestScore < 2) {
        bestMatch = { city: city.name, district: district.name };
        bestScore = 2;
      }

      (district.wards ?? []).forEach((ward) => {
        if (includesSearchPhrase(normalizedKeyword, ward.name) && bestScore < 3) {
          bestMatch = {
            city: city.name,
            district: district.name,
            ward: ward.name,
          };
          bestScore = 3;
        }
      });
    });
  });

  return bestMatch;
}

export function buildSearchStateFromKeyword(searchState = {}, administrativeDivisions = []) {
  const normalizedState = normalizePropertySearchState(searchState);
  const intent = parsePropertyKeywordIntent(normalizedState.keyword);
  const locationMatch = findAdministrativeDivisionMatch(
    normalizedState.keyword,
    administrativeDivisions,
  );
  const staticLocationMatch = findStaticAdministrativeLocationMatch(
    normalizedState.keyword,
  );

  return normalizePropertySearchState({
    ...normalizedState,
    ...staticLocationMatch,
    ...locationMatch,
    propertyType: intent.broadRealEstateAliases.length
      ? ""
      : intent.propertyType || normalizedState.propertyType,
  });
}

function getTierKey(listing) {
  return listing?.draft?.selectedTier || "standard";
}

function parseNumberValue(value) {
  const normalized = String(value ?? "").replace(/[^\d.]/g, "");
  return normalized ? Number(normalized) : 0;
}

function matchesExactFilter(filterValue, actualValue) {
  const normalizedFilter = normalizeSearchText(filterValue);

  if (!normalizedFilter) {
    return true;
  }

  const normalizedActual = normalizeSearchText(actualValue);

  if (!normalizedActual) {
    return false;
  }

  const compactFilter = normalizedFilter
    .replace(/\b(thanh pho|tp|quan|huyen|thi xa|phuong|xa)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compactActual = normalizedActual
    .replace(/\b(thanh pho|tp|quan|huyen|thi xa|phuong|xa)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    normalizedActual.includes(normalizedFilter) ||
    normalizedFilter.includes(normalizedActual) ||
    (compactFilter &&
      compactActual &&
      (compactActual.includes(compactFilter) ||
        compactFilter.includes(compactActual)))
  );
}

function matchesPropertyTypeFilter(filterValue, actualValue) {
  const group = findPropertyTypeGroup(filterValue);

  if (group) {
    return matchesPropertyTypeGroup(actualValue, group);
  }

  return matchesExactFilter(filterValue, actualValue);
}

function matchesKeyword(listing, keyword) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return true;
  }

  const intent = parsePropertyKeywordIntent(keyword);
  const haystack = normalizeSearchText(getListingSearchText(listing));

  if (
    intent.propertyTypeGroups.length &&
    !intent.propertyTypeGroups.some((group) =>
      matchesPropertyTypeGroup(listing?.draft?.propertyType, group),
    )
  ) {
    return false;
  }

  if (
    intent.locationGroups.length &&
    !intent.locationGroups.every((group) => matchesLocationGroup(listing, group))
  ) {
    return false;
  }

  if (
    intent.projectGroups.length &&
    !intent.projectGroups.some((group) => matchesProjectGroup(listing, group))
  ) {
    return false;
  }

  const hasStructuredIntent =
    intent.propertyTypeGroups.length ||
    intent.locationGroups.length ||
    intent.projectGroups.length ||
    intent.broadRealEstateAliases.length;
  const remainingTokens =
    intent.remainingTokens.length || hasStructuredIntent
      ? intent.remainingTokens
      : getWordTokens(keyword).filter((token) => !SEARCH_STOP_WORDS.has(token));

  return remainingTokens.every((token) => haystack.includes(token));
}

export function normalizePropertySearchState(searchState = {}) {
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

export function sortListingsBySearchPriority(listings = []) {
  return [...listings].sort((left, right) => {
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

export function getListingSearchRelevanceScore(listing, searchState = {}) {
  const normalizedState = normalizePropertySearchState(searchState);
  const intent = parsePropertyKeywordIntent(normalizedState.keyword);
  let score = 0;

  if (normalizedState.propertyType) {
    score += matchesPropertyTypeFilter(
      normalizedState.propertyType,
      listing?.draft?.propertyType,
    )
      ? 600
      : 0;
  }

  if (intent.propertyTypeGroups.length) {
    score += intent.propertyTypeGroups.some((group) =>
      matchesPropertyTypeGroup(listing?.draft?.propertyType, group),
    )
      ? 500
      : 0;
  }

  if (normalizedState.city && matchesExactFilter(normalizedState.city, listing?.draft?.city)) {
    score += 320;
  }

  if (
    normalizedState.district &&
    matchesExactFilter(normalizedState.district, listing?.draft?.district)
  ) {
    score += 360;
  }

  if (normalizedState.ward && matchesExactFilter(normalizedState.ward, listing?.draft?.ward)) {
    score += 380;
  }

  if (intent.locationGroups.length) {
    score += intent.locationGroups.some((group) => matchesLocationGroup(listing, group))
      ? 300
      : 0;
  }

  if (intent.projectGroups.length) {
    score += intent.projectGroups.some((group) => matchesProjectGroup(listing, group))
      ? 200
      : 0;
  }

  if (
    normalizedState.keyword &&
    includesSearchPhrase(getListingProjectText(listing), normalizedState.keyword)
  ) {
    score += 80;
  }

  return score;
}

export function filterListingsBySearchState(listings = [], searchState = {}) {
  const normalizedState = normalizePropertySearchState(searchState);
  const minPrice = parseNumberValue(normalizedState.minPrice);
  const maxPrice = parseNumberValue(normalizedState.maxPrice);
  const minArea = parseNumberValue(normalizedState.minArea);
  const maxArea = parseNumberValue(normalizedState.maxArea);
  const minBedrooms = parseNumberValue(normalizedState.bedrooms);
  const minBathrooms = parseNumberValue(normalizedState.bathrooms);

  return listings.filter((listing) => {
    const listingPrice = parseNumberValue(listing?.draft?.rentPrice || listing?.price);
    const listingArea = parseNumberValue(listing?.draft?.area || listing?.area);
    const listingBedrooms = parseNumberValue(listing?.draft?.bedrooms);
    const listingBathrooms = parseNumberValue(listing?.draft?.bathrooms);

    if (!matchesKeyword(listing, normalizedState.keyword)) {
      return false;
    }

    if (!matchesPropertyTypeFilter(normalizedState.propertyType, listing?.draft?.propertyType)) {
      return false;
    }

    if (!matchesExactFilter(normalizedState.city, listing?.draft?.city)) {
      return false;
    }

    if (!matchesExactFilter(normalizedState.district, listing?.draft?.district)) {
      return false;
    }

    if (!matchesExactFilter(normalizedState.ward, listing?.draft?.ward)) {
      return false;
    }

    if (minPrice && listingPrice < minPrice) {
      return false;
    }

    if (maxPrice && listingPrice > maxPrice) {
      return false;
    }

    if (minArea && listingArea < minArea) {
      return false;
    }

    if (maxArea && listingArea > maxArea) {
      return false;
    }

    if (minBedrooms && listingBedrooms < minBedrooms) {
      return false;
    }

    if (minBathrooms && listingBathrooms < minBathrooms) {
      return false;
    }

    return true;
  });
}
