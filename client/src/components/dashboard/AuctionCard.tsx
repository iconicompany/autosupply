import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

interface AuctionCardProps {
  id: number;
  title: string;
  auctionCode: string;
  status: "active" | "urgent" | "completed" | "draft";
  endDate: string;
  bidCount: number;
  bestPrice?: number;
  progress: number;
}

const AuctionCard = ({
  id,
  title,
  auctionCode,
  status,
  endDate,
  bidCount,
  bestPrice,
  progress,
}: AuctionCardProps) => {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    urgent: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    draft: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    active: "Активен",
    urgent: "Срочный",
    completed: "Завершен",
    draft: "Черновик",
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Нет предложений";
    return `₽${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <Card className="auction-card overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex justify-between mb-2">
          <div>
            <span className={`inline-flex items-center rounded-full ${statusColors[status]} px-3 py-0.5 text-xs font-medium`}>
              {statusLabels[status]}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            До: <span className={`font-medium ${status === 'urgent' ? 'text-yellow-600' : ''}`}>{formatDate(endDate)}</span>
          </div>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        <div className="mt-2 flex flex-col space-y-2">
          <div className="text-sm text-gray-500">
            <span className="font-medium">ID потока:</span> {auctionCode}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Кол-во предложений:</span> {bidCount}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Лучшая цена:</span>{" "}
            <span className="text-green-600 font-medium">
              {formatPrice(bestPrice)}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-primary-600">
                  Прогресс сбора предложений
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-primary-600">
                  {progress}%
                </span>
              </div>
            </div>
            <Progress className="h-2" value={progress} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href={`/auctions/${id}`}>
              <a>Детали</a>
            </Link>
          </Button>
          <Button
            className="flex-1"
            asChild
          >
            <Link href={`/auctions/${id}/bids`}>
              <a>Предложения</a>
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AuctionCard;
