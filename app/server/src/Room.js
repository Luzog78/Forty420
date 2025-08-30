import { User } from './User.js';

export class Room {
	/**
	 * Generate a new random UID.
	 *
	 * @param {number} length length of the UID (default: 5)
	 * @param {string} charset characters to use (default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
	 *
	 * @returns {string}
	 */
	static newUID(length = 5, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
		return Array.from({ length }, () =>
			charset[Math.floor(Math.random() * charset.length)]).join('');
	}


	/**
	 * @param {string|any} name
	 * @param {string} defaultName optional default name if input is invalid (default: 'A room')
	 *
	 * @returns {string}
	 */
	static normalizeName(name, defaultName = 'A room') {
		return String(name ?? defaultName).substring(0, 48).trim();
	}


	/**
	 * @param {number|string|any} maxUsers
	 * @param {number} max maximum allowed users (default: 999)
	 * @param {number} defaultMax default value if input is invalid (default: 999)
	 *
	 * @returns {number}
	 */
	static normalizeMaxUsers(maxUsers, max = 999, defaultMax = 999) {
		maxUsers = Number(maxUsers);
		if (isNaN(maxUsers) || maxUsers < 1)
			return defaultMax;
		if (maxUsers > max)
			return max;
		return maxUsers;
	}


	/**
	 * @param {import('./Server').Server} server
	 * @param {User|null} user
	 *
	 * @returns {Room|null}
	 */
	static getRoomFromUser(server, user) {
		if (!user || !user.rid)
			return null;
		if (!server.rooms.has(user.rid)) {
			user.rid = null;
			user.isHost = false;
			return null;
		}
		return server.rooms.get(user.rid);
	}


	/**
	 * @param {import('./Server').Server} server
	 * @param {{data?: {uid?: string}}} socket
	 *
	 * @returns {Room|null}
	 */
	static getRoomFromSocket(server, socket) {
		return Room.getRoomFromUser(server, User.getUserFromSocket(server, socket));
	}


	/**
	 * @param {string} id
	 * @param {string} name
	 * @param {import('crypto').UUID} host
	 * @param {number} maxUsers optional maximum number of users (default: 999)
	 */
	constructor(id, name, host, maxUsers = 999) {
		this.id = id;
		this.name = Room.normalizeName(name);
		this.host = host;
		this.maxUsers = Room.normalizeMaxUsers(maxUsers) + 1;  // +1 for host
		this.createdAt = Date.now();
		/**
		 * @type { Array<import('crypto').UUID> }
		 */
		this.users = new Array();
	}


	/**
	 * For each user in the room, call a function.
	 *
	 * @param {(user: User) => void} callback
	 * @param {Array<import('crypto').UUID|string|User>|import('crypto').UUID|string|User} except user(s) to exclude from callback
	 * @param {boolean} requireSocketConnected whether to only call the function for users with a connected socket (default: true)
	 *
	 * @returns {void}
	 */
	forEach(callback, except = [], requireSocketConnected = true) {
		except = Array(except).flat().filter(u => !!u)
			.map(u => (typeof u === 'string') ? u : u.id);
		this.users
			.filter(uid => !except.includes(uid))
			.map(uid => this.server.users.get(uid))
			.filter(u => !!u && (!requireSocketConnected || (!!u.socket && u.socket.connected)))
			.forEach(u => callback(u));
	}


	/**
	 * Broadcast an event to all users in the room except some (if any).
	 *
	 * @see {@link Socket.emit}
	 *
	 * @param {Array<import('crypto').UUID|string|User>|import('crypto').UUID|string|User} except user(s) to exclude from broadcast
	 * @param {string} event event name
	 * @param  {...any} args event arguments
	 *
	 * @returns {void}
	 */
	broadcast(except, event, ...args) {
		this.forEach(u => u.socket.emit(event, ...args), except);
	}


	/**
	 * Kick all users from the room by sending them a `room:kicked`
	 *  event and calling {@link User.quit}.
	 * Then clear the user list and remove the room from the server.
	 *
	 * @param {import('./Server').Server} server
	 * @param {string} reason optional reason for kicking (default: 'room closed')
	 *
	 * @returns {void}
	 */
	delete(server, reason = 'room closed') {
		this.forEach(user => {
			user.socket?.emit('x:room:kicked', { reason });
			user.rid = null;
			user.quit(server);
		}, [], false);
		this.users.clear();
		server.rooms.delete(this.id);
	}


