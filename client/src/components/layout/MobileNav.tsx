import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  role: string[];
}

const mobileNavItems: NavItem[] = [
  {
    label: "Главная",
    href: "/dashboard",
    icon: "dashboard",
    role: ["admin", "manager", "supplier"],
  },
  {
    label: "Аукционы",
    href: "/auctions",
    icon: "gavel",
    role: ["admin", "manager", "supplier"],
  },
  {
    label: "Закупки",
    href: "/purchases",
    icon: "shopping_cart",
    role: ["admin", "manager", "supplier"],
  },
  {
    label: "Склад",
    href: "/inventory",
    icon: "inventory",
    role: ["admin", "manager"],
  },
  {
    label: "Еще",
    href: "/more",
    icon: "menu",
    role: ["admin", "manager", "supplier"],
  },
];

const MobileNav = () => {
  const [location] = useLocation();
  const { data: user } = useUser();

  const filteredNavItems = mobileNavItems.filter(
    (item) => user && item.role.includes(user.role)
  );

  return (
    <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-10">
      <div className="grid grid-cols-5 py-2">
        {filteredNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex flex-col items-center justify-center",
                location === item.href ? "text-primary-600" : "text-gray-500"
              )}
            >
              <span className="material-icons text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
