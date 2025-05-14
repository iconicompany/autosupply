import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useUser } from "@/lib/auth";

interface BidItem {
  auctionItemId: number;
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
  name?: string;
  partNumber?: string;
}

interface Bid {
  id: number;
  auctionId: number;
  supplierId: number;
  totalAmount: number;
  deliveryDate: string;
  note: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  supplierName?: string;
  items?: BidItem[];
}

interface BidListProps {
  bids: Bid[];
  auctionStatus: string;
  onBidUpdated?: () => void;
}

const BidList = ({ bids, auctionStatus, onBidUpdated }: BidListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy", { locale: ru });
  };

  const formatCurrency = (amount: number) => {
    return `₽${amount.toLocaleString()}`;
  };

  const updateBidStatus = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/bids/${bidId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Статус обновлен",
        description: "Статус предложения успешно обновлен.",
      });
      if (onBidUpdated) {
        onBidUpdated();
      }
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус предложения.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptBid = (bidId: number) => {
    updateBidStatus.mutate({ bidId, status: "accepted" });
  };

  const handleRejectBid = (bidId: number) => {
    updateBidStatus.mutate({ bidId, status: "rejected" });
  };

  // Sort bids by total amount (cheapest first)
  const sortedBids = [...bids].sort((a, b) => a.totalAmount - b.totalAmount);

  return (
    <div className="space-y-6">
      {sortedBids.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Нет предложений для этого аукциона</p>
          </CardContent>
        </Card>
      ) : (
        sortedBids.map((bid) => (
          <Card key={bid.id} className={`
            ${bid.status === "accepted" ? "border-green-500" : ""}
            ${bid.status === "rejected" ? "border-red-300" : ""}
          `}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Предложение от {bid.supplierName}
                  {bid.status === "accepted" && (
                    <span className="ml-2 text-sm text-green-500 bg-green-50 px-2 py-1 rounded-full">
                      Выбрано
                    </span>
                  )}
                  {bid.status === "rejected" && (
                    <span className="ml-2 text-sm text-red-500 bg-red-50 px-2 py-1 rounded-full">
                      Отклонено
                    </span>
                  )}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {formatDate(bid.createdAt)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Детали предложения</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Общая сумма:</span>
                      <span className="font-medium">{formatCurrency(bid.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Дата поставки:</span>
                      <span className="font-medium">{formatDate(bid.deliveryDate)}</span>
                    </div>
                    {bid.note && (
                      <div className="pt-2">
                        <span className="text-sm text-gray-500">Примечание:</span>
                        <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{bid.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                {bid.items && bid.items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Позиции</h4>
                    <div className="divide-y">
                      {bid.items.map((item, index) => (
                        <div key={index} className="py-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.name || `Позиция ${index + 1}`}</span>
                            <span>{formatCurrency(item.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{item.partNumber || 'Без артикула'}</span>
                            <span>
                              {item.quantity} × {formatCurrency(item.pricePerUnit)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {user && (user.role === "admin" || user.role === "manager") && auctionStatus === "active" && bid.status === "pending" && (
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRejectBid(bid.id)}
                    disabled={updateBidStatus.isPending}
                  >
                    Отклонить
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleAcceptBid(bid.id)}
                    disabled={updateBidStatus.isPending}
                  >
                    Принять предложение
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default BidList;
