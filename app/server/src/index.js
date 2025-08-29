const path			= require('path');
const express		= require('express');
const http			= require('http');
const { Server }	= require('socket.io');
const helmet		= require('helmet');
const compression	= require('compression');
const cors			= require('cors');

const app		= express();
const server	= http.createServer(app);
const io		= new Server(server, {
	cors: {
		origin: process.env.CORS_ORIGIN || '*',
		methods: ['GET', 'POST']
	},
	// pingInterval/pingTimeout can be tuned
});

const PORT = process.env.PORT || 3000;


app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());


/**
 * @type { Map<string, { id: string, name: string, createdAt: number, users: Set<string> }> }
 */
const rooms = new Map();


function createRoom(id, name) {
	if (rooms.has(id))
		throw new Error('Room already exists');
	rooms.set(id, { id, name, createdAt: Date.now(), users: new Set() });
}

function deleteRoom(id) {
	if (!rooms.has(id))
		throw new Error('No such room');
	rooms.delete(id);
}

function listRooms() {
	return Array.from(rooms.values()).map(r =>({
		id: r.id,
		name: r.name,
		createdAt: r.createdAt,
		userCount: r.users.size
	}));
}



app.get('/api/rooms', (req, res) => {
	res.json(listRooms());
});

app.post('/api/rooms', (req, res) => {
	const { id, name } = req.body;
	if (!id || !name) return res.status(400).json({ error: 'id and name required' });
	try {
		createRoom(id, name);
		return res.status(201).json({ id, name });
	} catch (err) {
		return res.status(409).json({ error: err.message });
	}
});

app.delete('/api/rooms/:id', (req, res) => {
	const { id } = req.params;
	try {
		deleteRoom(id);
		return res.json({ ok: true });
	} catch (err) {
		return res.status(404).json({ error: err.message });
	}
});



const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
	res.sendFile(path.join(clientBuildPath, 'index.html'));
});


io.on('connection', (socket) => {
	console.log('socket connected', socket.id);

	socket.on('room:join', ({ roomId, username }, cb) => {
		const room = rooms.get(roomId);
		if (!room) return cb && cb({ error: 'Room not found' });

		socket.join(roomId);
		room.users.add(socket.id);

		// notify room
		io.to(roomId).emit('room:userlist', { users: Array.from(room.users) });
		socket.to(roomId).emit('message', { from: 'system', text: `${username || 'A user'} joined`, ts: Date.now() });

		cb && cb({ ok: true });
	});

	socket.on('room:leave', ({ roomId, username }, cb) => {
		const room = rooms.get(roomId);
		if (!room) return cb && cb({ error: 'Room not found' });

		socket.leave(roomId);
		room.users.delete(socket.id);
		io.to(roomId).emit('room:userlist', { users: Array.from(room.users) });
		socket.to(roomId).emit('message', { from: 'system', text: `${username || 'A user'} left`, ts: Date.now() });
		cb && cb({ ok: true });
	});

	socket.on('message', ({ roomId, username, text }, cb) => {
		if (!rooms.has(roomId)) return cb && cb({ error: 'Room not found' });
		const payload = { from: username || 'anonymous', text: String(text || ''), ts: Date.now() };
		io.to(roomId).emit('message', payload);
		cb && cb({ ok: true });
	});

	socket.on('disconnecting', () => {
		// remove socket from any rooms we track
		for (const roomId of socket.rooms) {
			if (rooms.has(roomId)) {
				rooms.get(roomId).users.delete(socket.id);
				io.to(roomId).emit('room:userlist', { users: Array.from(rooms.get(roomId).users) });
			}
		}
	});

	socket.on('disconnect', (reason) => {
		console.log('socket disconnected', socket.id, reason);
	});
});


server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
