import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  withBottomNav?: boolean;
}

const PageShell = ({ children, className = "", withBottomNav = false }: PageShellProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`min-h-[100dvh] w-full ${withBottomNav ? "pb-20 lg:pb-0 lg:pl-20" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageShell;
