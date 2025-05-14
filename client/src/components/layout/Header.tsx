import { useUser, useLogout } from "@/lib/auth";
import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { data: user } = useUser();
  const logout = useLogout();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout.mutate(
      {},
      {
        onSuccess: () => {
          toast({
            title: "Выход выполнен",
            description: "Вы успешно вышли из системы",
          });
        },
        onError: () => {
          toast({
            title: "Ошибка выхода",
            description: "Не удалось выйти из системы",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic here
    toast({
      title: "Поиск",
      description: `Поиск: ${searchQuery}`,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/dashboard">
              <a className="flex-shrink-0 flex items-center cursor-pointer">
                <span className="text-primary-700 font-bold text-xl">АВТОДОМ</span>
                <span className="ml-2 text-gray-500 text-sm">Площадка закупок</span>
              </a>
            </Link>
          </div>

          {/* Search bar - desktop only */}
          <div className="hidden md:block flex-1 max-w-md ml-6">
            <form onSubmit={handleSearch}>
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
                  className="block w-full pl-10 pr-3 py-2"
                  placeholder="Поиск по артикулу или названию"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                type="button"
                className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>

            <div className="ml-3 relative">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center focus:outline-none">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 bg-primary-100 text-primary-700">
                      <AvatarFallback>
                        {user ? getInitials(user.fullName) : "ГП"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-2 hidden md:block">
                      <div className="text-sm font-medium text-gray-700">
                        {user?.fullName || "Гость Пользователь"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.role === "manager"
                          ? "Менеджер по закупкам"
                          : user?.role === "supplier"
                          ? "Поставщик"
                          : user?.role === "admin"
                          ? "Администратор"
                          : ""}
                      </div>
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="cursor-pointer w-full">Профиль</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <a className="cursor-pointer w-full">Настройки</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
