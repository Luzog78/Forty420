import path from 'path';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import crypto from 'crypto';

import { fileURLToPath } from 'url';

import { Room } from './Room.js';
import { User } from './User.js';


export class Server {
	constructor() {
		this.app		= express();
		this.server		= http.createServer(this.app);
		this.io			= new SocketIOServer(this.server, {
			cors: {
				origin: process.env.CORS_ORIGIN || '*',
				methods: ['GET', 'POST']
			},
			// pingInterval/pingTimeout can be tuned
		});

		this.PORT = process.env.PORT || 3000;


		/**
		 * @type { Map<import('crypto').UUID, User> }
		 */
		this.users = new Map();

		/**
		 * @type { Map<string, Room> }
		 */
		this.rooms = new Map();


		this.setupLibsMiddleware();
		this.setupAPIRoutes();
		this.setupStaticFiles();

		this.io.on('connection', (socket) => this.setupIOConnection(socket));
	}


	listen() {
		this.server.listen(this.PORT, () => {
			console.log(`=== Server listening on port ${this.PORT}`);
		});
	}


	setupLibsMiddleware() {
		this.app.use(helmet());
		this.app.use(cors());
		this.app.use(compression());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}


	setupStaticFiles() {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
		this.app.use(express.static(clientBuildPath));
		this.app.get('*', (req, res) => {
			res.sendFile(path.join(clientBuildPath, 'index.html'));
		});
	}


	setupAPIRoutes() {
		this.app.get('/api/rooms', (req, res) => {
			res.json(this.listRooms().map(r =>({
				id: r.id,
				name: r.name,
				createdAt: r.createdAt,
				userCount: r.users.size
			})));
		});


		this.app.post('/api/rooms', (req, res) => {
			const { id, name } = req.body;
			try {
				this.addRoom(new Room(id, name));
				res.status(201).json({ message: 'Room created' });
			} catch (err) {
				res.status(400).json({ error: err.message });
			}
		});


		this.app.delete('/api/rooms/:id', (req, res) => {
			const { id } = req.params;
			try {
				this.deleteRoom(id);
				res.status(200).json({ message: 'Room deleted' });
			} catch (err) {
				res.status(400).json({ error: err.message });
			}
		});
	}


	/**
	 * @param {import('socket.io').Socket} socket
	 */
	setupIOConnection(socket) {
		const user = User.getUserFromSocket(this, socket.handshake);
		const room = Room.getRoomFromUser(this, user);

		if (user) {
			socket.data.uid = user.id;
			user.socket = socket;
			user.reconnect();
		}

		console.log('[+]', `<${socket.id}>`, user, room);

		socket.on('x:room:create', ({ roomName, maxUsers }, cb) => {
			if(Room.getRoomFromSocket(this, socket))
				return cb && cb({ error: 'Already in a room' });

			let newRoomId;
			let i = 0;
			do {
				newRoomId = Room.newUID();
				i++;
				if (i > 1000000)
					return cb && cb({ error: 'Failed to generate unique room ID' });
			} while (this.rooms.has(newRoomId));

			const user = new User(crypto.randomUUID(), null, socket, newRoomId, true);
			const room = new Room(newRoomId, roomName, user.id, maxUsers);
			this.addUser(user);
			this.addRoom(room);

			cb && cb({ ok: true, uid: user.id, rid: room.id });
		});

		socket.on('x:room:join', ({ rid, userName }, cb) => {
			if(Room.getRoomFromSocket(this, socket))
				return cb && cb({ error: 'Already in a room' });

			if (!this.rooms.has(rid))
				return cb && cb({ error: 'No such room' });

			const room = this.rooms.get(rid);
			if (room.users.size >= room.maxUsers)
				return cb && cb({ error: 'Room is full' });

			const user = new User(crypto.randomUUID(), userName ?? null, socket, rid);
			this.addUser(user);

			room.join(this, user);
			cb && cb({ ok: true });
		});

		socket.on('x:room:leave', ({ reason }, cb) => {
			const user = User.getUserFromSocket(this, socket);
			const room = Room.getRoomFromUser(this, user);
			if (!room)
				return cb && cb({ error: 'Not in a room' });

			if (reason)
				room.leave(this, user, reason);
			else
				room.leave(this, user);
			cb && cb({ ok: true });
		});

		socket.on('x:user:rename', ({ userName }, cb) => {
			const user = User.getUserFromSocket(this, socket);
			if (!user)
				return cb && cb({ error: 'No such user' });

			user.name = User.normalizeName(userName);

			const room = Room.getRoomFromUser(this, user);
			if (room)
				room.broadcast([user], 'x:user:rename', { uid: user.id, name: user.name });
			cb && cb({ ok: true, name: user.name });
		});

		socket.on('disconnecting', (reason) => {
			const user = User.getUserFromSocket(this, socket);
			if (!user)
				return;

			user.disconnect(this, reason);
		});

		socket.on('disconnect', (reason) => {
			const user = User.getUserFromSocket(this, socket);
			if (user)
				user.socket = null;

			console.log('[-]', `<${socket.id}>`, user, reason);
		});
	}


	/**
	 * Add a new room to the server list.
	 *
	 * @param {Room} room
	 *
	 * @throws {Error} if room with same id already exists
	 *
	 * @returns {void}
	 */
	addRoom(room) {
		if (this.rooms.has(room.id))
			throw new Error('Room already exists');
		this.rooms.set(room.id, room);
	}


	/**
	 * Delete a room from the server list.
	 * NOTE: kicks all users from the room.
	 *
	 * @see {@link Room.delete}
	 *
	 * @param {Room|string} room
	 *
	 * @throws {Error} if no such room
	 *
	 * @returns {void}
	 */
	deleteRoom(room) {
		const rid = (typeof room === 'string') ? room : room.id;
		if (!this.rooms.has(rid))
			throw new Error('No such room');
		const _room = this.rooms.get(rid);
		_room.delete(this);
	}


	/**
	 * List all rooms on the server.
	 *
	 * @returns {Array<Room>}
	 */
	listRooms() {
		return Array.from(rooms.values())
	}


	/**
	 * Add a new user to the server list.
	 *
	 * @param {User} user
	 *
	 * @throws {Error} if user with same id already exists
	 *
	 * @returns {void}
	 */
	addUser(user) {
		if (this.users.has(user.id))
			throw new Error('User already exists');
		this.users.set(user.id, user);
	}


	/**
	 * Delete a user from the server list.
	 * NOTE: removes user from any room they are in.
	 *
	 * @see {@link User.quit}
	 *
	 * @param {User|import('crypto').UUID} user
	 *
	 * @throws {Error} if no such user
	 *
	 * @returns {void}
	 */
	deleteUser(user) {
		const uid = (typeof user === 'string') ? user : user.id;
		if (!this.users.has(uid))
			throw new Error('No such user');
		const _user = this.users.get(uid);
		_user.quit(this);
	}


	/**
	 * List all users on the server.
	 *
	 * @returns {Array<User>}
	 */
	listUsers() {
		return Array.from(this.users.values());
	}
}
