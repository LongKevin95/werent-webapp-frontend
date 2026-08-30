import { useEffect, useRef, useState } from "react";
import { Info, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { submitAccountKyc } from "../lib/auth-client";
import {
  getVietnamPhoneValidationError,
  normalizeVietnamPhone,
} from "../lib/phone";

const allowedKycImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const KYC_ERROR_AUTO_DISMISS_MS = 5000;

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

const missingFileMessages = {
  identityFront: "Vui lòng tải ảnh CCCD mặt trước.",
  identityBack: "Vui lòng tải ảnh CCCD mặt sau.",
  selfie: "Vui lòng tải ảnh selfie.",
};

const invalidFileMessages = {
  identityFront: "Ảnh CCCD mặt trước phải là JPG, PNG hoặc WEBP.",
  identityBack: "Ảnh CCCD mặt sau phải là JPG, PNG hoặc WEBP.",
  selfie: "Ảnh selfie phải là JPG, PNG hoặc WEBP.",
};

function validateRequiredDate(value, emptyMessage, futureMessage) {
  if (!value) {
    return emptyMessage;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return emptyMessage;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return futureMessage;
  }

  return "";
}

function getIdentityNumberValidationError(identityNumber) {
  const value = String(identityNumber ?? "").trim();

  if (!value) {
    return "Vui lòng nhập số CCCD.";
  }

  if (!/^\d+$/.test(value)) {
    return "Số CCCD chỉ được gồm chữ số.";
  }

  if (value.length !== 12) {
    return "Số CCCD phải gồm 12 chữ số.";
  }

  return "";
}

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
  const [errorField, setErrorField] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasProfilePhone = Boolean(user.phone);
  const inputClass =
    "mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-green-500";
  const inputErrorClass =
    "!border-[#DC2626] bg-[#FFF7F7] ring-2 ring-[#DC2626]/15 focus:!border-[#DC2626] focus:ring-[#DC2626]/20";

  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) =>
        URL.revokeObjectURL(url),
      );
    },
    [],
  );

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const resetTimer = window.setTimeout(() => setIsErrorVisible(false), 0);
    const showTimer = window.setTimeout(() => setIsErrorVisible(true), 40);
    const hideTimer = window.setTimeout(() => setIsErrorVisible(false), 4700);
    const closeTimer = window.setTimeout(() => {
      setError("");
    }, KYC_ERROR_AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(closeTimer);
    };
  }, [error]);

  function showError(message, field = "") {
    setErrorField(field);
    setError(message);
  }

  function handleFileChange(key, file) {
    if (!file) {
      return;
    }

    if (!allowedKycImageTypes.has(file.type)) {
      showError(invalidFileMessages[key], key);
      return;
    }

    setError("");
    setErrorField((current) => (current === key ? "" : current));

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
    setErrorField("");

    if (!values.fullName.trim()) {
      showError("Vui lòng nhập họ và tên.", "fullName");
      return;
    }

    const dateOfBirthError = validateRequiredDate(
      values.dateOfBirth,
      "Vui lòng chọn ngày sinh.",
      "Ngày sinh không được ở tương lai.",
    );

    if (dateOfBirthError) {
      showError(dateOfBirthError, "dateOfBirth");
      return;
    }

    if (!values.email.trim()) {
      showError("Vui lòng cung cấp email.", "email");
      return;
    }

    const phoneError = getVietnamPhoneValidationError(values.phone);

    if (phoneError) {
      showError(phoneError, "phone");
      return;
    }

    const identityNumberError = getIdentityNumberValidationError(
      values.identityNumber,
    );

    if (identityNumberError) {
      showError(identityNumberError, "identityNumber");
      return;
    }

    const identityIssuedAtError = validateRequiredDate(
      values.identityIssuedAt,
      "Vui lòng chọn ngày cấp CCCD.",
      "Ngày cấp CCCD không được ở tương lai.",
    );

    if (identityIssuedAtError) {
      showError(identityIssuedAtError, "identityIssuedAt");
      return;
    }

    for (const [key] of kycFileFields) {
      if (!files[key]) {
        showError(missingFileMessages[key], key);
        return;
      }

      if (!allowedKycImageTypes.has(files[key].type)) {
        showError(invalidFileMessages[key], key);
        return;
      }
    }

    if (!hasAcceptedCommitment) {
      showError(
        "Vui lòng cam đoan thông tin đã cung cấp là chính xác.",
        "commitment",
      );
      return;
    }

    if (!files.identityFront || !files.identityBack || !files.selfie) {
      showError(
        "Vui lòng tải đủ CCCD mặt trước, mặt sau và ảnh selfie.",
        "identityFront",
      );
      return;
    }

    if (!hasAcceptedCommitment) {
      showError(
        "Vui lòng cam đoan thông tin đã cung cấp là chính xác.",
        "commitment",
      );
      return;
    }

    const normalizedPhone = normalizeVietnamPhone(values.phone);

    if (!normalizedPhone) {
      showError("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.", "phone");
      return;
    }

    setSaving(true);

    try {
      const response = await submitAccountKyc(
        accessToken,
        { ...values, phone: normalizedPhone },
        files,
      );
      onSuccess(response.message);
    } catch (submitError) {
      showError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[2px]">
      {error ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
          <div
            aria-live="polite"
            className={`flex max-w-[720px] items-center gap-3 rounded-2xl border border-[#F0CACA] bg-[#FFF7F7] px-5 py-3 text-sm font-semibold text-[#B73A3A] shadow-[0_18px_45px_rgba(160,60,60,0.16)] transition duration-300 ease-out ${
              isErrorVisible
                ? "translate-y-0 opacity-100"
                : "-translate-y-3 opacity-0"
            }`}
            role="alert"
          >
            <Info className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}
      <form
        className="max-h-[calc(100dvh-32px)] w-full max-w-3xl overflow-hidden rounded-[18px] bg-white p-4 shadow-[0_30px_90px_rgba(10,24,15,0.28)]"
        noValidate
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
              const isLockedContactField =
                key === "email" || (key === "phone" && hasProfilePhone);
              const hasFieldError = errorField === key;

              return (
                <label className="text-sm" key={key}>
                  {label}
                  <input
                    className={
                      isLockedContactField
                        ? `${inputClass} cursor-not-allowed bg-slate-50 text-slate-500 ${hasFieldError ? inputErrorClass : ""}`
                        : `${inputClass} ${hasFieldError ? inputErrorClass : ""}`
                    }
                    disabled={isLockedContactField}
                    inputMode={key === "phone" ? "tel" : undefined}
                    placeholder={
                      key === "phone" && !hasProfilePhone
                        ? "Ví dụ: 0900000000"
                        : undefined
                    }
                    required={required}
                    type={type}
                    value={values[key]}
                    aria-invalid={hasFieldError}
                    onChange={(event) => {
                      if (errorField === key) {
                        setError("");
                        setErrorField("");
                      }

                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }));
                    }}
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-4 grid gap-x-5 gap-y-3 md:grid-cols-3">
            {kycFileFields.map(([key, label]) => (
              <label
                  className={`cursor-pointer rounded-2xl border border-dashed p-2.5 text-sm transition ${
                    errorField === key
                      ? "!border-[#DC2626] bg-[#FFF7F7] ring-2 ring-[#DC2626]/15"
                      : "hover:border-green-300 hover:bg-green-50/40"
                  }`}
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

          <label
            className={`mt-2.5 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm leading-5 text-slate-600 ${
              errorField === "commitment"
                ? "!border-[#DC2626] bg-[#FFF7F7] ring-2 ring-[#DC2626]/15"
                : "border-transparent bg-slate-50"
            }`}
          >
            <input
              className="size-5 rounded border-slate-300 text-[#32A452] focus:ring-[#32A452]"
              checked={hasAcceptedCommitment}
              required
              type="checkbox"
              onChange={(event) => {
                if (errorField === "commitment") {
                  setError("");
                  setErrorField("");
                }

                setHasAcceptedCommitment(event.target.checked);
              }}
            />
            <span>
              Tôi cam đoan thông tin cung cấp là chính xác, trung thực và chịu
              trách nhiệm trước pháp luật nếu có sai sót.
            </span>
          </label>

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
