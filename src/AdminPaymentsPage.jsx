import { useEffect, useMemo, useState } from "react";
import {
  CircleCheck,
  Clock3,
  CreditCard,
  LoaderCircle,
  Plus,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  createAdminBalanceAdjustment,
  createAdminDemoTopUp,
  createAdminPromotion,
  getAdminDemoTopUpQuote,
  getAdminPromotions,
  getAdminTransactions,
  getAdminUsers,
} from "./lib/admin-client";

const money = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
const nullableMoney = (value) => (value == null ? "-" : money(value));
const statusLabels = {
  paid: "Thành công",
  pending: "Đang chờ",
  failed: "Thất bại",
  canceled: "Đã hủy",
};
const typeLabels = {
  topup: "Nạp tiền",
  package_payment: "Thanh toán gói",
  promotion_bonus: "Thưởng khuyến mãi",
  admin_adjustment: "Điều chỉnh số dư",
  refund: "Hoàn tiền",
};

function getUserId(user) {
  return user?._id ?? user?.id;
}

function getUserTotalBalance(user) {
  return Number(user?.walletBalance ?? 0) + Number(user?.walletPromotionBalance ?? 0);
}

function getTransactionTypeLabel(item) {
  if (item?.provider === "admin_demo" || item?.packageCode === "ADMIN_DEMO_TOPUP") {
    return "Admin nạp tiền demo";
  }

  return typeLabels[item?.transactionType] ?? item?.transactionType ?? "-";
}

