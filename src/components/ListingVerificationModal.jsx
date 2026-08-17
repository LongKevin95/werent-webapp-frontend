import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { submitListingVerification } from "../lib/property-client";

const documentTypeOptions = [
  ["ownership_certificate", "Sổ hồng"],
  ["sale_contract", "Hợp đồng mua bán"],
  ["sublease_contract", "Hợp đồng thuê lại"],
  ["authorization_letter", "Giấy ủy quyền"],
];

export default function ListingVerificationModal({
  accessToken,
  initialRequest = null,
  listing,
  onClose,
  onSuccess,
  readOnly = false,
  submitLabel = "Gửi hồ sơ xác thực",
  title = "Xác thực bất động sản",
}) {
  const [documentType, setDocumentType] = useState(
    initialRequest?.documentType ?? "ownership_certificate",
  );
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const rejectionReason = initialRequest?.rejectionReason ?? "";
  const adminNote = initialRequest?.adminNote ?? "";

  async function submit(event) {
    event.preventDefault();

    if (!files.length) {
      setError("Vui lòng chọn ít nhất một giấy tờ.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await submitListingVerification(
        accessToken,
        listing.id,
        documentType,
        files,
        note,
      );
      onSuccess(response);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  if (readOnly) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#B83B3B]">
              Lý do từ chối
            </h2>
            <button
              aria-label="Đóng"
              className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              type="button"
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-6 flex min-h-32 items-start rounded-2xl border border-[#F2D2D2] bg-[#FFF7F7] p-5 text-sm">
            <p className="leading-7 text-[#6B4A4A]">
              {rejectionReason || "Admin chưa nhập lý do cụ thể."}
            </p>
          </div>

          <button
            className="mt-6 flex w-full items-center justify-center rounded-xl border border-slate-200 py-3.5 font-semibold text-[#38424D] transition hover:bg-slate-50"
            type="button"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4">
      <form
        className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1F252D]">{title}</h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {listing.title}
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {rejectionReason || adminNote ? (
          <div className="mt-5 space-y-3 rounded-2xl border border-[#F2D2D2] bg-[#FFF7F7] p-4 text-sm">
            <div>
              <p className="font-semibold text-[#B83B3B]">Yêu cầu bổ sung</p>
              <p className="mt-1 leading-6 text-[#6B4A4A]">
                {adminNote ||
                  rejectionReason ||
                  "Vui lòng kiểm tra lại giấy tờ và gửi hồ sơ mới."}
              </p>
            </div>
          </div>
        ) : null}

        <label className="mt-5 block text-sm font-medium text-[#38424D]">
          Loại giấy tờ
          <select
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#32A452] focus:ring-2 focus:ring-[#32A452]/15"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
          >
            {documentTypeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block rounded-xl border border-dashed border-slate-300 p-4 text-sm font-medium text-[#38424D] transition hover:border-[#32A452] hover:bg-green-50/40">
          Tải giấy tờ, hình ảnh chứng minh (tối đa 10 tệp)
          <input
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mt-3 block w-full text-xs"
            multiple
            required
            type="file"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-[#38424D]">
          Ghi chú
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#32A452] focus:ring-2 focus:ring-[#32A452]/15"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#32A452] py-3 font-semibold text-white disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {saving ? "Đang gửi..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
