import Layout from "@/components/layout/Layout";
import AuctionForm from "@/components/auctions/AuctionForm";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CreateAuction = () => {
  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href="/auctions">
              <span className="material-icons text-sm mr-1">arrow_back</span>
              Назад к аукционам
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Создание нового аукциона</h1>
        </div>
        <p className="text-sm text-gray-500">
          Заполните форму для создания нового аукциона по закупке запчастей
        </p>
      </div>

      <AuctionForm />
    </Layout>
  );
};

export default CreateAuction;
