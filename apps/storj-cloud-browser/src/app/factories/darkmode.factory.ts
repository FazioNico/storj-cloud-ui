export const darkmodeFactory = (d: Document) => {
  // check for saved dark mode preference from localStorage
  const darkMode = d?.defaultView?.localStorage?.getItem('darkMode');
  if (darkMode) {
    d.body.classList.toggle('dark', darkMode === 'true');
    return;
  }
  // check for default browser settings with dark mode enabled
  const prefersDark = d?.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  // toggles dark mode by toggling the body class
  if (prefersDark) {
    d.body.classList.toggle('dark', prefersDark.matches);
    // listen for changes to the dark mode preference
    prefersDark.addListener((mediaQuery) => d.body.classList.toggle('dark', mediaQuery.matches));
  }
}