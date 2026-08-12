import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const DEFAULT_SEARCH_PLACEHOLDER = "Tìm theo địa chỉ, khu vực, trường học, ...";

const DEFAULT_USER_MENU_ITEMS = [
  { key: "profile", label: "Hồ sơ của tôi", icon: UserRound },
  { key: "accountSettings", label: "Cài đặt", icon: Settings },
  {
    key: "rentalAppointments",
    label: "Quản lý lịch hẹn",
    icon: CalendarDays,
  },
  { key: "wallet", label: "Ví tiền", icon: CircleDollarSign },
  { key: "favorites", label: "Tin đã lưu", icon: Heart },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "support", label: "Trung tâm trợ giúp", icon: HelpCircle },
];

function AppHeader({
  activeNav,
  currentUser,
  navItems = [],
  onLogin,
  onLogoClick,
  onLogout,
  onNavigate,
  onSignup,
  onUserClick,
  searchContent = null,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  showSearch = true,
  showNotification = Boolean(currentUser),
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const isAdmin = currentUser?.roles?.includes("admin");
  const accountStatus =
    currentUser?.isActive === false
      ? {
          badgeClassName: "border-[#F6D0D0] bg-[#FFF6F6] text-[#C44B4B]",
          label: "Tài khoản tạm khóa",
        }
      : {
          badgeClassName: "border-[#DCEFE0] bg-[#F3FBF5] text-[#269148]",
          label: "Tài khoản đang hoạt động",
        };

  const userMenuItems = [
    ...(isAdmin
      ? [
          {
            key: "adminDashboard",
            label: "Trang quản lý Admin",
            icon: ShieldCheck,
          },
        ]
      : []),
    ...DEFAULT_USER_MENU_ITEMS,
  ];
  const primaryNavItems = navItems.filter(
    (item) => !item.iconOnly && !item.actionGroup,
  );
  const actionNavItems = navItems.filter(
    (item) => item.iconOnly || item.actionGroup,
  );

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function handleMenuAction(key) {
    setIsMenuOpen(false);

    if (key === "profile") {
      onUserClick?.();
      return;
    }

    if (key === "logout") {
      onLogout?.();
      return;
    }

    onNavigate?.(key);
  }

  function renderActionButton(item) {
    const Icon = item.icon;
    const isActive = item.key === activeNav;

    if (!Icon) {
      return (
        <button
          key={item.key}
          className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${
            isActive
              ? "bg-[#35A554] text-white shadow-[0_10px_22px_rgba(53,165,84,0.24)]"
              : item.disabled
                ? "cursor-not-allowed border border-[#E7EBE7] text-[#B0B5BC]"
                : "cursor-pointer bg-[#35A554] text-white shadow-[0_10px_22px_rgba(53,165,84,0.24)] hover:bg-[#2F954B]"
          }`}
          disabled={item.disabled}
          type="button"
          onClick={() => onNavigate?.(item.key)}
        >
          {item.label}
        </button>
      );
    }

    return (
      <button
        key={item.key}
        aria-label={item.ariaLabel || item.label}
        className={`flex size-10 items-center justify-center rounded-full border transition ${
          isActive
            ? "border-[#CDE8D5] bg-[#F1FAF3] text-[#35A554]"
            : item.disabled
              ? "cursor-not-allowed border-[#E7EBE7] text-[#B0B5BC]"
              : "cursor-pointer border-[#E7EBE7] text-[#68717A] hover:border-[#D3E7D7] hover:bg-[#F5FAF6] hover:text-[#35A554]"
        }`}
        disabled={item.disabled}
        title={item.label}
        type="button"
        onClick={() => onNavigate?.(item.key)}
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <header className="relative z-50 rounded-[22px] border border-[#EEF1EB] bg-white/95 px-4 py-3 shadow-[0_10px_35px_rgba(53,75,61,0.08)] backdrop-blur sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <button
          className="shrink-0 flex items-center gap-3 text-left"
          type="button"
          onClick={onLogoClick}
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#3AA657]">
            <Home className="size-5" />
          </span>
          <span>
            <span className="block text-[22px] font-bold leading-none text-[#2FAD53]">
              WeRent
            </span>
            <span className="mt-1 block text-[11px] text-[#89909B]">
              Khai Thông Chốn Ở An Yên
            </span>
          </span>
        </button>

        {showSearch ? (
          <div className="min-w-0 flex-1 lg:max-w-[620px] xl:max-w-[700px]">
            {searchContent ? (
              searchContent
            ) : (
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9CA4AD]" />
                <input
                  className="h-11 w-full rounded-xl bg-[#F5F7F5] pl-11 pr-4 text-sm outline-none"
                  placeholder={searchPlaceholder}
                  type="search"
                />
              </div>
            )}
          </div>
        ) : null}

        <nav className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-[#404651] lg:flex-nowrap lg:justify-start lg:gap-4">
          {primaryNavItems.map((item) => {
            const isActive = item.key === activeNav;

            return (
              <button
                key={item.key}
                className={`whitespace-nowrap transition ${
                  isActive
                    ? "text-[#35A554]"
                    : item.disabled
                      ? "cursor-not-allowed text-[#B0B5BC]"
                      : "cursor-pointer text-[#404651] hover:text-[#35A554]"
                }`}
                disabled={item.disabled}
                type="button"
                onClick={() => onNavigate?.(item.key)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {currentUser ? (
          <div className="flex flex-wrap items-center justify-end gap-2 self-end lg:ml-auto lg:self-auto">
            {actionNavItems.length ? (
              <div className="flex items-center gap-2">
                {actionNavItems.map(renderActionButton)}
              </div>
            ) : null}

            {showNotification ? (
              <button
                aria-label="Thông báo"
                className="flex size-10 items-center justify-center rounded-full border border-[#E7EBE7] text-[#68717A] transition hover:border-[#D3E7D7] hover:bg-[#F5FAF6]"
                type="button"
                onClick={() => onNavigate?.("notifications")}
              >
                <Bell className="size-4" />
              </button>
            ) : null}

            <div className="relative z-[60]" ref={userMenuRef}>
              <button
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-2xl border border-[#E7EAE7] bg-[#F9FCF9] px-3 py-2 text-right transition hover:border-[#CFE8D4] hover:bg-[#F1F9F2]"
                title="Mở menu người dùng"
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
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
                <span className="max-w-[140px] text-left">
                  <span className="block text-sm font-semibold text-[#23313F]">
                    {currentUser.fullName}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 text-[#92A08F] transition ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[99] w-[340px] max-w-[calc(100vw-24px)]">
                  <span className="absolute right-8 top-0 size-4 -translate-y-1/2 rotate-45 rounded-[4px] border-l border-t border-[#EEF1EF] bg-white" />
                  <div className="overflow-hidden rounded-[24px] border border-[#EDF1EE] bg-white shadow-[0_24px_55px_rgba(49,72,58,0.16)]">
                    <div className="flex items-start gap-3 px-4 pb-4 pt-4">
                      {currentUser.avatarUrl ? (
                        <img
                          alt={`Ảnh đại diện của ${currentUser.fullName}`}
                          className="size-[64px] rounded-full object-cover"
                          src={currentUser.avatarUrl}
                        />
                      ) : (
                        <span className="flex size-[64px] items-center justify-center rounded-full bg-[#E6F4E8] text-[#32A452]">
                          <CircleUserRound className="size-7" />
                        </span>
                      )}

                      <div className="min-w-0 flex-1 pt-1">
                        <h3 className="truncate text-[22px] font-bold tracking-[-0.03em] leading-tight text-[#1E242C]">
                          {currentUser.fullName}
                        </h3>
                        <p className="mt-1 truncate text-[13px] text-[#69717C]">
                          {currentUser.email ||
                            currentUser.phone ||
                            "Chưa cập nhật liên hệ"}
                        </p>
                        <span
                          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${accountStatus.badgeClassName}`}
                        >
                          <ShieldCheck className="size-4" />
                          {accountStatus.label}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#EEF1EE] px-3 py-2.5">
                      {userMenuItems.map(({ icon: Icon, key, label }) => (
                        <button
                          key={key}
                          className="flex w-full items-center gap-3 rounded-[18px] px-2.5 py-2.5 text-left text-[14px] font-medium text-[#232A33] transition hover:bg-[#F6FAF7]"
                          type="button"
                          onClick={() => handleMenuAction(key)}
                        >
                          <span className="flex size-8 items-center justify-center rounded-full text-[#5B6572]">
                            <Icon className="size-4" />
                          </span>
                          <span className="flex-1">{label}</span>
                          <ChevronRight className="size-4 text-[#9098A2]" />
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-[#EEF1EE] px-3 py-3">
                      <button
                        className="flex w-full items-center gap-3 rounded-[18px] px-2.5 py-2.5 text-left text-[14px] font-semibold text-[#F04438] transition hover:bg-[#FFF5F5]"
                        type="button"
                        onClick={() => handleMenuAction("logout")}
                      >
                        <span className="flex size-8 items-center justify-center rounded-full text-[#F04438]">
                          <LogOut className="size-4" />
                        </span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 self-end lg:ml-auto lg:self-auto">
            <button
              className="cursor-pointer rounded-xl border border-[#E7EAE7] px-4 py-2.5 text-sm font-semibold text-[#2D313A]"
              type="button"
              onClick={onLogin}
            >
              Đăng nhập
            </button>
            <button
              className="cursor-pointer rounded-xl bg-[#35A554] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(53,165,84,0.24)]"
              type="button"
              onClick={onSignup}
            >
              Đăng ký
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
