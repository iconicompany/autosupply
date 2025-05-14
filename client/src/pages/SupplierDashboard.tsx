import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/lib/auth";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const SupplierDashboard = () => {
  const { data: user } = useUser();
  
  // Fetch stats data
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch auctions this supplier is invited to
  const { data: auctions = [] } = useQuery({
    queryKey: ["/api/auctions"],
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy", { locale: ru });
  };

  // Active auctions count
  const activeAuctionsCount = auctions.filter((auction: any) => auction.status === "active").length;

  // Stats from backend or default values
  const pendingBids = stats?.pendingBids || 0;
  const acceptedBids = stats?.acceptedBids || 0;
  const rejectedBids = stats?.rejectedBids || 0;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Кабинет поставщика</h1>
        <p className="mt-1 text-sm text-gray-500">
          Добро пожаловать, {user?.fullName} ({user?.companyName})
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                <span className="material-icons text-primary-600">gavel</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Активные аукционы</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeAuctionsCount}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
                <span className="material-icons text-yellow-600">pending</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Предложения на рассмотрении</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingBids}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                <span className="material-icons text-green-600">check_circle</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Принятые предложения</dt>
                  <dd className="text-lg font-medium text-gray-900">{acceptedBids}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-red-100 p-3">
                <span className="material-icons text-red-600">cancel</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Отклоненные предложения</dt>
                  <dd className="text-lg font-medium text-gray-900">{rejectedBids}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active auctions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Активные аукционы</CardTitle>
        </CardHeader>
        <CardContent>
          {auctions.filter((a: any) => a.status === "active").length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Код
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Срок окончания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус предложения
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auctions
                    .filter((auction: any) => auction.status === "active")
                    .map((auction: any) => {
                      // Check if the supplier has already submitted a bid
                      const hasBid = auction.bids && auction.bids.length > 0;
                      const bidStatus = hasBid ? auction.bids[0].status : null;
                      
                      return (
                        <tr key={auction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {auction.auctionCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(auction.endDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Badge
                              className={
                                auction.auctionType === "urgent"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : auction.auctionType === "limited"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {auction.auctionType === "standard"
                                ? "Стандартный"
                                : auction.auctionType === "urgent"
                                ? "Срочный"
                                : "Ограниченный"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bidStatus ? (
                              <Badge
                                className={
                                  bidStatus === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : bidStatus === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {bidStatus === "accepted"
                                  ? "Принято"
                                  : bidStatus === "rejected"
                                  ? "Отклонено"
                                  : "На рассмотрении"}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Нет предложения</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button size="sm" asChild>
                              <Link href={`/auctions/${auction.id}`}>
                                {hasBid ? "Просмотр" : "Сделать предложение"}
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              В данный момент нет активных аукционов
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent bids */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">История предложений</CardTitle>
        </CardHeader>
        <CardContent>
          {auctions.some((a: any) => a.bids && a.bids.length > 0) ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Аукцион
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auctions
                    .filter((a: any) => a.bids && a.bids.length > 0)
                    .flatMap((auction: any) =>
                      auction.bids.map((bid: any) => ({
                        ...bid,
                        auctionTitle: auction.title,
                        auctionCode: auction.auctionCode,
                        auctionId: auction.id,
                      }))
                    )
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((bid: any) => (
                      <tr key={bid.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bid.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bid.auctionTitle} ({bid.auctionCode})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₽{bid.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Badge
                            className={
                              bid.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : bid.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {bid.status === "accepted"
                              ? "Принято"
                              : bid.status === "rejected"
                              ? "Отклонено"
                              : "На рассмотрении"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/auctions/${bid.auctionId}`}>
                              Просмотр
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              У вас еще нет истории предложений
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default SupplierDashboard;
