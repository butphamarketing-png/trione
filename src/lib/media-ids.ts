/** Accept wizard/login media slot ids. */
export function isMediaSlotId(id: string) {
  return id === "login-bg" || /^(line|model|garmin):[\w.-]{1,64}$/.test(id);
}
