import nodemailer from 'nodemailer';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export const mailContent = {
  registerUser: (verificationToken: string): EmailContent => {
    // TODO: ユーザー登録用リンクを設定
    const link = `${process.env.SERVER_URL}/api/user/register?token=${verificationToken}`;

    return {
      subject: 'メールアドレスの確認',
      text: `以下のリンクをクリックしてメールアドレスを確認してください: ${link}`,
      html: `<p>以下のリンクをクリックしてメールアドレスを確認してください:</p><a href="${link}">確認リンク</a>`,
    };
  },
  changeEmail: (verificationToken: string): EmailContent => {
    // TODO: メールアドレス変更完了用リンクを設定
    const link = `${process.env.SERVER_URL}/api/verify-email/complete-change/${verificationToken}`;

    return {
      subject: 'メールアドレス変更',
      text: `以下のリンクをクリックしてパスワードを再設定してください: ${link}`,
      html: `<p>以下のリンクをクリックしてパスワードを再設定してください:</p><a href="${link}">確認リンク</a>`,
    };
  },
  forgotPassword: (verificationToken: string): EmailContent => {
    // TODO: パスワード再設定用リンクを設定
    const link = `${process.env.SERVER_URL}/api/user/reset-password/${verificationToken}`;

    return {
      subject: 'パスワード再設定',
      text: `以下のリンクをクリックしてパスワードを再設定してください: ${link}`,
      html: `<p>以下のリンクをクリックしてパスワードを再設定してください:</p><a href="${link}">確認リンク</a>`,
    };
  },
};

export const sendMail = async (
  email: string,
  verificationToken: string,
  action: keyof typeof mailContent,
): Promise<void> => {
  const config: EmailContent = mailContent[action](verificationToken);

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    ...config,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError(500, errors.EMAIL_SEND_FAILED);
  }
};
