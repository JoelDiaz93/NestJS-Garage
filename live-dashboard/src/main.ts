import { io, Socket } from 'socket.io-client';
import './style.css';

interface WorkOrderEvent {
  id?: string;
  number?: string;
  status?: string;
  updatedAt?: string;
}

let socket: Socket | undefined;
const token = document.querySelector<HTMLInputElement>('#token')!;
const button = document.querySelector<HTMLButtonElement>('#connect')!;
const status = document.querySelector('#status')!;
const events = document.querySelector('#events')!;
const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000/workshop';

button.addEventListener('click', () => {
  socket?.disconnect();
  status.textContent = 'connecting';
  socket = io(wsUrl, { auth: { token: token.value.trim() } });

  socket.on('connect', () => {
    status.textContent = 'online';
  });

  socket.on('connect_error', () => {
    status.textContent = 'connection error';
  });

  socket.on('disconnect', () => {
    status.textContent = 'offline';
  });

  socket.on('work-order.updated', (payload: WorkOrderEvent) => {
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${payload.number ?? payload.id ?? 'Work order'} · ${payload.status ?? 'updated'}`;
    const time = document.createElement('small');
    time.textContent = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString() : new Date().toLocaleString();
    li.append(title, time);
    events.prepend(li);
  });
});
