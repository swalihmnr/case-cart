import api from "../api.js";

document.addEventListener('DOMContentLoaded', function () {

    const modal = document.getElementById('addMoneyModal');
    const modalContent = document.getElementById('modalContent');
    const amountInput = document.getElementById('amount');
    const amountError = document.getElementById('amountError');
    const addMoneyBtn = document.getElementById('addMoneyBtn');
    const totalAmountSpan = document.getElementById('totalAmount');

    // ---------------------------
    // OPEN MODAL
    // ---------------------------
    window.openAddMoneyModal = function () {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);

        amountInput.value = '';
        totalAmountSpan.textContent = '₹ 0.00';
        amountError.classList.add('hidden');
        addMoneyBtn.disabled = true;
    };

    // ---------------------------
    // CLOSE MODAL
    // ---------------------------
    window.closeAddMoneyModal = function () {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    // ---------------------------
    // VALIDATE AMOUNT
    // ---------------------------
    window.validateAmount = function () {
        const amount = parseFloat(amountInput.value);

        if (amountInput.value === '' || isNaN(amount) || amount < 1) {
            amountError.classList.remove('hidden');
            addMoneyBtn.disabled = true;
            totalAmountSpan.textContent = '₹ 0.00';
        } else {
            amountError.classList.add('hidden');
            addMoneyBtn.disabled = false;
            totalAmountSpan.textContent = `₹ ${amount.toFixed(2)}`;
        }
    };

    // ---------------------------
    // SHOW SUCCESS MODAL
    // ---------------------------
    function showSuccessModal(amount) {
        Swal.fire({
            icon: 'success',
            title: '<span style="font-size: 28px; font-weight: 600;">Payment Successful! 🎉</span>',
            html: `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 48px; color: #10B981; margin-bottom: 15px;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <p style="font-size: 18px; color: #374151; margin-bottom: 5px;">
                        ₹ ${amount.toFixed(2)} has been added to your wallet
                    </p>
                    <p style="font-size: 14px; color: #6B7280; margin-top: 5px;">
                        Transaction completed successfully
                    </p>
                </div>
            `,
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-wallet mr-2"></i> Go to Wallet Dashboard',
            cancelButtonText: '<i class="fas fa-times mr-2"></i> Close',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            backdrop: `
                rgba(0,0,0,0.6)
                url("/images/nyan-cat.gif")
                left top
                no-repeat
            `,
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-2xl font-bold text-gray-800',
                confirmButton: 'px-6 py-3 text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
                cancelButton: 'px-6 py-3 text-base font-medium rounded-lg hover:bg-gray-100 transition-all duration-200'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/wallet-dashboard';
            } else {
                window.location.reload();
            }
        });
    }

    // ---------------------------
    // SHOW FAILURE MODAL
    // ---------------------------
    function showFailureModal(errorMessage, amount) {
        Swal.fire({
            icon: 'error',
            title: '<span style="font-size: 28px; font-weight: 600;">Payment Failed! 😟</span>',
            html: `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 48px; color: #EF4444; margin-bottom: 15px;">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 5px;">
                        ${errorMessage || "Unable to process your payment"}
                    </p>
                    <p style="font-size: 14px; color: #6B7280; margin-top: 10px; margin-bottom: 15px;">
                        Amount attempted: ₹ ${amount ? amount.toFixed(2) : '0.00'}
                    </p>
                    <div style="background-color: #FEE2E2; border-radius: 8px; padding: 12px; margin-top: 10px;">
                        <p style="color: #991B1B; font-size: 13px;">
                            <i class="fas fa-info-circle mr-1"></i>
                            Your money is safe. No amount has been deducted.
                        </p>
                    </div>
                </div>
            `,
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-redo mr-2"></i> Retry Payment',
            cancelButtonText: '<i class="fas fa-wallet mr-2"></i> Go to Wallet',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#3B82F6',
            backdrop: `
                rgba(0,0,0,0.6)
            `,
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-2xl font-bold text-gray-800',
                confirmButton: 'px-6 py-3 text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
                cancelButton: 'px-6 py-3 text-base font-medium rounded-lg hover:shadow-lg transition-all duration-200'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Retry payment - reopen the add money modal with the same amount
                closeAddMoneyModal();
                setTimeout(() => {
                    openAddMoneyModal();
                    if (amount) {
                        amountInput.value = amount;
                        validateAmount();
                    }
                }, 300);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.href = '/wallet-dashboard';
            }
        });
    }

    // ---------------------------
    // SHOW PAYMENT TIMEOUT MODAL
    // ---------------------------
    function showTimeoutModal(amount) {
        Swal.fire({
    icon: 'info',
    title: '<span style="font-size: 28px; font-weight: 600;">Payment Cancelled! ✋</span>',
    html: `
        <div style="text-align: center; padding: 10px;">
            <div style="font-size: 48px; color: #6B7280; margin-bottom: 15px;">
                <i class="fas fa-ban"></i>
            </div>
            <p style="font-size: 16px; color: #374151; margin-bottom: 5px;">
                You cancelled the payment
            </p>
            <p style="font-size: 14px; color: #6B7280; margin-top: 10px;">
                No money was deducted from your account
            </p>
        </div>
    `,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-redo mr-2"></i> Try Again',
    cancelButtonText: '<i class="fas fa-wallet mr-2"></i> Wallet Dashboard',
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    customClass: {
        popup: 'rounded-2xl shadow-2xl'
    }
}).then((result) => {
            if (result.isConfirmed) {
                closeAddMoneyModal();
                setTimeout(() => {
                    openAddMoneyModal();
                    if (amount) {
                        amountInput.value = amount;
                        validateAmount();
                    }
                }, 300);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.href = '/wallet-dashboard';
            }
        });
    }

    // ---------------------------
    // PROCESS ADD MONEY
    // ---------------------------
    window.processAddMoney = async function () {
        const amount = parseFloat(amountInput.value);

        if (!amount || amount < 1) return;

        const btn = addMoneyBtn;
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        btn.disabled = true;

        try {
            // ---------------------------
            // CREATE PAYLOAD
            // ---------------------------
            const payload = {
                amount: amount
            };

            console.log("Sending wallet payload:", payload);

            // ---------------------------
            // CALL BACKEND TO CREATE ORDER
            // ---------------------------
            const res = await api.createRazorpayOrderWallletAxios(payload)
            const data = await res.data
            console.log(data)

            if (!data.success) {
                throw new Error(data.message || "Failed to create payment order");
            }

            // ---------------------------
            // OPEN RAZORPAY
            // ---------------------------
            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "CaseCart Wallet",
                description: "Wallet Top-up",
                order_id: data.order.id,

                // Handle payment timeout/closure
                modal: {
                    ondismiss: function() {
                        showTimeoutModal(amount);
                    }
                },

                handler: async function (response) {
                    try {
                        // VERIFY PAYMENT
                        const data = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: amount
                        };

                        const verifyRes = await api.verifyRazorpayPaymentWalletAxios(data);
                        const verifyData = verifyRes.data

                        if (verifyData.success) {
                            // Show stylish success modal
                            showSuccessModal(amount);
                        } else {
                            // Show stylish failure modal
                            showFailureModal("Payment verification failed", amount);
                        }
                    } catch (verifyError) {
                        console.error(verifyError);
                        showFailureModal(verifyError.message || "Payment verification failed", amount);
                    }
                },

                theme: {
                    color: "#3B82F6"
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error(error);
            // Show failure modal for API errors
            showFailureModal(error.message || "Failed to initialize payment", amount);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };

    // ---------------------------
    // CLOSE MODAL OUTSIDE CLICK
    // ---------------------------
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeAddMoneyModal();
        }
    });

});