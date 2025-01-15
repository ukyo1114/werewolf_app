import User from '../../src/models/userModel';

describe('User Model Test', () => {
  it('ユーザー登録に成功する', async () => {
    const userData = {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'securepassword',
    };

    const user = await User.create(userData);

    expect(user.userName).toBe(userData.userName);
    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // パスワードはハッシュ化されている
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('必須項目が未入力の場合、ユーザーの登録に失敗する', async () => {
    const invalidData = {};

    await expect(User.create(invalidData)).rejects.toThrow();
  });

  it('メールアドレスの検証が実行されること', async () => {
    const invalidEmailData = {
      email: 'invalid-email',
      password: 'securepassword',
    };

    await expect(User.create(invalidEmailData)).rejects.toThrow();
  });
});
