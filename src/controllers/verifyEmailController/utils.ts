import nodemailer from 'nodemailer';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { mailContent } from '../../config/mailContent';

export const sendMail = async (
  email: string,
  verificationToken: string,
  action: keyof typeof mailContent,
): Promise<void> => {
  const config = mailContent[action](verificationToken);

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
    console.error(error);
    throw new AppError(500, errors.EMAIL_SEND_FAILED);
  }
};
