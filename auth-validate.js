/* jQuery Validation Plugin setup for every auth form (login, forgot password, reset password, OTP). */
(function ($) {
    'use strict';
    if (!$) { return; }

    var designMatch = window.location.pathname.match(/(-split|-card)\.html$/);
    var designSuffix = designMatch ? designMatch[1] : '';
    function pageUrl(name) { return designSuffix ? name.replace(/\.html$/, designSuffix + '.html') : name; }

    function showAlert($form, type, message) {
        var $box = $form.find('.na-alert');
        if (!$box.length) { return; }
        $box.attr('class', 'na-alert na-alert-' + type + ' show').text(message);
    }

    // Shared error display: reuses the existing .na-field/.na-error/.has-error markup & CSS.
    var commonOptions = {
        errorElement: 'div',
        errorPlacement: function ($error, $element) {
            $error.appendTo($element.closest('.na-field').find('.na-error'));
        },
        highlight: function (element) {
            $(element).closest('.na-field').addClass('has-error');
        },
        unhighlight: function (element) {
            $(element).closest('.na-field').removeClass('has-error');
        }
    };

    $.validator.addMethod('phoneDigits', function (value) {
        return /^\d{10,15}$/.test(value.replace(/\D/g, ''));
    }, 'Enter a valid 10 digit phone number.');

    $.validator.addMethod('pwStrength', function (value) {
        return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
    }, 'Use 8+ characters with upper and lower case letters and a number.');

    $(function () {
        // Phone number mask, matching hwf's login page: (999) 999-9999
        if ($.fn.inputmask && $('#phone').length) {
            $('#phone').inputmask('(999) 999-9999', {
                placeholder: 'X',
                clearIncomplete: true
            });
        }

        // ---------- Login ----------
        var $login = $('#login-form');
        if ($login.length) {
            $login.validate($.extend({}, commonOptions, {
                ignore: ':hidden',
                rules: {
                    email: { required: true, email: true },
                    phone: { required: true, phoneDigits: true },
                    password: { required: true }
                },
                messages: {
                    email: { required: 'Enter your email id', email: 'Enter a valid email address.' },
                    phone: { required: 'Enter your phone', phoneDigits: 'Enter a valid 10 digit phone number.' },
                    password: { required: 'Password is required.' }
                },
                submitHandler: function () {
                    var mode = $('#login_with').val();
                    var $btn = $login.find('#submit-btn');

                    if (mode === 'email-pass') {
                        $btn.prop('disabled', true);
                        showAlert($login, 'success', 'Signed in. Redirecting to Clubs...');
                        setTimeout(function () { window.location.href = 'club-list.html'; }, 700);
                    } else {
                        var target = mode === 'phone' ? $('#phone').val().trim() : $('#email').val().trim();
                        showAlert($login, 'success', 'Passcode sent. Redirecting...');
                        setTimeout(function () {
                            window.location.href = pageUrl('otp.html') + '?mode=' + mode + '&to=' + encodeURIComponent(target);
                        }, 600);
                    }
                    return false;
                }
            }));
        }

        // ---------- Forgot password ----------
        var $forgot = $('#forgot-form');
        if ($forgot.length) {
            $forgot.validate($.extend({}, commonOptions, {
                rules: { email: { required: true, email: true } },
                messages: { email: { required: 'Enter your email', email: 'Enter a valid email address.' } },
                submitHandler: function () {
                    var email = $forgot.find('#email').val().trim();
                    $('#sent-to').text(email);
                    $forgot.addClass('na-hidden');
                    $('.na-head').addClass('na-hidden');
                    $('#sent-state').addClass('show');
                    return false;
                }
            }));
        }

        // ---------- Reset password ----------
        var $reset = $('#reset-form');
        if ($reset.length) {
            $reset.validate($.extend({}, commonOptions, {
                rules: {
                    password: { required: true, pwStrength: true },
                    password_confirmation: { required: true, equalTo: '#password' }
                },
                messages: {
                    password: { required: 'Password is required.' },
                    password_confirmation: {
                        required: 'Confirm your password.',
                        equalTo: 'Passwords do not match.'
                    }
                },
                submitHandler: function () {
                    showAlert($reset, 'success', 'Password updated. Redirecting to login...');
                    $reset.find('#reset-btn').prop('disabled', true);
                    setTimeout(function () { window.location.href = pageUrl('index.html'); }, 1200);
                    return false;
                }
            }));
        }

        // ---------- One time passcode ----------
        var $otp = $('#otp-form');
        if ($otp.length) {
            var $otpValue = $('<input type="hidden" id="otp_value" name="otp">').appendTo($otp.find('.na-otp-field'));
            function syncOtpValue() {
                var value = $otp.find('.na-otp-digit').map(function () { return $(this).val(); }).get().join('');
                $otpValue.val(value);
            }
            $otp.find('.na-otp-digit').on('input keyup', syncOtpValue);

            $.validator.addMethod('otpComplete', function (value) {
                return /^\d{6}$/.test(value);
            }, 'Enter the 6 digit passcode.');

            $otp.validate($.extend({}, commonOptions, {
                ignore: '.na-otp-digit',
                rules: { otp: { required: true, otpComplete: true } },
                messages: { otp: { required: 'Enter the 6 digit passcode.', otpComplete: 'Enter the 6 digit passcode.' } },
                submitHandler: function () {
                    $otp.find('#otp-btn').prop('disabled', true);
                    showAlert($otp, 'success', 'Verified. Redirecting to Clubs...');
                    setTimeout(function () { window.location.href = 'club-list.html'; }, 700);
                    return false;
                }
            }));
        }
    });
})(window.jQuery);
