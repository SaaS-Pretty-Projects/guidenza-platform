import { motion } from 'framer-motion';
import logoSrc from '../assets/images/guidenza_logo_1780041038904.png';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <motion.img 
      src={logoSrc} 
      alt="Guidenza" 
      className={className || "h-7 w-auto"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  );
}
