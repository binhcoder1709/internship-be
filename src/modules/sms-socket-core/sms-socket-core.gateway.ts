import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/sms-socket'
})
export class SmsSocketCoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Lưu trữ tất cả các client đang kết nối
  private connectedClients: Map<string, Socket> = new Map();

  async handleConnection(client: Socket) {
    // Lưu client mới kết nối
    this.connectedClients.set(client.id, client);
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Xóa client khi ngắt kết nối
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  // Hàm helper để emit tin nhắn tới tất cả client
  async broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Hàm helper để emit tin nhắn tới một client cụ thể
  async sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Hàm helper để lấy danh sách client đang kết nối
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
