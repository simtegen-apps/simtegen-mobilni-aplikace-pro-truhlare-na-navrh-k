// The caller's network for counting limits. Lives outside functions/ for the
// same reason as spolecne.js (everything under functions/ is a route).
//
// adresaKlienta (ochrana.js) gives the whole address. For IPv4 that is one
// household or office; for IPv6 it is not — a single connection is handed a
// whole /64 and can use a fresh address from it for every request, so a
// limit per /128 is no limit at all. IPv6 therefore counts by its /64.

import { adresaKlienta } from "./ochrana.js";

export function sitKlienta(request, env) {
  const ip = adresaKlienta(request, env);
  if (!ip || !ip.includes(":")) return ip;      // null (local run), IPv4, "neznama"
  // IPv4 written inside IPv6 (::ffff:198.51.100.7) is one IPv4 address.
  if (ip.includes(".")) return ip.slice(ip.lastIndexOf(":") + 1);
  const [hlava, ocas] = ip.toLowerCase().split("::");
  const zacatek = hlava ? hlava.split(":") : [];
  const konec = ocas ? ocas.split(":") : [];
  const skupiny = ocas === undefined
    ? zacatek
    : [...zacatek, ...Array(Math.max(0, 8 - zacatek.length - konec.length)).fill("0"), ...konec];
  return `${skupiny.slice(0, 4).map((s) => s.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}
