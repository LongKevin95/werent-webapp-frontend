import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileCheck2,
  LoaderCircle,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  getAdminKycRequest,
  getAdminKycRequests,
  reviewAdminKycRequest,
} from "./lib/admin-client";
import { getApiBaseUrl } from "./lib/auth-client";

const accountStatuses = {
  pending: "Chờ duyệt",
  verified: "Đã xác thực",
  rejected: "Từ chối",
};
const listingStatuses = {
  pending: "Chờ duyệt",
  verified_owner: "Chính chủ",
  verified_authorized: "Được ủy quyền",
  rejected: "Từ chối",
  need_more_info: "Bổ sung",
};
const documentTypes = {
  ownership_certificate: "Sổ hồng",
  sale_contract: "Hợp đồng mua bán",
  sublease_contract: "Hợp đồng thuê lại",
  authorization_letter: "Giấy ủy quyền",
};
const emptyDocuments = [];
const fmt = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const normalizeAccountStatus = (status) =>
  status === "need_more_info" ? "rejected" : status;
const statusBadgeClass = (status) =>
  status === "verified"
    ? "bg-green-50 text-green-700"
    : status === "rejected"
      ? "bg-red-50 text-red-700"
      : status === "need_more_info"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700";

function ReviewBox({ kind, item, onReview, busy }) {
  const choices =
    kind === "accounts"
      ? [
          ["verified", "Duyệt hồ sơ"],
          ["rejected", "Từ chối và yêu cầu bổ sung"],
        ]
      : [
          ["verified_owner", "Xác thực chính chủ"],
          ["verified_authorized", "Xác thực được ủy quyền"],
          ["need_more_info", "Yêu cầu bổ sung"],
          ["rejected", "Từ chối"],
        ];
  const [status, setStatus] = useState(choices[0][0]);
  const [reason, setReason] = useState("");
  const needsReason =
    status === "rejected" ||
    (kind === "listings" && status === "need_more_info");
  return (
    <form
      className="mt-5 rounded-xl border bg-slate-50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onReview({ status, ...(reason ? { reason } : {}) });
      }}
    >
      <h4 className="font-bold">Kết quả kiểm tra</h4>
      <select
        className="mt-3 h-10 w-full rounded-lg border bg-white px-3 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {choices.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {needsReason ? (
        <textarea
          className="mt-3 min-h-20 w-full rounded-lg border p-3 text-sm"
          placeholder="Nhập lý do cụ thể (bắt buộc)"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      ) : null}
      <button
        className="mt-3 w-full rounded-lg bg-[#159848] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={busy || item.status !== "pending"}
      >
        {busy
          ? "Đang lưu..."
          : item.status !== "pending"
            ? "Hồ sơ đã xử lý"
            : "Xác nhận kết quả"}
      </button>
    </form>
  );
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

function isImageDocument(document) {
  return (
    document.mimeType?.startsWith("image/") ||
    /\.(avif|gif|jpe?g|png|webp)$/i.test(
      `${document.url ?? ""} ${document.originalName ?? ""}`,
    )
  );
}

function getDocumentName(document, index) {
  return document.originalName || document.kind || `Ảnh ${index + 1}`;
}

