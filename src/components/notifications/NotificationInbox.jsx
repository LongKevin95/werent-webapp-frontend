import { Inbox } from "@novu/react";
import { Bell } from "lucide-react";

function getUnreadTotal(unreadCount) {
  if (typeof unreadCount === "number") {
    return unreadCount;
  }

  return unreadCount?.total ?? 0;
}

function NotificationInbox({ subscriberId }) {
  if (!subscriberId) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER}
      subscriberId={subscriberId}
      renderBell={(unreadCount) => {
        const unreadTotal = getUnreadTotal(unreadCount);

        return (
          <button
            aria-label="Thông báo"
            className="relative flex size-10 items-center justify-center rounded-full border border-[#E7EBE7] text-[#68717A] transition hover:border-[#D3E7D7] hover:bg-[#F5FAF6]"
            type="button"
          >
            <Bell className="size-4" />

            {unreadTotal > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                {unreadTotal >= 10 ? "9+" : unreadTotal}
              </span>
            )}
          </button>
        );
      }}
    />
  );
}

export default NotificationInbox;
