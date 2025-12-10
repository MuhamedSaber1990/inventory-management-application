import bcrypt from "bcrypt";

const saltRound = 10;

// Hash password with bcrypt
export async function hashPw(password) {
  const hashPw = await bcrypt.hash(password, saltRound);
  return hashPw;
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
