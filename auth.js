/* Demo behaviour for the new auth design pages (no backend). */
(function () {
    'use strict';

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function setError(input, message) {
        var field = input.closest('.na-field');
        if (!field) { return; }
        var err = $('.na-error', field);
        if (message) {
            field.classList.add('has-error');
            if (err) { err.textContent = message; }
        } else {
            field.classList.remove('has-error');
        }
    }

    function showAlert(form, type, message) {
        var box = $('.na-alert', form);
        if (!box) { return; }
        box.className = 'na-alert na-alert-' + type + ' show';
        box.textContent = message;
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Show / hide password
    $all('.na-eye').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var input = $('input', btn.parentNode);
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.innerHTML = '<i class="fa ' + (show ? 'fa-eye-slash' : 'fa-eye') + '" aria-hidden="true"></i>';
        });
    });

    // Clear error as the user types
    $all('.na-input').forEach(function (input) {
        input.addEventListener('input', function () { setError(input, ''); });
    });

    // ---------- Login ----------
    var loginForm = $('#login-form');
    if (loginForm) {
        var modeInput = $('#login_with');
        var tabs = $all('.na-tab', loginForm);

        function setMode(mode) {
            modeInput.value = mode;
            tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-mode') === mode); });
            $('.email-field', loginForm).classList.toggle('na-hidden', mode === 'phone');
            $('.phone-field', loginForm).classList.toggle('na-hidden', mode !== 'phone');
            $('.password-field', loginForm).classList.toggle('na-hidden', mode !== 'email-pass');
            $('.forgot-password', loginForm).classList.toggle('na-hidden', mode !== 'email-pass');
            $('.phone-note', loginForm).classList.toggle('na-hidden', mode !== 'phone');
            $('.otp-note', loginForm).classList.toggle('na-hidden', mode === 'email-pass');
            $('#submit-label', loginForm).textContent = mode === 'email-pass' ? 'Sign In' : 'Send One Time Passcode';
            $('#submit-icon', loginForm).className = 'fa ' + (mode === 'email-pass' ? 'fa-sign-in' : 'fa-paper-plane-o');
            $('.na-alert', loginForm).className = 'na-alert';
        }

        tabs.forEach(function (t) {
            t.addEventListener('click', function () { setMode(t.getAttribute('data-mode')); });
        });
        setMode('email-pass');

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var mode = modeInput.value;
            var ok = true;
            var email = $('#email'), phone = $('#phone'), pass = $('#password');

            if (mode !== 'phone') {
                if (!emailRe.test(email.value.trim())) { setError(email, 'Enter a valid email address.'); ok = false; }
            } else if (phone.value.replace(/\D/g, '').length < 10) {
                setError(phone, 'Enter a valid 10 digit phone number.'); ok = false;
            }
            if (mode === 'email-pass' && !pass.value) { setError(pass, 'Password is required.'); ok = false; }
            if (!ok) { return; }

            if (mode === 'email-pass') {
                var btn = $('#submit-btn', loginForm);
                btn.disabled = true;
                showAlert(loginForm, 'success', 'Signed in. Redirecting to Clubs...');
                setTimeout(function () { window.location.href = 'club-list.html'; }, 700);
            } else {
                var target = mode === 'phone' ? phone.value.trim() : email.value.trim();
                showAlert(loginForm, 'success', 'Passcode sent. Redirecting...');
                setTimeout(function () {
                    window.location.href = 'otp.html?mode=' + mode + '&to=' + encodeURIComponent(target);
                }, 600);
            }
        });
    }

    // ---------- Forgot password ----------
    var forgotForm = $('#forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = $('#email', forgotForm);
            if (!emailRe.test(email.value.trim())) { setError(email, 'Enter a valid email address.'); return; }
            $('#sent-to').textContent = email.value.trim();
            forgotForm.classList.add('na-hidden');
            $('.na-head').classList.add('na-hidden');
            $('#sent-state').classList.add('show');
        });
    }

    // ---------- Reset password ----------
    var resetForm = $('#reset-form');
    if (resetForm) {
        var pw = $('#password', resetForm);
        var cf = $('#password_confirmation', resetForm);
        var bar = $('.na-strength-bar', resetForm);
        var rules = {
            len: function (v) { return v.length >= 8; },
            upper: function (v) { return /[A-Z]/.test(v) && /[a-z]/.test(v); },
            num: function (v) { return /\d/.test(v); },
            sym: function (v) { return /[^A-Za-z0-9]/.test(v); }
        };

        pw.addEventListener('input', function () {
            var score = 0;
            Object.keys(rules).forEach(function (k) {
                var pass = rules[k](pw.value);
                $('[data-rule="' + k + '"]', resetForm).classList.toggle('ok', pass);
                $('[data-rule="' + k + '"] .fa', resetForm).className = 'fa ' + (pass ? 'fa-check-circle' : 'fa-circle-o');
                if (pass) { score++; }
            });
            bar.className = 'na-strength-bar' + (pw.value ? ' s' + Math.max(score, 1) : '');
        });

        resetForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var ok = true;
            if (!rules.len(pw.value) || !rules.upper(pw.value) || !rules.num(pw.value)) {
                setError(pw, 'Use 8+ characters with upper and lower case letters and a number.'); ok = false;
            }
            if (cf.value !== pw.value || !cf.value) { setError(cf, 'Passwords do not match.'); ok = false; }
            if (!ok) { return; }
            showAlert(resetForm, 'success', 'Password updated. Redirecting to login...');
            $('#reset-btn', resetForm).disabled = true;
            setTimeout(function () { window.location.href = 'index.html'; }, 1200);
        });
    }

    // ---------- One time passcode ----------
    var otpForm = $('#otp-form');
    if (otpForm) {
        var params = new URLSearchParams(window.location.search);
        var viaPhone = params.get('mode') === 'phone';
        var to = params.get('to') || (viaPhone ? 'your phone' : 'your email');
        $('#otp-to').textContent = to;
        $('#otp-via').textContent = viaPhone ? 'phone' : 'email';

        var digits = $all('.na-otp-digit', otpForm);
        var otpField = $('.na-otp-field', otpForm);

        function otpValue() { return digits.map(function (d) { return d.value; }).join(''); }

        digits.forEach(function (d, i) {
            d.addEventListener('input', function () {
                d.value = d.value.replace(/\D/g, '').slice(-1);
                otpField.classList.remove('has-error');
                if (d.value && digits[i + 1]) { digits[i + 1].focus(); }
            });
            d.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !d.value && digits[i - 1]) { digits[i - 1].focus(); }
                if (e.key === 'ArrowLeft' && digits[i - 1]) { digits[i - 1].focus(); }
                if (e.key === 'ArrowRight' && digits[i + 1]) { digits[i + 1].focus(); }
            });
            d.addEventListener('paste', function (e) {
                var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (!text) { return; }
                e.preventDefault();
                digits.forEach(function (box, k) { box.value = text.charAt(k) || ''; });
                digits[Math.min(text.length, digits.length) - 1].focus();
            });
        });
        digits[0].focus();

        // Resend countdown
        var resend = $('#resend-btn'), timer = $('#resend-timer'), left = 0, tick;
        function startTimer() {
            left = 30;
            resend.disabled = true;
            timer.textContent = ' in 30s';
            clearInterval(tick);
            tick = setInterval(function () {
                left--;
                if (left <= 0) { clearInterval(tick); resend.disabled = false; timer.textContent = ''; }
                else { timer.textContent = ' in ' + left + 's'; }
            }, 1000);
        }
        startTimer();
        resend.addEventListener('click', function () {
            digits.forEach(function (d) { d.value = ''; });
            digits[0].focus();
            showAlert(otpForm, 'success', 'A new passcode has been sent.');
            startTimer();
        });

        otpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (otpValue().length < digits.length) {
                otpField.classList.add('has-error');
                $('.na-error', otpField).textContent = 'Enter the 6 digit passcode.';
                return;
            }
            $('#otp-btn', otpForm).disabled = true;
            showAlert(otpForm, 'success', 'Verified. Redirecting to Clubs...');
            setTimeout(function () { window.location.href = 'club-list.html'; }, 700);
        });
    }
})();
