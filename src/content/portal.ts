/** User-facing portal copy — keep area names and page titles distinct to avoid repetition. */

export const areas = {
  driver: "Driver",
  admin: "Admin",
} as const;

export const pages = {
  homeTagline: "Energetic Exotics Portal",
  homeTitle: "Choose access",
  signIn: "Sign in",
  passwordHelp: "Password help",
} as const;

export const notices = {
  driverSignIn: "Authorized drivers only",
  adminSignIn: "Authorized staff only",
} as const;

export const nav = {
  home: "Home",
  login: "Login",
  logout: "Logout",
} as const;

export const footer = {
  copyright: "© 2026 Energetic Exotics. All rights reserved.",
  credit: "Portal by",
  creditBrand: "Reform Digital®",
  creditHref: "https://www.reform.digital/",
} as const;
