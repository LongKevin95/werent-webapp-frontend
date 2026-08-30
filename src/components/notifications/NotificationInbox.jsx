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
    <div className="flex size-11 shrink-0 items-center justify-center [&_.nv-inbox\\_\\_popoverTrigger]:!size-11 [&_.nv-inbox\\_\\_popoverTrigger]:!p-0 [&_.nv-inbox\\_\\_popoverTrigger]:!bg-transparent [&_.nv-inbox\\_\\_popoverTrigger:hover]:!bg-[#EEF1F4]">
      <Inbox
        appearance={{
          elements: {
            inbox__popoverTrigger:
              "!nt-size-11 !nt-p-0 !nt-bg-transparent hover:!nt-bg-neutral-alpha-100",
          },
        }}
        applicationIdentifier={import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER}
        subscriberId={subscriberId}
        renderBell={(unreadCount) => {
          const unreadTotal = getUnreadTotal(unreadCount);

          return (
            <button
              aria-label="Thông báo"
              className="relative flex size-11 items-center justify-center rounded-xl text-[#68717A] transition hover:bg-[#EEF1F4]"
              title="Thông báo"
              type="button"
            >
              <Bell className="size-4" />

              {unreadTotal > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                  {unreadTotal >= 10 ? "9+" : unreadTotal}
                </span>
              ) : null}
            </button>
          );
        }}
      />
    </div>
  );
}

export default NotificationInbox;
