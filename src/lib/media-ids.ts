export function isRequestPhotoId(id: string) {
  return /^yeucau-[\w.-]{1,64}$/.test(id);
}

export function requestIdFromPhoto(id: string) {
  const match = /^yeucau-(.+)-\d+$/.exec(id);
  return match?.[1] ?? "";
}

/** Accept wizard/login media slot ids. */
export function isMediaSlotId(id: string) {
  return id === "login-bg" || /^(line|model|garmin):[\w.-]{1,64}$/.test(id) || isRequestPhotoId(id);
}

/** Photos picked on the product form (main image and album). */
export function isProductPhotoId(id: string) {
  return /^(record|album)-[\w.-]{1,70}$/.test(id);
}

export function isUploadableMediaId(id: string) {
  return isMediaSlotId(id) || isProductPhotoId(id);
}
