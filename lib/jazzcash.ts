import crypto from 'crypto';

export function generateJazzCashRequest(
  amountPkr: number,
  txnRef: string,
  mobileNo: string
) {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateTime = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const expiry = new Date(now.getTime() + 3600000);
  const expiryDateTime = `${expiry.getFullYear()}${pad(expiry.getMonth()+1)}${pad(expiry.getDate())}${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`;

  const params: Record<string, string> = {
    pp_Version:             '2.0',
    pp_TxnType:             'MWALLET',
    pp_Language:            'EN',
    pp_MerchantID:          process.env.JAZZCASH_MERCHANT_ID || '',
    pp_SubMerchantID:       '',
    pp_Password:            process.env.JAZZCASH_PASSWORD || '',
    pp_BankID:              'TBANK',
    pp_ProductID:           'RETL',
    pp_TxnRefNo:            txnRef,
    pp_Amount:              (amountPkr * 100).toString(),
    pp_TxnCurrency:         'PKR',
    pp_TxnDateTime:         dateTime,
    pp_BillReference:       'ITBidsCredits',
    pp_Description:         'IT Bids Portal Credit Purchase',
    pp_TxnExpiryDateTime:   expiryDateTime,
    pp_ReturnURL:           `${process.env.NEXTAUTH_URL}/api/payments/jazzcash`,
    pp_MobileNumber:        mobileNo,
  };

  const salt = process.env.JAZZCASH_INTEGRITY_SALT || '';
  const sortedValues = Object.keys(params).sort().map(k => params[k]).join('&');
  const hashStr = `${salt}&${sortedValues}`;

  params.pp_SecureHash = crypto
    .createHmac('sha256', salt)
    .update(hashStr)
    .digest('hex')
    .toUpperCase();

  return params;
}

export function verifyJazzCashCallback(params: Record<string, string>): boolean {
  const received = params.pp_SecureHash;
  const copy = { ...params };
  delete copy.pp_SecureHash;

  const salt = process.env.JAZZCASH_INTEGRITY_SALT || '';
  const sortedValues = Object.keys(copy).sort().filter(k => copy[k]).map(k => copy[k]).join('&');
  const hashStr = `${salt}&${sortedValues}`;

  const expected = crypto
    .createHmac('sha256', salt)
    .update(hashStr)
    .digest('hex')
    .toUpperCase();

  return received === expected;
}