	/**
	 * Add a new user to the room.
	 * Notify all other users in the room that this user has joined (event: `room:join`).
	 *
	 * @see {@link Socket.emit}
	 *
	 * @param {import('./Server').Server} server
	 * @param {User} user
	 *
	 * @throws {Error} if user is already in the room
	 * @throws {Error} if user is in another room
	 *
	 * @returns {void}
	 */
	join(server, user) {
		if (this.users.includes(user.id))
			throw new Error('User already in room');
		if (user.rid) {
			if (user.rid !== this.id)
				throw new Error('User already in another room');
		} else
			user.rid = this.id;
		this.broadcast([], 'x:room:join', { user: { id: user.id, name: user.name } });
		this.users.push(user.id);
	}


	/**
	 * Make a user leave the room.
	 * Notify all other users in the room that this user has left (event: `room:leave`).
	 * Then, make the user quit the server.
	 *
	 * @see {@link Socket.emit}
	 * @see {@link User.quit}
	 *
	 * @param {import('./Server').Server} server
	 * @param {User|import('crypto').UUID} user
	 * @param {string} reason optional reason for leaving (default: 'left')
	 *
	 * @throws {Error} if user is not in the room
	 *
	 * @returns {void}
	 */
	leave(server, user, reason = 'left') {
		const uid = (typeof user === 'string') ? user : user.id;
		if (!this.users.includes(uid))
			throw new Error('User not in room');
		if (this.host === uid) {
			this.delete(server, 'host left');
			return;
		}
		this.users = this.users.filter(u => u !== uid);
		const _user = server.users.get(uid);
		this.broadcast([], 'x:room:leave', { user: _user ?? { id: uid }, reason });
		if (_user) {
			_user.rid = null;
			_user.quit(server);
		}
	}


	/**
	 * Kick a user from the room by sending them a `room:kicked` event.
	 * Then call {@link Room.leave} to remove them from the room,
	 *  notify other users, and make them quit the server.
	 *
	 * @param {import('./Server').Server} server
	 * @param {User|import('crypto').UUID} user
	 * @param {string} reason optional reason for kicking (default: 'kicked')
	 *
	 * @throws {Error} if user is not in the room
	 *
	 * @returns {void}
	 */
	kick(server, user, reason = 'kicked') {
		const uid = (typeof user === 'string') ? user : user.id;
		if (!this.users.includes(uid))
			throw new Error('User not in room');
		const _user = server.users.get(uid);
		if (_user) {
			_user.socket?.emit('x:room:kicked', { reason });
		}
		this.leave(server, uid, reason);
	}


	/**
	 * Disconnect a user from the room by sending them a `user:disconnected` event.
	 * If the user is connected, call {@link User.disconnect} to disconnect them
	 *  (it will recall this function to notify other users).
	 *
	 * @param {import('./Server').Server} server
	 * @param {User|import('crypto').UUID} user
	 * @param {string} reason optional reason for disconnection (default: 'disconnected')
	 *
	 * @throws {Error} if user is not in the room
	 *
	 * @returns {void}
	 */
	disconnect(server, user, reason = 'disconnected') {
		const uid = (typeof user === 'string') ? user : user.id;
		if (!this.users.includes(uid))
			throw new Error('User not in room');
		const _user = server.users.get(uid);
		if (_user?.connected) {
			_user.disconnect(server, reason);
			return;
		}
		this.broadcast([uid], 'x:user:disconnected', { uid: uid, reason });
	}


	/**
	 * Reconnect a user to the room by sending them a `user:reconnected` event.
	 * If the user is not connected, call {@link User.reconnect} to reconnect them
	 *  (it will recall this function to notify other users).
	 *
	 * @param {import('./Server').Server} server
	 * @param {User|import('crypto').UUID} user
	 *
	 * @throws {Error} if user is not in the room
	 *
	 * @returns {void}
	 */
	reconnect(server, user) {
		const uid = (typeof user === 'string') ? user : user.id;
		if (!this.users.includes(uid))
			throw new Error('User not in room');
		const _user = server.users.get(uid);
		if (!_user?.connected) {
			_user.reconnect(server);
			return;
		}
		this.broadcast([uid], 'x:user:reconnected', { uid: uid });
	}
}
