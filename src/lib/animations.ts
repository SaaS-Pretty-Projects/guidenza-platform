export const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

export const cinematicSection = {
  initial: { opacity: 0, y: 50, filter: 'blur(10px)', scale: 0.98 },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
};

export const staggerContainer = (staggerDelay: number = 0.08) => ({
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-80px" },
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay } }
  }
});

export const staggerItem = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};

export const textReveal = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20, clipPath: 'inset(0 0 100% 0)' },
  whileInView: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});
