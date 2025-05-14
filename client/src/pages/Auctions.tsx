import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useUser } from "@/lib/auth";
import Layout from "@/components/layout/Layout";
import AuctionCard from "@/components/dashboard/AuctionCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const Auctions = () => {
  const { data: user } = useUser();
  const [location, navigate] = useLocation();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch auctions
  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ["/api/auctions"],
  });

  // Filter auctions based on status and search query
  const filteredAuctions = auctions.filter((auction: any) => {
    // Filter by status
    if (filter === "active" && auction.status !== "active") return false;
    if (filter === "completed" && auction.status !== "completed") return false;
    if (filter === "draft" && auction.status !== "draft") return false;
    if (filter === "urgent" && auction.auctionType !== "urgent") return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        auction.title.toLowerCase().includes(query) ||
        auction.auctionCode.toLowerCase().includes(query) ||
        (auction.description && auction.description.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getBidCountForAuction = (auction: any) => {
    // In a real implementation, this would use actual bid count from the API
    return auction.bidCount || 0;
  };

  const getBestPriceForAuction = (auction: any) => {
    // In a real implementation, this would use actual price from the API
    return auction.bestPrice || null;
  };

  const getAuctionProgress = (auction: any) => {
    // In a real implementation, this would calculate actual progress
    if (auction.auctionType === "urgent") return 33;
    if (auction.auctionType === "limited") return 67;
    return 80;
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Аукционы</h1>
            <p className="mt-1 text-sm text-gray-500">
              Управление аукционами по закупкам запчастей
            </p>
          </div>
          {(user?.role === "manager" || user?.role === "admin") && (
            <Button className="mt-4 md:mt-0" asChild>
              <Link href="/auctions/create">
                <span className="material-icons text-sm mr-1">add</span>
                Новый аукцион
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters and search */}
      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-64">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все аукционы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="urgent">Срочные</SelectItem>
              <SelectItem value="completed">Завершенные</SelectItem>
              <SelectItem value="draft">Черновики</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
            </div>
            <Input
              type="text"
              className="pl-10"
              placeholder="Поиск по названию или коду аукциона"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Auctions grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-gray-500">Загрузка аукционов...</p>
          </div>
        ) : filteredAuctions.length > 0 ? (
          filteredAuctions.map((auction: any) => (
            <AuctionCard
              key={auction.id}
              id={auction.id}
              title={auction.title}
              auctionCode={auction.auctionCode}
              status={
                auction.status === "active"
                  ? auction.auctionType === "urgent"
                    ? "urgent"
                    : "active"
                  : auction.status
              }
              endDate={auction.endDate}
              bidCount={getBidCountForAuction(auction)}
              bestPrice={getBestPriceForAuction(auction)}
              progress={getAuctionProgress(auction)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Нет аукционов, соответствующих заданным критериям</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Auctions;
