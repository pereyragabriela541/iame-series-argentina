import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState } from "@/components/ui";
import type { Notification } from "@/lib/types";
import { formatDate, getNotifications } from "@/lib/queries";

export const metadata = { title: "Alertas | IAME Series Argentina" };

export default async function AlertasPage() {
  let notifications: Notification[] = [];
  let dbReady = true;
  try {
    notifications = await getNotifications();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Comunicados" title="Alertas" subtitle="Avisos oficiales del campeonato" />
      {notifications.length ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="border-l-4 border-iame-red bg-neutral-900/40 px-4 py-4">
              <p className="text-sm font-bold uppercase text-white">{n.title}</p>
              {n.body && <p className="mt-2 text-sm text-neutral-400">{n.body}</p>}
              <p className="mt-2 font-mono text-[10px] text-neutral-600">
                {formatDate(n.published_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Sin alertas publicadas." />
      )}
    </div>
  );
}
