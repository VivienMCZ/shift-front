/** True when `href` is the current route or one of its ancestors. */
export function isActivePath(pathname, href) {
  return pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`))
}
