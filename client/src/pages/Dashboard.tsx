import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/lib/auth";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/dashboard/StatCard";
import AuctionCard from "@/components/dashboard/AuctionCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import PendingApprovals from "@/components/dashboard/PendingApprovals";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const Dashboard = () => {
  const { data: user } = useUser();
  
  // Fetch stats data
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch active auctions
  const { data: auctions } = useQuery({
    queryKey: ["/api/auctions"],
  });
  
  // Get active auctions (first 3)
  const activeAuctions = auctions?.filter((auction: any) => auction.status === "active").slice(0, 3) || [];

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: ru });
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Панель управления</h1>
        <p className="mt-1 text-sm text-gray-500">
          Обзор текущей активности по закупкам запчастей
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          icon="gavel"
          iconColor="text-primary-600"
          bgColor="bg-primary-100"
          title="Активные аукционы"
          value={stats?.activeAuctions || 0}
          linkText="Перейти к аукционам"
          linkUrl="/auctions"
        />
        
        <StatCard
          icon="inventory"
          iconColor="text-green-600"
          bgColor="bg-green-100"
          title="Ожидают поставки"
          value={stats?.pendingBids || 0}
          linkText="Просмотреть все"
          linkUrl="/auctions"
        />
        
        <StatCard
          icon="schedule"
          iconColor="text-amber-600"
          bgColor="bg-amber-100"
          title="Завершаются сегодня"
          value={activeAuctions.filter((a: any) => 
            new Date(a.endDate).toDateString() === new Date().toDateString()
          ).length}
          linkText="Срочная обработка"
          linkUrl="/auctions"
        />
        
        <StatCard
          icon="savings"
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
          title="Экономия за месяц"
          value="₽420,000"
          linkText="Подробный отчет"
          linkUrl="/reports"
        />
      </div>

      {/* Active Auctions Section */}
      <div className="mb-8">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Активные аукционы</h2>
          {(user?.role === "manager" || user?.role === "admin") && (
            <Button asChild>
              <Link href="/auctions/create">
                <span className="material-icons text-sm mr-1">add</span>
                Новый аукцион
              </Link>
            </Button>
          )}
        </div>

        {/* Auction Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeAuctions.length > 0 ? (
            activeAuctions.map((auction: any) => (
              <AuctionCard
                key={auction.id}
                id={auction.id}
                title={auction.title}
                auctionCode={auction.auctionCode}
                status={auction.auctionType === "urgent" ? "urgent" : "active"}
                endDate={auction.endDate}
                bidCount={auction.bidCount || 0}
                bestPrice={auction.bestPrice}
                progress={auction.auctionType === "urgent" ? 33 : auction.auctionType === "limited" ? 67 : 80}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              Нет активных аукционов
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link href="/auctions">
              Показать все аукционы
              <span className="material-icons ml-1 text-sm">arrow_forward</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity and Pending Approvals */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentActivity />
        <PendingApprovals />
      </div>
    </Layout>
  );
};

export default Dashboard;
