import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { chatRouter } from '../chat/infrastructure/routes/Routes';
import { auth } from './middleware/auth';

dotenv.config();

const port = process.env.PORT ?? 4001;

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

let arrUsers: string[] = [];
const defaultSession = 'defaultSession';

io.on('connection', async (socket) => {
  socket.broadcast.emit('wellcome', 'A user has connected!!!');
  socket.join(defaultSession);

  // const previousMessages = await messageModel.find({ chatId: defaultSession }).sort({ createdAt: 1 }).exec();
  // socket.emit('previousMessages', previousMessages);

  socket.on('disconnect', () => {
    console.log('an user has disconnected');
  });

  socket.on('addUser', (data) => {
    arrUsers.push(data);
    io.to(defaultSession).emit('newUser', arrUsers);
  });

  socket.on('deletedUser', (data) => {
    console.log(data);
    arrUsers = arrUsers.filter((value) => value != data);
    socket.to(defaultSession).emit('currentUsers', arrUsers);
  });

  socket.on('chat message', async (msg, user) => {
    
    io.to(defaultSession).emit('chat message', msg, user);
  });
});

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use('/', chatRouter);
app.use('/chat', auth, chatRouter);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
