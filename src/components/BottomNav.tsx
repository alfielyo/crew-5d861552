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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-6 py-3">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink key={to} to={to} className="relative flex flex-col items-center gap-1 px-4 py-1">
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
                  className="absolute -top-3 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