function AdjustmentModal({ accessToken, transaction, onClose, onSuccess }) {
  const user = transaction?.user;
  const [form, setForm] = useState({ direction: "credit", amount: "", reason: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await createAdminBalanceAdjustment(accessToken, {
        ...form,
        amount: Number(form.amount),
        userId: getUserId(user),
      });
      onSuccess(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <h3 className="text-lg font-bold">Điều chỉnh số dư</h3>
        <p className="mt-1 text-sm text-slate-500">
          {user?.fullName} · Số dư hiện tại {money(getUserTotalBalance(user))}
        </p>
        <div className="mt-5 grid gap-4">
          <label className="text-sm">
            Loại điều chỉnh
            <select
              className="mt-1 h-11 w-full rounded-xl border px-3"
              value={form.direction}
              onChange={(event) => setForm({ ...form, direction: event.target.value })}
            >
              <option value="credit">Cộng tiền</option>
              <option value="debit">Trừ tiền</option>
            </select>
          </label>
          <label className="text-sm">
            Số tiền
            <input
              className="mt-1 h-11 w-full rounded-xl border px-3"
              min="1"
              required
              type="number"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
          <label className="text-sm">
            Lý do bắt buộc
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border p-3"
              minLength={5}
              required
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border px-4 py-2" type="button" onClick={onClose}>
            Hủy
          </button>
          <button
            className="rounded-xl bg-[#159848] px-4 py-2 font-semibold text-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DemoTopUpModal({ accessToken, transaction, onClose, onSuccess }) {
  const user = transaction?.user;
  const [form, setForm] = useState({
    email: user?.email ?? "",
    amount: "",
    note: "",
  });
  const [lookup, setLookup] = useState({
    email: user?.email?.toLowerCase() ?? "",
    status: user?.email ? "found" : "idle",
    user: user ?? null,
  });
  const [quoteLookup, setQuoteLookup] = useState({
    email: "",
    amount: 0,
    status: "idle",
    quote: null,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const amount = Number(form.amount || 0);
  const normalizedEmail = form.email.trim().toLowerCase();
  const selectedEmail = user?.email?.toLowerCase() ?? "";
  const targetUser =
    normalizedEmail && normalizedEmail === selectedEmail
      ? user
      : lookup.email === normalizedEmail
        ? lookup.user
        : null;
  const lookupStatus = !normalizedEmail
    ? "idle"
    : normalizedEmail === selectedEmail
      ? "found"
      : lookup.email === normalizedEmail
        ? lookup.status
        : "loading";
  const canLoadQuote = Boolean(
    normalizedEmail && amount >= 10000 && lookupStatus === "found",
  );
  const quoteMatches =
    quoteLookup.email === normalizedEmail && quoteLookup.amount === amount;
  const quoteStatus = !canLoadQuote
    ? "idle"
    : quoteMatches
      ? quoteLookup.status
      : "loading";
  const quote = quoteMatches ? quoteLookup.quote : null;
  const bonusAmount = Number(quote?.bonusAmount ?? 0);
  const totalCredit = Number(quote?.totalCredit ?? amount + bonusAmount);

  useEffect(() => {
    if (!normalizedEmail || normalizedEmail === selectedEmail) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      getAdminUsers(accessToken, { search: normalizedEmail, limit: 5 })
        .then((response) => {
          if (!active) return;
          const matchedUser = (response.data.items ?? []).find(
            (item) => item.email?.toLowerCase() === normalizedEmail,
          );
          setLookup({
            email: normalizedEmail,
            status: matchedUser ? "found" : "not_found",
            user: matchedUser ?? null,
          });
        })
        .catch(() => {
          if (!active) return;
          setLookup({ email: normalizedEmail, status: "error", user: null });
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [accessToken, normalizedEmail, selectedEmail]);

  useEffect(() => {
    if (!canLoadQuote) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      getAdminDemoTopUpQuote(accessToken, { email: normalizedEmail, amount })
        .then((response) => {
          if (!active) return;
          setQuoteLookup({
            email: normalizedEmail,
            amount,
            status: "found",
            quote: response.data.quote,
          });
        })
        .catch(() => {
          if (!active) return;
          setQuoteLookup({
            email: normalizedEmail,
            amount,
            status: "error",
            quote: null,
          });
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [accessToken, amount, canLoadQuote, normalizedEmail]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await createAdminDemoTopUp(accessToken, {
        email: form.email,
        amount,
        note: form.note,
      });
      onSuccess(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <h3 className="text-lg font-bold">Nạp tiền demo</h3>
        <p className="mt-1 text-sm text-slate-500">
          Nhập email tài khoản cần nạp tiền demo.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Email tài khoản
            <input
              className="mt-1 h-11 w-full rounded-xl border px-3"
              placeholder="user@example.com"
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            {lookupStatus === "loading" ? (
              <span className="mt-1 block text-xs text-slate-500">Đang kiểm tra tài khoản...</span>
            ) : null}
            {lookupStatus === "not_found" ? (
              <span className="mt-1 block text-xs text-red-600">Không tìm thấy tài khoản với email này.</span>
            ) : null}
            {lookupStatus === "error" ? (
              <span className="mt-1 block text-xs text-red-600">Không thể kiểm tra tài khoản lúc này.</span>
            ) : null}
          </label>
          {targetUser ? (
            <dl className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm sm:col-span-2">
              {[
                [
                  "Số dư tổng cộng:",
                  Number(targetUser.walletBalance ?? 0) +
                    Number(targetUser.walletPromotionBalance ?? 0),
                ],
                ["Số dư được nạp:", targetUser.walletBalance],
                ["Số dư khuyến mãi:", targetUser.walletPromotionBalance],
              ].map(([label, value]) => (
                <div className="flex items-center justify-between gap-3" key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-bold text-[#159848]">{money(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <label className="text-sm sm:col-span-2">
            Tiền nạp
            <input
              className="mt-1 h-11 w-full rounded-xl border px-3"
              min="10000"
              required
              type="number"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
          <div className="rounded-xl bg-emerald-50 p-3 text-sm sm:col-span-2">
            {quoteStatus === "loading" ? (
              <p className="text-slate-600">Đang tính khuyến mãi hiện tại...</p>
            ) : null}
            {quoteStatus === "error" ? (
              <p className="text-red-600">Không thể tính khuyến mãi lúc này.</p>
            ) : null}
            {quoteStatus === "idle" ? (
              <p className="text-slate-600">
                Nhập email và số tiền nạp để xem chương trình khuyến mãi hiện tại.
              </p>
            ) : null}
            {quoteStatus === "found" ? (
              <dl className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-600">Chương trình khuyến mãi hiện tại:</dt>
                  <dd className="text-right font-bold text-[#159848]">
                    {quote?.promotion
                      ? `${quote.promotion.name} (${quote.promotion.bonusPercent}%)`
                      : "Không có"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-600">Tiền khuyến mãi được cộng:</dt>
                  <dd className="font-bold text-[#159848]">{money(bonusAmount)}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          <label className="text-sm sm:col-span-2">
            Ghi chú
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border p-3"
              placeholder="Ví dụ: Nạp tiền để demo chức năng đăng tin trừ tiền, ABC..."
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </label>
        </div>
        <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          Tổng cộng cộng vào ví: <span className="font-bold">{money(totalCredit)}</span>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border px-4 py-2" type="button" onClick={onClose}>
            Hủy
          </button>
          <button
            className="rounded-xl bg-[#159848] px-4 py-2 font-semibold text-white disabled:opacity-60"
            disabled={
              saving ||
              lookupStatus === "loading" ||
              lookupStatus === "not_found" ||
              quoteStatus === "loading" ||
              quoteStatus === "error"
            }
          >
            {saving ? "Đang nạp..." : "Nạp tiền demo"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Promotions({ accessToken }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    bonusPercent: "10",
    minimumAmount: "0",
    maximumBonus: "",
    perUserLimit: "1",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });

  useEffect(() => {
    let active = true;
    getAdminPromotions(accessToken)
      .then((response) => {
        if (active) setItems(response.data.items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [accessToken]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await createAdminPromotion(accessToken, {
        ...form,
        bonusPercent: Number(form.bonusPercent),
        minimumAmount: Number(form.minimumAmount),
        maximumBonus: form.maximumBonus ? Number(form.maximumBonus) : null,
        perUserLimit: Number(form.perUserLimit),
      });
      setOpen(false);
      const response = await getAdminPromotions(accessToken);
      setItems(response.data.items);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const fields = [
    ["name", "Tên chương trình", "text"],
    ["code", "Mã", "text"],
    ["bonusPercent", "% thưởng", "number"],
    ["minimumAmount", "Nạp tối thiểu", "number"],
    ["maximumBonus", "Bonus tối đa", "number"],
    ["perUserLimit", "Số lần/user", "number"],
    ["startsAt", "Bắt đầu", "datetime-local"],
    ["endsAt", "Kết thúc", "datetime-local"],
  ];

  return (
    <section className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Chương trình khuyến mãi nạp tiền</h2>
          <p className="mt-1 text-xs text-slate-500">
            Quản lý % thưởng, mức nạp tối thiểu, bonus tối đa và giới hạn mỗi user.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-[#159848] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setOpen(!open)}
        >
          <Plus className="size-4" />
          Tạo khuyến mãi
        </button>
      </div>
      {open ? (
        <form className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-3" onSubmit={submit}>
          {fields.map(([key, label, type]) => (
            <label className="text-xs" key={key}>
              {label}
              <input
                className="mt-1 h-10 w-full rounded-lg border bg-white px-3"
                required={key !== "maximumBonus"}
                type={type}
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </label>
          ))}
          <div className="flex items-end">
            <button className="h-10 rounded-lg bg-[#159848] px-5 text-sm font-semibold text-white">
              Lưu
            </button>
          </div>
        </form>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3">Chương trình</th>
              <th>% thưởng</th>
              <th>Nạp tối thiểu</th>
              <th>Bonus tối đa</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((promotion) => (
              <tr className="border-t" key={promotion._id}>
                <td className="p-3 font-semibold">
                  {promotion.name}
                  <span className="ml-2 rounded bg-violet-50 px-2 py-1 text-xs text-violet-700">
                    {promotion.code}
                  </span>
                </td>
                <td>{promotion.bonusPercent}%</td>
                <td>{money(promotion.minimumAmount)}</td>
                <td>{promotion.maximumBonus == null ? "Không giới hạn" : money(promotion.maximumBonus)}</td>
                <td>
                  {new Date(promotion.startsAt).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(promotion.endsAt).toLocaleDateString("vi-VN")}
                </td>
                <td>{promotion.isActive ? "Đang bật" : "Đã tắt"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminPaymentsPage({ accessToken }) {
  const [tab, setTab] = useState("transactions");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState({ search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [demoTopUpOpen, setDemoTopUpOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setLoading(true);
    });
    getAdminTransactions(
      accessToken,
      { search: query.search, status: query.status, scope: "topup", limit: 20 },
      { signal: controller.signal },
    )
      .then((response) => {
        setItems(response.data.items);
        setSummary(response.data.summary);
        setSelected((current) =>
          response.data.items.find((item) => item._id === current?._id) ??
          response.data.items[0] ??
          null,
        );
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [accessToken, query.search, query.status, refresh]);

  const cards = useMemo(
    () => [
      ["Tổng giao dịch", summary.total, CreditCard, "text-blue-600 bg-blue-50"],
      ["Thành công", summary.paid, CircleCheck, "text-green-600 bg-green-50"],
      ["Đang chờ", summary.pending, Clock3, "text-orange-600 bg-orange-50"],
      ["Thất bại", summary.failed, XCircle, "text-red-600 bg-red-50"],
      ["Tổng tiền nạp", money(summary.totalValue), WalletCards, "text-violet-600 bg-violet-50"],
    ],
    [summary],
  );

  function refreshTransactions() {
    setAdjusting(false);
    setDemoTopUpOpen(false);
    setRefresh((value) => value + 1);
  }

  if (tab === "promotions") {
    return (
      <div>
        <div className="mb-4 flex gap-2">
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setTab("transactions")}>
            Giao dịch
          </button>
          <button className="rounded-lg bg-[#159848] px-4 py-2 text-sm text-white">
            Khuyến mãi
          </button>
        </div>
        <Promotions accessToken={accessToken} />
      </div>
    );
  }

  return (
    <div>
      {adjusting ? (
        <AdjustmentModal
          accessToken={accessToken}
          transaction={selected}
          onClose={() => setAdjusting(false)}
          onSuccess={refreshTransactions}
        />
      ) : null}
      {demoTopUpOpen ? (
        <DemoTopUpModal
          accessToken={accessToken}
          transaction={selected}
          onClose={() => setDemoTopUpOpen(false)}
          onSuccess={refreshTransactions}
        />
      ) : null}
      <div className="mb-4 flex gap-2">
        <button className="rounded-lg bg-[#159848] px-4 py-2 text-sm text-white">Giao dịch</button>
        <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setTab("promotions")}>
          Khuyến mãi
        </button>
      </div>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, Icon, tone]) => (
          <article className="rounded-2xl border bg-white p-4" key={label}>
            <div className="flex items-center gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold">
                  {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="mt-4 grid overflow-hidden rounded-2xl border bg-white xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0">
          <div className="flex gap-3 border-b p-4">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <input
                className="h-10 w-full rounded-xl border pl-10 pr-3 text-sm"
                placeholder="Mã GD, người dùng, email..."
                value={query.search}
                onChange={(event) => setQuery({ ...query, search: event.target.value })}
              />
            </label>
            <select
              className="rounded-xl border px-3 text-sm"
              value={query.status}
              onChange={(event) => setQuery({ ...query, status: event.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="p-4 text-red-600">{error}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="p-3">Mã giao dịch</th>
                  <th>Người dùng</th>
                  <th>Loại</th>
                  <th>Số tiền</th>
                  <th>Khuyến mãi</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-10 text-center" colSpan="8">
                      <LoaderCircle className="mx-auto animate-spin" />
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      className={`cursor-pointer border-t hover:bg-green-50/40 ${
                        selected?._id === item._id ? "bg-green-50" : ""
                      }`}
                      key={item._id}
                      onClick={() => setSelected(item)}
                    >
                      <td className="p-3 font-semibold">{item.orderCode}</td>
                      <td>
                        {item.user?.fullName}
                        <p className="text-xs text-slate-400">{item.user?.email}</p>
                      </td>
                      <td>{getTransactionTypeLabel(item)}</td>
                      <td className={item.totalCredit < 0 ? "text-red-600" : "text-green-600"}>
                        {money(item.totalCredit || item.amount)}
                      </td>
                      <td>{item.bonusAmount ? `+${money(item.bonusAmount)}` : "-"}</td>
                      <td>{item.provider}</td>
                      <td>{statusLabels[item.status]}</td>
                      <td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="border-l p-5">
          {selected ? (
            <>
              <h3 className="text-lg font-bold">Chi tiết giao dịch</h3>
              <p className="mt-2 font-semibold text-[#159848]">{selected.orderCode}</p>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Trạng thái", statusLabels[selected.status]],
                  ["Loại giao dịch", getTransactionTypeLabel(selected)],
                  ["Người dùng", selected.user?.fullName],
                  ["SĐT", selected.user?.phone],
                  ["Email", selected.user?.email],
                  ["Số tiền", money(selected.baseAmount || selected.amount)],
                  ["Khuyến mãi", selected.promotionName || selected.promotion?.name || "-"],
                  ["Tiền thưởng", money(selected.bonusAmount)],
                  ["Tổng cộng", money(selected.totalCredit || selected.amount)],
                  ["Số dư trước", nullableMoney(selected.balanceBefore)],
                  ["Số dư sau", nullableMoney(selected.balanceAfter)],
                  ["Phương thức", selected.provider],
                  ["Gateway Ref", selected.providerTransactionId || "-"],
                  ["Webhook/IPN", selected.rawWebhookPayload ? "Đã xác nhận" : "Chưa xác nhận"],
                  [
                    "Thời gian xác nhận",
                    selected.confirmedAt ? new Date(selected.confirmedAt).toLocaleString("vi-VN") : "-",
                  ],
                  ["Người điều chỉnh", selected.adminActor?.fullName || "-"],
                  ["Lý do điều chỉnh", selected.adjustmentReason || "-"],
                ].map(([key, value]) => (
                  <div className="flex justify-between gap-3" key={key}>
                    <dt className="text-slate-500">{key}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <button
                className="mt-6 w-full rounded-xl bg-[#159848] py-3 font-semibold text-white"
                onClick={() => setAdjusting(true)}
              >
                Điều chỉnh số dư
              </button>
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#159848] bg-green-50 py-3 font-semibold text-[#159848]"
                onClick={() => setDemoTopUpOpen(true)}
              >
                <Plus className="size-4" />
                Nạp tiền demo
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Chọn một giao dịch để xem chi tiết.</p>
          )}
        </aside>
      </section>
    </div>
  );
}
