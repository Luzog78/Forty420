import io from 'socket.io-client';

export class Manager {
	/**
	 * @type {import('socket.io-client').Socket|null}
	 */
	static socket = null;
	static attempts = 0;

	static connected() {
		return this.socket && this.socket.connected;
	}

	static connect() {
		if (this.connected())
			return;
		const url = new URL(window.location);
		url.port = "5000";
		console.log('===', 'Connecting to', url.toString());
		this.socket = io(url.toString(), {
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 3000,
			autoConnect: true,
			forceNew: true,
			transports: ['websocket'],
		});
		this.setupEvents();
	}

	static setupEvents() {
		Manager.socket.on('connect', () => {
			console.log('===', 'Connected to server with id', Manager.socket.id);
		});

		Manager.socket.on('disconnect', (reason) => {
			console.log('===', 'Disconnected from server:', reason);
		});

		Manager.socket.on('connect_error', (err) => {
			console.error('!!!', 'Connection error:', err.message);
			this.disconnect();
		});

		Manager.socket.on('reconnect_attempt', (attempt) => {
			console.log('===', 'Reconnection attempt', attempt);
		});

		Manager.socket.on('reconnect', (attempt) => {
			console.log('===', 'Reconnected to server after', attempt, 'attempts');
		});

		Manager.socket.on('reconnect_error', (err) => {
			console.error('!!!', 'Reconnection error:', err.message);
		});

		Manager.socket.on('reconnect_failed', () => {
			console.error('!!!', 'Reconnection failed');
			this.disconnect();
		});

		Manager.socket.on('x:room:join', ({ ...args }, cb) => {
			console.log('===', 'x:room:join', args);
			cb && cb({ ok: true });
		});

		Manager.socket.on('x:room:leave', ({ ...args }, cb) => {
			console.log('===', 'x:room:leave', args);
			cb && cb({ ok: true });
		});

		Manager.socket.on('x:room:disconnected', ({ ...args }, cb) => {
			console.log('===', 'x:room:disconnected', args);
			cb && cb({ ok: true });
		});

		Manager.socket.on('x:room:reconnected', ({ ...args }, cb) => {
			console.log('===', 'x:room:reconnected', args);
			cb && cb({ ok: true });
		});

		Manager.socket.on('x:room:kicked', ({ ...args }, cb) => {
			console.log('===', 'x:room:kicked', args);
			cb && cb({ ok: true });
		});

		Manager.socket.on('x:user:rename', ({ ...args }, cb) => {
			console.log('===', 'x:user:rename', args);
			cb && cb({ ok: true });
		});

	}

	static removeEvents() {
		if (!this.socket)
			return;
		this.socket.off('connect');
		this.socket.off('disconnect');
		this.socket.off('connect_error');
		this.socket.off('reconnect_attempt');
		this.socket.off('reconnect');
		this.socket.off('reconnect_error');
		this.socket.off('reconnect_failed');
		this.socket.off('x:room:join');
		this.socket.off('x:room:leave');
		this.socket.off('x:room:disconnected');
		this.socket.off('x:room:reconnected');
		this.socket.off('x:room:kicked');
		this.socket.off('x:user:rename');
	}

	static disconnect() {
		if (!this.socket)
			return;
		this.removeEvents();
		if (this.socket.connected)
			this.socket.disconnect();
		this.socket = null;
	}
}
