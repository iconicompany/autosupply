import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ActivityItem from "@/components/dashboard/ActivityItem";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const RecentActivity = () => {
  // Fetch activity logs
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activity"],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `${format(date, "HH:mm")}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd MMM, HH:mm", { locale: ru });
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("Bid created") || action.includes("предложение")) {
      return { icon: "gavel", bg: "bg-primary-100", color: "text-primary-600" };
    } else if (action.includes("Auction created") || action.includes("аукцион")) {
      return { icon: "add_circle", bg: "bg-blue-100", color: "text-blue-600" };
    } else if (action.includes("accepted") || action.includes("completed") || action.includes("закрыт")) {
      return { icon: "check_circle", bg: "bg-green-100", color: "text-green-600" };
    } else if (action.includes("updated") || action.includes("обновление")) {
      return { icon: "update", bg: "bg-yellow-100", color: "text-yellow-600" };
    } else {
      return { icon: "info", bg: "bg-gray-100", color: "text-gray-600" };
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Последние действия</CardTitle>
      </CardHeader>
      <CardContent className="bg-white p-5">
        <ul className="divide-y divide-gray-200">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity: any) => {
              const { icon, bg, color } = getActivityIcon(activity.action);
              
              // Format activity description
              let description;
              if (activity.userId && activity.details) {
                description = `${activity.details} • ${formatDate(activity.createdAt)}`;
              } else {
                description = formatDate(activity.createdAt);
              }
              
              return (
                <ActivityItem
                  key={activity.id}
                  icon={icon}
                  iconBg={bg}
                  iconColor={color}
                  title={activity.action}
                  description={description}
                />
              );
            })
          ) : (
            <li className="py-3 text-center text-gray-500">Нет последних действий</li>
          )}
        </ul>
        <div className="mt-4 text-center">
          <Button variant="outline">
            Показать все действия
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
