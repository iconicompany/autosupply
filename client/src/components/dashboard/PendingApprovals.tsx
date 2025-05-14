import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApprovalItem from "@/components/dashboard/ApprovalItem";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const PendingApprovals = () => {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch auctions with pending bids
  const { data: auctions = [] } = useQuery({
    queryKey: ["/api/auctions"],
  });

  // Filter auctions with pending bids
  const auctionsWithPendingBids = auctions.filter((auction: any) => 
    auction.status === "active" && auction.bidCount > 0
  );

  // Handle approval actions
  const handleViewDetails = (auctionId: number) => {
    navigate(`/auctions/${auctionId}`);
  };

  const handleApprove = (item: any) => {
    // In a real implementation, this would make an API call
    toast({
      title: "Действие выполнено",
      description: `Вы выполнили действие для ${item.title || item.auctionCode}`,
    });
    navigate(`/auctions/${item.id}`);
  };

  // For suppliers, we show pending bids they've submitted
  const isSupplier = user?.role === "supplier";

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">
          {isSupplier ? "Мои предложения" : "Ожидают рассмотрения"}
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-white p-5">
        <ul className="divide-y divide-gray-200">
          {auctionsWithPendingBids.length > 0 ? (
            auctionsWithPendingBids.slice(0, 3).map((auction: any) => (
              <ApprovalItem
                key={auction.id}
                title={isSupplier ? `Аукцион: ${auction.title}` : `Предложения по аукциону ${auction.auctionCode}`}
                subtitle1={isSupplier ? "Статус" : "Аукцион"}
                subtitle1Value={isSupplier ? "На рассмотрении" : auction.auctionCode}
                subtitle2={isSupplier ? "Дата подачи" : "Количество предложений"}
                subtitle2Value={isSupplier ? new Date().toLocaleDateString() : `${auction.bidCount || 0}`}
                onDetails={() => handleViewDetails(auction.id)}
                onApprove={() => handleApprove(auction)}
                approveText={isSupplier ? "Открыть" : "Рассмотреть"}
              />
            ))
          ) : (
            <li className="py-3 text-center text-gray-500">
              {isSupplier ? "У вас нет активных предложений" : "Нет ожидающих предложений"}
            </li>
          )}
        </ul>
        <div className="mt-4 text-center">
          <Button variant="outline">
            {isSupplier ? "Показать все мои предложения" : "Показать все ожидающие"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingApprovals;
