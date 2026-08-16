import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ namespace: 'workshop' })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwt: JwtService, private readonly users: UsersService) {}

  async handleConnection(client: Socket) {
    const raw = client.handshake.auth?.token || client.handshake.headers.authorization;
    const token = typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '') : '';

    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      const user = await this.users.findById(payload.sub);
      if (!user.isActive) throw new Error('Inactive user');
      client.data.user = { id: user.id, roles: user.roles };
    } catch {
      client.disconnect(true);
    }
  }

  emitWorkOrderUpdated(payload: unknown) {
    this.server.emit('work-order.updated', payload);
  }
}
