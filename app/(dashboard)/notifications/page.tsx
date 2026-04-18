import { getNotifications, markAllNotificationsRead, markNotificationAsRead, deleteNotification } from "@/modules/notifications/actions";
import { NotificationsClient } from "./NotificationsClient";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="p-8 space-y-10 max-w-5xl mx-auto h-full overflow-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
              Intelligence <span className="text-primary">Desk</span>
            </h2>
            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-0.5">
              Operational alerts and system notifications
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
