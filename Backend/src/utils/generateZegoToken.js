import crypto from "crypto";

function makeNonce() {
  // Zego expects a non-negative nonce value.
  return crypto.randomBytes(4).readUInt32BE();
}

function aesEncrypt(plainText, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
}

function deriveSecretKey(secret) {
  const trimmed = (secret || "").trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0;
  const raw = isHex ? Buffer.from(trimmed, "hex") : Buffer.from(trimmed, "utf8");

  const keyBuf = Buffer.alloc(32);
  raw.copy(keyBuf, 0, 0, Math.min(raw.length, 32));
  return keyBuf;
}

/**
 * Generates a ZegoCloud "04" token on the server side.
 * This keeps the serverSecret safe from client exposure.
 */
export function generateZegoToken(appId, secret, roomId, userId, userName) {
  const effectiveTimeInSeconds = 3600; // 1 hour

  const payload = JSON.stringify({
    room_id: roomId,
    privilege: { 1: 1, 2: 1 },
    stream_id_list: null,
  });

  const createTime = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: makeNonce(),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload: payload,
  };

  const plaintextBuf = Buffer.from(JSON.stringify(tokenInfo), "utf8");
  const iv = crypto.randomBytes(16);
  const keyBuf = deriveSecretKey(secret);

  const encryptBuf = aesEncrypt(plaintextBuf, keyBuf, iv);

  const expireTime = createTime + effectiveTimeInSeconds;
  const b = Buffer.alloc(4 + 2 + iv.length + 4 + encryptBuf.length);
  let offset = 0;

  b.writeUInt32BE(expireTime, offset);
  offset += 4;

  b.writeUInt16BE(iv.length, offset);
  offset += 2;

  iv.copy(b, offset);
  offset += iv.length;

  b.writeUInt32BE(encryptBuf.length, offset);
  offset += 4;

  encryptBuf.copy(b, offset);

  return "04" + b.toString("base64");
}
