import crypto from "crypto";

function makeNonce() {
  // Zego expects a non-negative nonce value.
  return crypto.randomBytes(4).readUInt32LE();
}

function aesEncrypt(plainText, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
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

  const plaintextBuf = Buffer.from(JSON.stringify(tokenInfo));
  const iv = crypto.randomBytes(16);
  const secretBuf = Buffer.from(secret);

  // Ensure 32-byte key for AES-256
  const keyBuf = Buffer.alloc(32);
  secretBuf.copy(keyBuf, 0, 0, Math.min(secretBuf.length, 32));

  const encryptBuf = aesEncrypt(plaintextBuf, keyBuf, iv);

  const expireTime = createTime + effectiveTimeInSeconds;
  const b = Buffer.alloc(4 + 2 + iv.length + 4 + encryptBuf.length);
  let offset = 0;

  b.writeUInt32LE(expireTime, offset);
  offset += 4;

  b.writeUInt16LE(iv.length, offset);
  offset += 2;

  iv.copy(b, offset);
  offset += iv.length;

  b.writeUInt32LE(encryptBuf.length, offset);
  offset += 4;

  encryptBuf.copy(b, offset);

  return "04" + b.toString("base64");
}
