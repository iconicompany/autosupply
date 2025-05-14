import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useUser } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  count?: number;
  role: string[];
}

const navItems: NavItem[] = [
  {
    label: "Панель управления",
    href: "/dashboard",
    icon: "dashboard",
    role: ["admin", "manager", "supplier"],
  },
  {
    label: "Аукционы",
    href: "/auctions",
    icon: "gavel",
    count: 12,
    role: ["admin", "manager", "supplier"],
  },
  {
    label: "Закупки",
    href: "/purchases",
    icon: "shopping_cart",
    role: ["admin", "manager"],
  },
  {
    label: "Потребности склада",
    href: "/inventory",
    icon: "inventory",
    role: ["admin", "manager"],
  },
  {
    label: "Поставщики",
    href: "/suppliers",
    icon: "business",
    role: ["admin", "manager"],
  },
  {
    label: "Отчеты",
    href: "/reports",
    icon: "assessment",
    role: ["admin", "manager"],
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Настройки",
    href: "/settings",
    icon: "settings",
    role: ["admin", "manager", "supplier"],
  },
  {
    label: "Помощь",
    href: "/help",
    icon: "help_outline",
    role: ["admin", "manager", "supplier"],
  },
];

const Sidebar = () => {
  const [location] = useLocation();
  const { data: user } = useUser();

  const filteredNavItems = navItems.filter(
    (item) => user && item.role.includes(user.role)
  );

  const filteredBottomNavItems = bottomNavItems.filter(
    (item) => user && item.role.includes(user.role)
  );

  return (
    <aside className="sidebar w-64 bg-white shadow-sm border-r border-gray-200 hidden md:block">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center p-2 pl-3 text-gray-900 rounded-lg group w-full",
                    location === item.href
                      ? "bg-primary-50 text-primary-600 border-l-3 border-primary-600"
                      : "hover:bg-gray-100"
                  )}
                >
                  <span className="material-icons w-5 h-5 text-gray-500 group-hover:text-primary-600">
                    {item.icon}
                  </span>
                  <span className="ml-3">{item.label}</span>
                  {item.count && (
                    <span className="inline-flex items-center justify-center px-2 ml-3 text-xs font-medium text-white bg-primary-600 rounded-full">
                      {item.count}
                    </span>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="pt-4 mt-4 space-y-2 border-t border-gray-200">
          {filteredBottomNavItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center p-2 pl-3 text-gray-900 rounded-lg group w-full",
                    location === item.href
                      ? "bg-primary-50 text-primary-600 border-l-3 border-primary-600"
                      : "hover:bg-gray-100"
                  )}
                >
                  <span className="material-icons w-5 h-5 text-gray-500 group-hover:text-primary-600">
                    {item.icon}
                  </span>
                  <span className="ml-3">{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
