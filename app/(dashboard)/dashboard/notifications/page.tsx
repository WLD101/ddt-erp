import { getNotifications, markAllNotificationsRead, markNotificationAsRead, deleteNotification } from "@/modules/notifications/actions";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-10 max-w-5xl mx-auto flex-1 overflow-auto pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-soft">
            <span className="material-symbols-outlined text-primary text-[28px]">notifications_active</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
              Intelligence <span className="text-primary">Center</span>
            </h2>
            <p className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest mt-0.5">
              Operational alerts and system telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Client Section */}
      <NotificationsClient
        initialNotifications={notifications as any}
        markAsReadAction={markNotificationAsRead}
        markAllReadAction={markAllNotificationsRead}
        deleteAction={deleteNotification}
      />
    </div>
  );
}
