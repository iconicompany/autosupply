import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Auctions from "@/pages/Auctions";
import AuctionDetail from "@/pages/AuctionDetail";
import CreateAuction from "@/pages/CreateAuction";
import Suppliers from "@/pages/Suppliers";
import SupplierDashboard from "@/pages/SupplierDashboard";
import { useUser, withAuth } from "./lib/auth";

// Apply auth protection to routes
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedAuctions = withAuth(Auctions);
const ProtectedAuctionDetail = withAuth(AuctionDetail);
const ProtectedCreateAuction = withAuth(CreateAuction, ["admin", "manager"]);
const ProtectedSuppliers = withAuth(Suppliers, ["admin", "manager"]);
const ProtectedSupplierDashboard = withAuth(SupplierDashboard, ["supplier"]);

function Router() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/auctions" component={ProtectedAuctions} />
      <Route path="/auctions/create" component={ProtectedCreateAuction} />
      <Route path="/auctions/:id" component={ProtectedAuctionDetail} />
      <Route path="/suppliers" component={ProtectedSuppliers} />
      <Route path="/supplier/dashboard" component={ProtectedSupplierDashboard} />
      
      {/* Redirect to dashboard or login based on auth status */}
      <Route path="/">
        {user ? <ProtectedDashboard /> : <Login />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
