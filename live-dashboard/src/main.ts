import { io, Socket } from 'socket.io-client'; import './style.css';
let socket: Socket | undefined;
const token = document.querySelector<HTMLInputElement>('#token')!; const button=document.querySelector<HTMLButtonElement>('#connect')!; const status=document.querySelector('#status')!; const events=document.querySelector('#events')!;
button.addEventListener('click',()=>{ socket?.disconnect(); socket=io('http://localhost:3000/workshop',{auth:{token:token.value.trim()}}); socket.on('connect',()=>status.textContent='online'); socket.on('disconnect',()=>status.textContent='offline'); socket.on('work-order.updated',(payload)=>{const li=document.createElement('li');li.textContent=JSON.stringify(payload);events.prepend(li);}); });
