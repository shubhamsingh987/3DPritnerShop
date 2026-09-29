"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// MUI components are styled through `sx` with the site's own CSS variables
// (see globals.css), so light/dark follows next-themes' `.dark` class with no
// second theme system to keep in sync. The MUI theme only supplies fonts.
const theme = createTheme({
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
  },
  shape: { borderRadius: 16 },
});

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
