const twilio = require('twilio');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function smsSignupConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID
    && process.env.TWILIO_AUTH_TOKEN
    && process.env.TWILIO_FROM_NUMBER,
  );
}

function normalizeForSmsE164Digits(digits) {
  /** Pakistan default: normalize to digits without "+", expecting country in env DEFAULT_SMS_COUNTRY_CODE default 92 */
  let d = String(digits || '').replace(/\D/g, '');
  if (!d) return '';
  const cc = String(process.env.DEFAULT_SMS_COUNTRY_CODE || '92').replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (cc === '92' && d.length === 10 && !d.startsWith('92')) return `92${d}`;
  if (!d.startsWith(cc)) d = `${cc}${d}`;
  return d;
}

async function deliverSms(toDigitsNoPlus, body) {
 const to = `+${toDigitsNoPlus.replace(/^\+/, "")}`;
  if (!smsSignupConfigured()) {
    console.warn('[sms] Twilio not configured; would SMS', to.slice(0, 6) + '…:', body.slice(0, 40) + '…');
    return;
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to,
    body,
  });
}

function generateSmsOtp() {
  /** 6-digit numeric OTP */
  return String(crypto.randomInt(100000, 1000000));
}

async function hashOtp(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyOtp(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  smsSignupConfigured,
  normalizeForSmsE164Digits,
  deliverSms,
  generateSmsOtp,
  hashOtp,
  verifyOtp,
};
