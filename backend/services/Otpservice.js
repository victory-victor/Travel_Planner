// otpService.js
// Key change: verifyOTP now has a "peek" mode that checks WITHOUT deleting,
// so we can verify in step 1 and still use it in step 2 (reset-password).

const otpStore = new Map();

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const saveOTP = (email, otp) => {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    verified: false,
  });
};

// peek = true  → check only, don't delete (used in /verify-otp)
// peek = false → consume after success (used in /reset-password)
const verifyOTP = (email, inputOtp, peek = false) => {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return { valid: false, reason: 'No OTP found. Please request a new one.' };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (entry.otp !== inputOtp.toString()) {
    return { valid: false, reason: 'Incorrect OTP. Please try again.' };
  }
  if (!peek) {
    // mark as verified but keep it so reset-password can confirm
    entry.verified = true;
  }
  return { valid: true };
};

// Called by reset-password — checks that OTP was already verified in step 1
const isOTPVerified = (email) => {
  const entry = otpStore.get(email.toLowerCase());
  return entry?.verified === true;
};

const deleteOTP = (email) => otpStore.delete(email.toLowerCase());

module.exports = { generateOTP, saveOTP, verifyOTP, isOTPVerified, deleteOTP };