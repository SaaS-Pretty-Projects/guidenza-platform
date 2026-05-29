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
