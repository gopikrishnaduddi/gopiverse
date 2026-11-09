/*  Payment methods on the Pay page.
    LOGOS: save an image in public/assets/payments/<id>.png  (upi.png, card.png, netbanking.png, wallet.png)
           — or paste an image link into `logo` below. If neither exists, the emoji is shown.          */
export const PAYMENTS = [
  { id: 'upi', emoji: '📱', name: 'UPI', sub: 'Google Pay, PhonePe, Paytm or any UPI app', logo: '', options: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM'], note: 'You will approve the payment in your UPI app.' },
  { id: 'card', emoji: '💳', name: 'Credit / Debit card', sub: 'Visa, Mastercard, RuPay, Amex', logo: '', options: ['Visa', 'Mastercard', 'RuPay', 'Amex'], note: 'Card details are entered on the bank\'s secure page.' },
  { id: 'netbanking', emoji: '🏦', name: 'Net banking', sub: 'All major banks', logo: '', options: ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak'], note: 'You will be redirected to your bank.' },
  { id: 'wallet', emoji: '👛', name: 'Wallets', sub: 'Amazon Pay, Mobikwik, Freecharge', logo: '', options: ['Amazon Pay', 'Mobikwik', 'Freecharge'], note: 'Pay from your wallet balance.' },
]