function DocumentGallery({ accessToken, documents, onError }) {
  const safeDocuments = documents ?? emptyDocuments;
  const [imageUrls, setImageUrls] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);
  const imageDocuments = useMemo(
    () =>
      safeDocuments
        .map((document, index) => ({ document, index }))
        .filter(({ document }) => isImageDocument(document)),
    [safeDocuments],
  );
  const otherDocuments = useMemo(
    () =>
      safeDocuments
        .map((document, index) => ({ document, index }))
        .filter(({ document }) => !isImageDocument(document)),
    [safeDocuments],
  );
  const activeImage =
    activeIndex === null || activeIndex >= imageDocuments.length
      ? null
      : imageDocuments[activeIndex];

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    async function loadImages() {
      const entries = await Promise.all(
        imageDocuments.map(async ({ document, index }) => {
          if (!document.url) return null;
          if (!document.url.startsWith("/api/uploads/werent/kyc"))
            return [index, document.url];
          const response = await fetch(`${getApiBaseUrl()}${document.url}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) throw new Error("Không thể tải ảnh xác thực.");
          const objectUrl = URL.createObjectURL(await response.blob());
          objectUrls.push(objectUrl);
          return [index, objectUrl];
        }),
      );
      if (!cancelled) setImageUrls(Object.fromEntries(entries.filter(Boolean)));
    }

    loadImages().catch((error) => {
      if (!cancelled) onError(error.message);
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [accessToken, imageDocuments, onError]);

  function move(delta) {
    setActiveIndex((current) => {
      if (current === null || imageDocuments.length < 2) return current;
      return (current + delta + imageDocuments.length) % imageDocuments.length;
    });
  }

  if (!safeDocuments.length) {
    return <p className="mt-2 text-sm text-slate-500">Chưa có giấy tờ.</p>;
  }

  return (
    <div className="mt-2">
      {imageDocuments.length ? (
        <div className="grid grid-cols-2 gap-3">
          {imageDocuments.map(({ document, index }, galleryIndex) => (
            <button
              className="group overflow-hidden rounded-xl border bg-white p-2 text-left transition hover:border-green-300 hover:bg-green-50/40"
              key={`${document.publicId || document.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(galleryIndex)}
            >
              <span className="block overflow-hidden rounded-lg bg-slate-100">
                {imageUrls[index] ? (
                  <img
                    alt={getDocumentName(document, index)}
                    className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                    src={imageUrls[index]}
                  />
                ) : (
                  <span className="flex aspect-[4/3] items-center justify-center text-xs text-slate-400">
                    Đang tải ảnh...
                  </span>
                )}
              </span>
              <span className="mt-2 block truncate text-xs font-medium text-slate-700">
                {getDocumentName(document, index)}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {otherDocuments.length ? (
        <div className="mt-3 grid gap-2">
          {otherDocuments.map(({ document, index }) => (
            <button
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
              key={`${document.publicId || document.url}-${index}`}
              type="button"
              onClick={() =>
                openVerificationDocument(document, accessToken, onError)
              }
            >
              <FileCheck2 className="size-4" />
              {getDocumentName(document, index)}
            </button>
          ))}
        </div>
      ) : null}

      {activeImage ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[calc(100dvh-32px)] w-full max-w-4xl flex-col rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                {getDocumentName(activeImage.document, activeImage.index)}
              </p>
              <button
                aria-label="Đóng khung xem ảnh"
                className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
                type="button"
                onClick={() => setActiveIndex(null)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="relative mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {imageDocuments.length > 1 ? (
                <button
                  aria-label="Ảnh trước"
                  className="absolute left-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
                  type="button"
                  onClick={() => move(-1)}
                >
                  <ChevronLeft className="size-5" />
                </button>
              ) : null}
              <img
                alt={getDocumentName(activeImage.document, activeImage.index)}
                className="max-h-[calc(100dvh-150px)] w-full object-contain"
                src={imageUrls[activeImage.index]}
              />
              {imageDocuments.length > 1 ? (
                <button
                  aria-label="Ảnh tiếp theo"
                  className="absolute right-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
                  type="button"
                  onClick={() => move(1)}
                >
                  <ChevronRight className="size-5" />
                </button>
              ) : null}
            </div>
            {imageDocuments.length > 1 ? (
              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                {activeIndex + 1}/{imageDocuments.length}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ accessToken, item, kind, onError, onReview, busy }) {
  const [basicOpen, setBasicOpen] = useState(true);
  if (!item)
    return (
      <aside className="p-6 text-sm text-slate-500">
        Chọn một hồ sơ để xem chi tiết.
      </aside>
    );
  const property = item.property;
  const user = item.user;
  const fields =
    kind === "accounts"
      ? [
          ["Họ tên", item.fullName],
          ["Ngày sinh", fmt(item.dateOfBirth)],
          ["Email", item.email],
          ["Số điện thoại", item.phone],
          ["Địa chỉ", item.address],
          ["Số CCCD", item.identityNumber],
          ["Ngày cấp", fmt(item.identityIssuedAt)],
          ["Số hộ chiếu", item.passportNumber],
          ["Mã số thuế", item.taxCode],
        ]
      : [
          ["Loại BĐS", property?.propertyType],
          ["Dự án", property?.projectName || "—"],
          ["Địa chỉ", property?.address],
          ["Diện tích", property?.area ? `${property.area} m²` : "—"],
          ["Phòng ngủ", property?.bedrooms ?? "—"],
          ["Phòng tắm", property?.bathrooms ?? "—"],
          ["Trạng thái tin", property?.status],
        ];
  return (
    <aside className="max-h-[calc(100vh-190px)] overflow-y-auto border-l p-5">
      <h3 className="text-lg font-bold">Chi tiết hồ sơ</h3>
      <p className="mt-1 text-xs text-slate-500">
        Gửi lúc {new Date(item.createdAt).toLocaleString("vi-VN")}
      </p>
      {kind === "listings" ? (
        <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3">
          <p className="text-xs text-green-700">Người đã KYC</p>
          <p className="font-semibold">{user?.fullName}</p>
          <p className="text-xs text-slate-500">
            CCCD: {user?.identityNumber || "—"}
          </p>
        </div>
      ) : null}
      <button
        className="mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold"
        onClick={() => setBasicOpen(!basicOpen)}
      >
        <span>Thông tin cơ bản</span>
        {basicOpen ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>
      {basicOpen ? (
        <dl className="mt-2 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          {fields.map(([k, v]) => (
            <div className="grid grid-cols-[105px_1fr] gap-2" key={k}>
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {kind === "listings" ? (
        <div className="mt-4 rounded-xl border p-4 text-sm">
          <p className="font-semibold">Loại giấy tờ</p>
          <p className="mt-1 text-slate-600">
            {documentTypes[item.documentType] ?? item.documentType}
          </p>
          {item.note ? (
            <p className="mt-2 text-xs">Ghi chú: {item.note}</p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4">
        <h4 className="font-semibold">Giấy tờ đã tải lên</h4>
        <DocumentGallery
          accessToken={accessToken}
          documents={item.documents}
          onError={onError}
        />
      </div>
      {item.rejectionReason ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <b>Lý do:</b> {item.rejectionReason}
        </p>
      ) : null}
      <ReviewBox busy={busy} item={item} kind={kind} onReview={onReview} />
    </aside>
  );
}

export default function AdminKycPage({ accessToken, onNotify = () => {} }) {
  const cacheRef = useRef({
    details: new Map(),
    lists: new Map(),
  });
  const detailRequestRef = useRef(null);
  const [kind, setKind] = useState("accounts");
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const cacheVersion = refresh;

  const loadDetail = useCallback(
    async (nextKind, item, options = {}) => {
      if (!item?._id) return null;

      const cacheKey = `${cacheVersion}:${nextKind}:${item._id}`;
      const cachedDetail = cacheRef.current.details.get(cacheKey);

      if (cachedDetail) {
        return cachedDetail;
      }

      const response = await getAdminKycRequest(
        accessToken,
        nextKind,
        item._id,
        options,
      );
      const detail = response.data.item;
      cacheRef.current.details.set(cacheKey, detail);
      return detail;
    },
    [accessToken, cacheVersion],
  );

  useEffect(() => {
    if (error) onNotify(error, "error");
  }, [error, onNotify]);
  useEffect(() => {
    const controller = new AbortController();
    const listCacheKey = `${cacheVersion}:${kind}:${status}:50`;
    let isActive = true;

    async function loadRequests() {
      setLoading(true);
      setError("");

      try {
        let nextItems = cacheRef.current.lists.get(listCacheKey);

        if (!nextItems) {
          const response = await getAdminKycRequests(
            accessToken,
            kind,
            { status, limit: 50 },
            { signal: controller.signal },
          );
          nextItems = response.data.items;
          cacheRef.current.lists.set(listCacheKey, nextItems);
        }

        if (!isActive || controller.signal.aborted) return;

        setItems(nextItems);

        const first = nextItems[0];
        if (!first) {
          setSelected(null);
          return;
        }

        const detail = await loadDetail(kind, first, {
          signal: controller.signal,
        });

        if (!isActive || controller.signal.aborted) return;
        setSelected(detail);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        if (isActive && !controller.signal.aborted) setLoading(false);
      }
    }

    loadRequests();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [accessToken, cacheVersion, kind, loadDetail, status]);
  async function open(item) {
    detailRequestRef.current?.abort();
    const controller = new AbortController();
    detailRequestRef.current = controller;

    try {
      const detail = await loadDetail(kind, item, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setSelected(detail);
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      if (detailRequestRef.current === controller) {
        detailRequestRef.current = null;
      }
    }
  }
  async function review(payload) {
    setBusy(true);
    setError("");
    try {
      await reviewAdminKycRequest(accessToken, kind, selected._id, payload);
      onNotify("Cập nhật hồ sơ xác thực thành công.");
      setRefresh((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const statuses = kind === "accounts" ? accountStatuses : listingStatuses;
  return (
    <div>
      <section className="grid gap-3 sm:grid-cols-2">
        <button
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${kind === "accounts" ? "border-green-300 bg-green-50" : "bg-white"}`}
          onClick={() => setKind("accounts")}
        >
          <UserRoundCheck className="size-6 text-green-600" />
          <span>
            <b className="block">Xác thực tài khoản</b>
            <small className="text-slate-500">
              Đối chiếu CCCD, selfie và thông tin cá nhân
            </small>
          </span>
        </button>
        <button
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${kind === "listings" ? "border-green-300 bg-green-50" : "bg-white"}`}
          onClick={() => setKind("listings")}
        >
          <ShieldCheck className="size-6 text-green-600" />
          <span>
            <b className="block">Xác thực tin đăng</b>
            <small className="text-slate-500">
              Kiểm tra quyền sở hữu hoặc quyền cho thuê
            </small>
          </span>
        </button>
      </section>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(statuses).map(([key, label]) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm ${status === key ? "bg-[#159848] text-white" : "border bg-white"}`}
            key={key}
            onClick={() => setStatus(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="mt-4 grid overflow-hidden rounded-2xl border bg-white xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-[118px] p-4">Mã hồ sơ</th>
                <th className="w-[172px] px-3">Người gửi</th>
                <th className="px-3">{kind === "accounts" ? "CCCD" : "Tin đăng"}</th>
                <th className="w-[92px] whitespace-nowrap px-3">Ngày gửi</th>
                <th className="w-[96px] whitespace-nowrap px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-12 text-center" colSpan="5">
                    <LoaderCircle className="mx-auto animate-spin text-green-600" />
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr
                    className={`cursor-pointer border-t hover:bg-green-50/50 ${selected?._id === item._id ? "bg-green-50" : ""}`}
                    key={item._id}
                    onClick={() => open(item)}
                  >
                    <td className="whitespace-nowrap p-4 font-semibold">
                      #{item._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="min-w-0 px-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.user?.fullName || item.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {item.user?.email || item.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-3">
                      <p className="line-clamp-2">
                        {kind === "accounts"
                          ? item.identityNumber
                          : item.property?.title}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3">
                      {fmt(item.createdAt)}
                    </td>
                    <td className="px-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs ${statusBadgeClass(kind === "accounts" ? normalizeAccountStatus(item.status) : item.status)}`}
                      >
                        {
                          statuses[
                            kind === "accounts"
                              ? normalizeAccountStatus(item.status)
                              : item.status
                          ]
                        }
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-12 text-center text-slate-500" colSpan="5">
                    Không có hồ sơ phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Detail
          accessToken={accessToken}
          busy={busy}
          item={selected}
          kind={kind}
          onError={setError}
          onReview={review}
        />
      </section>
    </div>
  );
}

