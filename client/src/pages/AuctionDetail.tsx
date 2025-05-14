import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import BidList from "@/components/auctions/BidList";
import BidForm from "@/components/auctions/BidForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const AuctionDetail = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const auctionId = parseInt(id);

  // Fetch auction details
  const { data: auction, isLoading } = useQuery({
    queryKey: [`/api/auctions/${auctionId}`],
  });

  // Update auction status mutation
  const updateAuctionStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await apiRequest('PATCH', `/api/auctions/${auctionId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      toast({
        title: "Статус обновлен",
        description: "Статус аукциона успешно обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус аукциона",
        variant: "destructive",
      });
    },
  });

  const handleActivate = () => {
    updateAuctionStatus.mutate({ status: "active" });
  };

  const handleClose = () => {
    updateAuctionStatus.mutate({ status: "closed" });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy", { locale: ru });
  };

  // Status badge color
  const getStatusColor = (status: string, type: string) => {
    if (status === "active") {
      return type === "urgent" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800";
    } else if (status === "completed") {
      return "bg-blue-100 text-blue-800";
    } else if (status === "closed") {
      return "bg-gray-100 text-gray-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string, type: string) => {
    if (status === "active") {
      return type === "urgent" ? "Срочный" : "Активен";
    } else if (status === "completed") {
      return "Завершен";
    } else if (status === "closed") {
      return "Закрыт";
    } else if (status === "draft") {
      return "Черновик";
    }
    return status;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="ml-2">Загрузка аукциона...</p>
        </div>
      </Layout>
    );
  }

  if (!auction) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Аукцион не найден</h2>
          <p className="mt-2 text-gray-500">Аукцион с ID {id} не существует или был удален</p>
          <Button className="mt-4" onClick={() => navigate("/auctions")}>
            Вернуться к списку аукционов
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={() => navigate("/auctions")}
            >
              <span className="material-icons text-sm mr-1">arrow_back</span>
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{auction.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Код аукциона: {auction.auctionCode}
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            {user && (user.role === "admin" || user.role === "manager") && (
              <>
                {auction.status === "draft" && (
                  <Button onClick={handleActivate} disabled={updateAuctionStatus.isPending}>
                    Активировать
                  </Button>
                )}
                {auction.status === "active" && (
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    disabled={updateAuctionStatus.isPending}
                  >
                    Закрыть аукцион
                  </Button>
                )}
              </>
            )}
            <Badge className={getStatusColor(auction.status, auction.auctionType)}>
              {getStatusText(auction.status, auction.auctionType)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация об аукционе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Сроки проведения</h3>
                  <p className="mt-1">
                    {formatDate(auction.startDate)} — {formatDate(auction.endDate)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Тип аукциона</h3>
                  <p className="mt-1 capitalize">
                    {auction.auctionType === "standard"
                      ? "Стандартный"
                      : auction.auctionType === "urgent"
                      ? "Срочный"
                      : auction.auctionType === "limited"
                      ? "С ограниченным доступом"
                      : auction.auctionType}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Создан</h3>
                  <p className="mt-1">{formatDate(auction.createdAt)}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Описание</h3>
                  <p className="mt-1 text-sm whitespace-pre-line">{auction.description}</p>
                </div>
                {auction.specifications && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Спецификация</h3>
                    <a
                      href={auction.specifications}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary-600 hover:text-primary-500"
                    >
                      Открыть спецификацию
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="items">
            <TabsList className="mb-4">
              <TabsTrigger value="items">Товары</TabsTrigger>
              <TabsTrigger value="bids">Предложения</TabsTrigger>
              {user?.role === "supplier" && auction.status === "active" && (
                <TabsTrigger value="submit-bid">Подать предложение</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Список товаров</CardTitle>
                </CardHeader>
                <CardContent>
                  {auction.items && auction.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Артикул
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Название
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Количество
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ед. изм.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ожидаемая цена
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {auction.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.partNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.unitOfMeasure}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.estimatedPrice
                                  ? `₽${item.estimatedPrice.toLocaleString()}`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Нет товаров для этого аукциона
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bids">
              <BidList
                bids={auction.bids || []}
                auctionStatus={auction.status}
                onBidUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
                }}
              />
            </TabsContent>

            {user?.role === "supplier" && auction.status === "active" && (
              <TabsContent value="submit-bid">
                <BidForm 
                  auctionId={auctionId} 
                  auctionItems={auction.items || []} 
                  onBidSubmitted={() => {
                    queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AuctionDetail;
