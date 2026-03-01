import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/my-run", icon: Calendar, label: "My Run" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl safe-bottom lg:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {tabs.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className="relative flex min-h-[3rem] flex-col items-center justify-center gap-0.5 px-3"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={isActive ? "text-primary" : "text-muted-foreground"}
                />
                <span className={`text-[11px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop side nav */}
      <nav className="fixed left-0 top-0 z-50 hidden h-[100dvh] w-20 flex-col items-center border-r border-border bg-background py-6 lg:flex">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-1 px-2"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabDesktop"
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.5}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
