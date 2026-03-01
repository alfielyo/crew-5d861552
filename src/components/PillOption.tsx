import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PillOptionProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

const PillOption = ({ selected, onClick, children }: PillOptionProps) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-secondary text-foreground hover:border-muted-foreground"
    }`}
  >
    {children}
  </motion.button>
);

export default PillOption;
