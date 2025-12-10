import api from '../api.js';
 clearInterval(window.OtpTimer);
window.resendBtn = document.getElementById('resend-btn');
window.verifyBtn = document.getElementById('verify-btn');
const userEmailDisplay = document.getElementById('user-email');
  
 
// OTP input handling functions
window.moveToNext = moveToNext;

function moveToNext(current, currentIndex) {
  // Only allow numbers
  current.value = current.value.replace(/[^0-9]/g, '');

  if (current.value.length === 1 && currentIndex < 6) {
    const nextInput = document.getElementById(`otp-${currentIndex + 1}`);
    if (nextInput) nextInput.focus();
  }
}

window.handleBackspace = handleBackspace;

function handleBackspace(event, currentIndex) {
  if (event.key === 'Backspace') {
    const current = document.getElementById(`otp-${currentIndex}`);

    if (current.value === '' && currentIndex > 1) {
      const prevInput = document.getElementById(`otp-${currentIndex - 1}`);
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
      }
    }
  }
}

// ====== OTP Verification ======
window.verifyOTP = async function verifyOTP(event) {
  event.preventDefault();
  

  let otp = '';

  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otp-${i}`);
    
    if (!input.value) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete OTP',
        text: 'Please enter all 6 digits',
        confirmButtonColor: '#667eea'
      });
      
      input.focus();
      return;
    }
    
    otp += input.value;
  }

  window.otp = otp;
  console.log('User entered OTP:', otp);

  Swal.fire({
    title: 'Verifying OTP...',
    didOpen: () => Swal.showLoading(),
    timer:"2000"
  });

  const res = await api.userOtpAxios(otp);
  Swal.close();
console.log(res)
  if (res.data.success) {
    // Clear timer data on successful verification
    localStorage.removeItem('otpTimer');
    localStorage.removeItem('otpExpire');
    clearInterval(window.OtpTimer);
    
    Swal.fire({
      icon: 'success',
      title: 'OTP Verified!',
      text: res.data.message,
      confirmButtonColor: '#667eea'
    }).then(() => {
      const loginUrl = sessionStorage.getItem('urlLoginPage');
      console.log(loginUrl)
      window.location.href = loginUrl || '/login';
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Invalid OTP',
      text: 'Please try again.',
      confirmButtonColor: '#667eea'
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  userEmailDisplay.textContent = sessionStorage.getItem('email');
  
  const savedExpire = localStorage.getItem('otpExpire') === 'true';
  
  if (savedExpire) {
    handleExpiredOTP();
    return;
  }

  const savedTimer = localStorage.getItem('otpTimer');
  if (!savedTimer) {
    startTimer('timer', 2);
  } else {
    startTimer('timer', 0);
  }

  document.getElementById('otp-1').focus();
});

// ==== Expired Handler ===
function handleExpiredOTP() {
  clearInterval(window.OtpTimer);

  const display = document.getElementById('timer');
  display.textContent = "Expired";
  display.classList.add("text-red-500");

  resendBtn.disabled = false;
  resendBtn.classList.remove("btn-disabled");

  verifyBtn.disabled = true;
  verifyBtn.classList.add("btn-disabled");

  localStorage.setItem('otpExpire', 'true');

  Swal.fire({
    icon: 'error',
    title: 'OTP Expired',
    text: 'Please request a new OTP.'
  });
}

// ====== Timer =====================
window.startTimer = function startTimer(elementId, minutes) {
  clearInterval(window.OtpTimer);

  const savedTimer = localStorage.getItem('otpTimer');
  let totalSeconds;

  if (savedTimer) {
    const timerData = JSON.parse(savedTimer);
    const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
    totalSeconds = timerData.totalSeconds - elapsed;

    if (totalSeconds <= 0) {
      localStorage.removeItem('otpTimer');
      handleTimerExpiration(elementId);
      return;
    }
  } else {
    totalSeconds = minutes * 60;
    localStorage.setItem('otpTimer', JSON.stringify({
      startTime: Date.now(),
      totalSeconds
    }));
  }

  const display = document.getElementById(elementId);

  window.OtpTimer = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(window.OtpTimer);
      localStorage.removeItem('otpTimer');
      handleTimerExpiration(elementId);
      return;
    }

    const formattedMinutes = Math.floor(totalSeconds / 60); 
    const formattedSeconds = totalSeconds % 60; 
    const formatted = `${String(formattedMinutes).padStart(2, '0')}:${String(formattedSeconds).padStart(2, '0')}`;
    display.textContent = formatted;
    totalSeconds--;

    localStorage.setItem('otpTimer', JSON.stringify({
      startTime: Date.now(),
      totalSeconds
    }));
  }, 1000);
};

// ====== Timer Expiration ======
function handleTimerExpiration(elementId) {
  const display = document.getElementById(elementId);
  display.textContent = "Expired";
  display.classList.add("text-red-500");

  verifyBtn.disabled = true;
  verifyBtn.classList.add("btn-disabled");
  resendBtn.disabled = false;
  resendBtn.classList.remove("btn-disabled");

  Swal.fire({
    icon: 'error',
    title: 'OTP Expired',
    text: 'Please request a new OTP.'
  });

  localStorage.setItem('otpExpire', 'true');
}

// ===================== Resend =====================
window.resendOTP = async function() {
  window.display = document.getElementById('timer');
  display.classList.remove("text-red-500");
  localStorage.removeItem('otpTimer');
  localStorage.removeItem('otpExpire');
  clearInterval(window.OtpTimer);
  
  verifyBtn.classList.remove("btn-disabled");
  verifyBtn.disabled = false;
  resendBtn.disabled = true;
  resendBtn.classList.add("btn-disabled");

  await api.resendOtpAxios(true);

  Swal.fire({
    icon: 'success',
    title: 'OTP Resent!',
    text: 'Check your email.',
    timer: 2000,
    showConfirmButton: false
  });

  for (let i = 1; i <= 6; i++) {
    document.getElementById(`otp-${i}`).value = '';
  }

  startTimer('timer', 2);
  document.getElementById('otp-1').focus();

  setTimeout(() => {
    resendBtn.disabled = false;
    resendBtn.classList.remove("btn-disabled");
  }, 120000);
};

// ====== Paste OTP Functionality ======
document.getElementById('otp-1').addEventListener('paste', (e) => {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
  
  for (let i = 0; i < pastedData.length && i < 6; i++) {
    document.getElementById(`otp-${i + 1}`).value = pastedData[i];
  }
  
  if (pastedData.length === 6) {
    document.getElementById('otp-6').focus();
  } else if (pastedData.length > 0) {
    document.getElementById(`otp-${Math.min(pastedData.length + 1, 6)}`).focus();
  }
});