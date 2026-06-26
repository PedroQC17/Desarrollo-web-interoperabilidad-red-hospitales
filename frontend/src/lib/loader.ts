export const showGlobalLoader = () => {
  const el = document.getElementById("global-loader");
  if (el) el.classList.remove("hidden");
};

export const hideGlobalLoader = () => {
  const el = document.getElementById("global-loader");
  if (el) el.classList.add("hidden");
};
