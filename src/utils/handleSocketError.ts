import { Socket } from 'socket.io';

export const handleSocketError = (socket: Socket, message: string): void => {
  socket.emit('connect_error', { message }); // エラーメッセージを送信
  socket.disconnect(); // クライアントを切断
};
