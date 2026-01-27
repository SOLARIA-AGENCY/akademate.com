import { OTP } from 'otplib'

export interface TotpSecret {
  secret: string
  otpauthUrl: string
}

export const generateTotpSecret = (accountLabel: string, issuer = 'Akademate'): TotpSecret => {
  const otp = new OTP()
  const secret = otp.generateSecret()
  const otpauthUrl = otp.generateURI({
    issuer,
    label: accountLabel,
    secret,
  })

  return { secret, otpauthUrl }
}

export const verifyTotpToken = async (token: string, secret: string): Promise<boolean> => {
  const otp = new OTP()
  const result = await otp.verify({ token, secret })
  return result.valid
}
