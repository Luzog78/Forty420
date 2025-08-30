export class User {
	/**
	 * @param {string|any} name
	 * @param {string} defaultName optional default name if input is invalid (default: 'Guest')
	 *
	 * @returns {string}
	 */
	static normalizeName(name, defaultName = 'Guest') {
		return String(name ?? defaultName).substring(0, 24).trim();
	}


	/**
	 * @param {import('./Server').Server} server
	 * @param {{data?: {uid?: string}}} socket
	 *
	 * @returns {User|null}
	 */
	static getUserFromSocket(server, socket) {
		if (!socket.data?.uid || !server.users.has(socket.data.uid))
			return null;
		return server.users.get(socket.data.uid);
	}


	/**
	 * @param {import('crypto').UUID} id
	 * @param {string|null} name
	 * @param {import('socket.io').Socket|null} socket
	 * @param {string|null} rid optional room id to join
	 * @param {boolean} isHost whether the user is the host of the room (default: false)
	 */
	constructor(id, name, socket, rid = null, isHost = false) {
		this.id = id;
		this.name = User.normalizeName(name);
		this.socket = socket;
		if (this.socket)
			this.socket.data.uid = this.id;

		this.rid = rid;
		this.isHost = isHost;

		this.connected = true;
		this.createdAt = Date.now();
	}


	/**
	 * Leave the current room, if any (the room will call {@link User.quit}
	 *  a second time once the user is removed from it).
	 * If not, delete the user from the server.
	 *
	 * @see {@link Room.leave}
	 * @see {@link Server.deleteUser}
	 *
	 * @param {import('./Server').Server} server
	 *
	 * @returns {void}
	 */
	quit(server) {
		if (this.rid && server.rooms.has(this.rid)) {
			const room = server.rooms.get(this.rid);
			room.leave(server, this);
			return;
		}
		this.rid = null;
		this.isHost = false;
		server.users.delete(this.id);
	}


	/**
	 * Disconnect the user if connected (sets {@link User.connected} to false).
	 * Then call {@link Room.disconnect} if the user is in a room.
	 *
	 * @param {import('./Server').Server} server
	 * @param {string} reason optional reason for disconnection (default: 'transport close')
	 *
	 * @returns {void}
	 */
	disconnect(server, reason = 'transport close') {
		if (!this.connected)
			return;
		this.connected = false;
		if (this.rid && server.rooms.has(this.rid)) {
			const room = server.rooms.get(this.rid);
			room.disconnect(server, this, reason);
		}
	}


	/**
	 * Reconnect the user if disconnected (sets {@link User.connected} to true).
	 * If the user is in a room, call {@link Room.reconnect} to notify other users.
	 *
	 * @param {import('./Server').Server} server
	 *
	 * @returns {void}
	 */
	reconnect(server) {
		if (this.connected)
			return;
		this.connected = true;
		if (this.rid && server.rooms.has(this.rid)) {
			const room = server.rooms.get(this.rid);
			room.reconnect(server, this);
		}
	}
}
