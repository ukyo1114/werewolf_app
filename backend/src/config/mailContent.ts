interface IEmailContent {
  subject: string;
  text: string;
  html: string;
}

export const mailContent = {
  registerUser: (verificationToken: string): IEmailContent => {
    // TODO: ユーザー登録用リンクを設定
    const link = `${process.env.SERVER_URL}/api/user/register/${verificationToken}`;

    return {
      subject: 'メールアドレスの確認',
      text: `以下のリンクをクリックしてメールアドレスを確認してください: ${link}`,
      html: `<p>以下のリンクをクリックしてメールアドレスを確認してください:</p><a href="${link}">確認リンク</a>`,
    };
  },
  changeEmail: (verificationToken: string): IEmailContent => {
    // TODO: メールアドレス変更完了用リンクを設定
    const link = `${process.env.SERVER_URL}/api/user/email/${verificationToken}`;

    return {
      subject: 'メールアドレス変更',
      text: `以下のリンクをクリックしてパスワードを再設定してください: ${link}`,
      html: `<p>以下のリンクをクリックしてパスワードを再設定してください:</p><a href="${link}">確認リンク</a>`,
    };
  },
  forgotPassword: (verificationToken: string): IEmailContent => {
    // TODO: パスワード再設定用リンクを設定
    const link = `${process.env.SERVER_URL}/api/user/reset-password/${verificationToken}`;

    return {
      subject: 'パスワード再設定',
      text: `以下のリンクをクリックしてパスワードを再設定してください: ${link}`,
      html: `<p>以下のリンクをクリックしてパスワードを再設定してください:</p><a href="${link}">確認リンク</a>`,
    };
  },
};
