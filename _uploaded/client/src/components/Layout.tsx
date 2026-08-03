import { NavLink, Outlet } from "react-router-dom";
import { Home, Calendar, ShoppingBag, User, BookOpen } from "lucide-react";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/tasks", label: "任务", icon: BookOpen },
  { path: "/checkin", label: "打卡", icon: Calendar },
  { path: "/shop", label: "商城", icon: ShoppingBag },
  { path: "/profile", label: "我的", icon: User },
];

const Layout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto safe-bottom">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
