import { useEffect, useRef, useState } from "react";
import { LoaderCircle, ShieldCheck, X } from "lucide-react";
import { submitAccountKyc } from "../lib/auth-client";

const kycTextFields = [
  ["fullName", "Họ và tên", "text", true],
  ["dateOfBirth", "Ngày sinh", "date", true],
  ["email", "Email", "email", true],
  ["phone", "Số điện thoại", "tel", true],
  ["identityNumber", "Số CCCD", "text", true],
  ["identityIssuedAt", "Ngày cấp", "date", true],
];

const kycFileFields = [
  ["identityFront", "CCCD mặt trước"],
  ["identityBack", "CCCD mặt sau"],
  ["selfie", "Ảnh selfie"],
];

export default function KycAccountModal({
  accessToken,
  onClose,
  onSuccess,
  user,
}) {
  const previewUrlsRef = useRef({});
  const [values, setValues] = useState({
    fullName: user.fullName ?? "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    identityNumber: user.identityNumber ?? "",
    identityIssuedAt: user.identityIssuedAt
      ? user.identityIssuedAt.slice(0, 10)
      : "",
  });
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [hasAcceptedCommitment, setHasAcceptedCommitment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputClass =
    "mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-green-500";

  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) =>
        URL.revokeObjectURL(url),
      );
    },
    [],
  );

  function handleFileChange(key, file) {
    if (!file) {
      return;
    }

    if (previewUrlsRef.current[key]) {
      URL.revokeObjectURL(previewUrlsRef.current[key]);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current = {
      ...previewUrlsRef.current,
      [key]: previewUrl,
    };

    setFiles((current) => ({
      ...current,
      [key]: file,
    }));
    setPreviews((current) => ({
      ...current,
      [key]: previewUrl,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!files.identityFront || !files.identityBack || !files.selfie) {
      setError(
        "Vui lòng tải đủ CCCD mặt trước, mặt sau và ảnh selfie.",
      );
      return;
    }

    if (!hasAcceptedCommitment) {
      setError("Vui lòng cam đoan thông tin đã cung cấp là chính xác.");
      return;
    }

    setSaving(true);

    try {
      const response = await submitAccountKyc(accessToken, values, files);
      onSuccess(response.message);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[2px]">
      <form
        className="max-h-[calc(100dvh-32px)] w-full max-w-3xl overflow-hidden rounded-[18px] bg-white p-4 shadow-[0_30px_90px_rgba(10,24,15,0.28)]"
        onSubmit={submit}
      >
        <div className="relative max-h-[calc(100dvh-64px)] overflow-y-auto rounded-[14px] px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-green-50 text-green-600">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Xác thực tài khoản</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Quý khách có thắc mắc xin vui lòng liên hệ CSKH để được hỗ
                  trợ.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="mt-5 grid gap-x-10 gap-y-3 md:grid-cols-2">
            {kycTextFields.map(([key, label, type, required]) => {
              const isLockedContactField = key === "email" || key === "phone";

              return (
                <label className="text-sm" key={key}>
                  {label}
                  <input
                    className={
                      isLockedContactField
                        ? `${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`
                        : inputClass
                    }
                    disabled={isLockedContactField}
                    required={required}
                    type={type}
                    value={values[key]}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-4 grid gap-x-5 gap-y-3 md:grid-cols-3">
            {kycFileFields.map(([key, label]) => (
              <label
                className="cursor-pointer rounded-2xl border border-dashed p-2.5 text-sm transition hover:border-green-300 hover:bg-green-50/40"
                key={key}
              >
                <b className="block">{label}</b>
                {previews[key] ? (
                  <span className="mt-2 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      alt={`${label} đã chọn`}
                      className="aspect-[5/3] w-full object-contain"
                      src={previews[key]}
                    />
                  </span>
                ) : (
                  <span className="mt-2 flex aspect-[5/3] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-medium text-slate-500">
                    Nhấn để chọn ảnh
                  </span>
                )}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  required
                  type="file"
                  onChange={(event) =>
                    handleFileChange(key, event.target.files?.[0])
                  }
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            * JPG, PNG hoặc WEBP · tối đa 10MB
          </p>

          <label className="mt-2.5 flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm leading-5 text-slate-600">
            <input
              className="size-5 rounded border-slate-300 text-[#32A452] focus:ring-[#32A452]"
              checked={hasAcceptedCommitment}
              required
              type="checkbox"
              onChange={(event) =>
                setHasAcceptedCommitment(event.target.checked)
              }
            />
            <span>
              Tôi cam đoan thông tin cung cấp là chính xác, trung thực và chịu
              trách nhiệm trước pháp luật nếu có sai sót.
            </span>
          </label>

          {error ? (
            <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex justify-end gap-3">
            <button
              className="rounded-xl border px-5 py-2 text-sm font-semibold"
              type="button"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className="flex items-center gap-2 rounded-xl bg-[#32A452] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {saving ? "Đang gửi..." : "Gửi hồ sơ"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
