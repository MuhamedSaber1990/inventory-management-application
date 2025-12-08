// Generate random 13-digit barcode
export function randomBarCode(length = 13) {
  let code = "";
  for (let index = 0; index < length; index++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

export function SKU(name) {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${random}`;
}
