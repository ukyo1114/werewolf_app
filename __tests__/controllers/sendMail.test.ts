jest.mock('nodemailer');

import nodemailer from 'nodemailer';
import { sendMail } from '../../src/controllers/verifyEmail/utils';

describe('sendMail', () => {
  let sendMailMock: jest.Mock;

  beforeAll(() => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: jest.fn(() => Promise.resolve({})),
    });
    sendMailMock = (nodemailer.createTransport() as any).sendMail;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send an email with correct content for registerUser mode', async () => {
    const email = 'test@example.com';
    const verificationToken = 'testToken';
    const mode = 'registerUser';

    await sendMail(email, verificationToken, mode);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'メールアドレスの確認',
      text: expect.stringContaining(
        `${process.env.SERVER_URL}/api/user/register?token=${verificationToken}`,
      ),
      html: expect.stringContaining(
        `${process.env.SERVER_URL}/api/user/register?token=${verificationToken}`,
      ),
    });
  });

  it('should send an email with correct content for changeEmail mode', async () => {
    const email = 'test@example.com';
    const verificationToken = 'testToken';
    const mode = 'changeEmail';

    await sendMail(email, verificationToken, mode);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'メールアドレス変更',
      text: expect.stringContaining(
        `${process.env.SERVER_URL}/api/verify-email/complete-change/${verificationToken}`,
      ),
      html: expect.stringContaining(
        `${process.env.SERVER_URL}/api/verify-email/complete-change/${verificationToken}`,
      ),
    });
  });

  it('should send an email with correct content for forgotPassword mode', async () => {
    const email = 'test@example.com';
    const verificationToken = 'testToken';
    const mode = 'forgotPassword';

    await sendMail(email, verificationToken, mode);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'パスワード再設定',
      text: expect.stringContaining(
        `${process.env.SERVER_URL}/api/user/reset-password/${verificationToken}`,
      ),
      html: expect.stringContaining(
        `${process.env.SERVER_URL}/api/user/reset-password/${verificationToken}`,
      ),
    });
  });
});