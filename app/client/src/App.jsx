import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io();

function uid() {
	return Math.random().toString(36).slice(2, 9);
}

export default function App() {
	const [rooms, setRooms] = useState([]);
	const [roomId, setRoomId] = useState('');
	const [username, setUsername] = useState('User-' + uid());
	const [messages, setMessages] = useState([]);
	const [text, setText] = useState('');
	const messagesRef = useRef(null);

	useEffect(() => {
		fetchRooms();

		socket.on('message', (m) => setMessages(prev => [...prev, m]));
		socket.on('room:userlist', (data) => {
			// optionally handle user list
			console.log('userlist', data);
		});

		return () => {
			socket.off('message');
			socket.off('room:userlist');
		};
	}, []);

	useEffect(() => {
		if (messagesRef.current)
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
	}, [messages]);

	async function fetchRooms() {
		const res = await axios.get('/api/rooms');
		setRooms(res.data);
	}

	async function handleCreateRoom() {
		const id = prompt('Room id (no spaces):', 'room-' + uid());
		const name = prompt('Room name:', 'A room');
		if (!id || !name)
			return;
		try {
			await axios.post('/api/rooms', { id, name });
			fetchRooms();
		} catch (err) {
			alert(err.response?.data?.error || err.message);
		}
	}

	async function handleDeleteRoom(rid) {
		if (!confirm('Delete room ' + rid + '?')) return;
		try {
			await axios.delete('/api/rooms/' + rid);
			if (roomId === rid)
				setRoomId('');
			fetchRooms();
		} catch (err) {
			alert(err.response?.data?.error || err.message);
		}
	}

	function joinRoom(rid) {
		socket.emit('room:join', { roomId: rid, username }, (res) => {
			if (res?.error) return alert(res.error);
			setRoomId(rid);
			setMessages([]);
		});
	}

	function leaveRoom() {
		socket.emit('room:leave', { roomId, username }, (res) => {
			setRoomId('');
			setMessages([]);
		});
	}

	function sendMessage(e) {
		e?.preventDefault();
		if (!text.trim() || !roomId) return;
		socket.emit('message', { roomId, username, text }, (res) => {
			if (res?.error) return alert(res.error);
			setText('');
		});
	}

	return (
		<div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: '24px auto' }}>
			<h1>Chat App</h1>
			<div style={{ marginBottom: 12 }}>
				<strong>You:</strong>
				<input value={username} onChange={e => setUsername(e.target.value)} style={{ marginLeft: 8 }} />
				<button onClick={handleCreateRoom} style={{ marginLeft: 12 }}>Create room</button>
				<button onClick={fetchRooms} style={{ marginLeft: 8 }}>Refresh rooms</button>
			</div>

			<div style={{ display: 'flex', gap: 20 }}>
				<div style={{ width: 260 }}>
					<h3>Rooms</h3>
					<ul>
						{rooms.map(r => (
							<li key={r.id} style={{ marginBottom: 8 }}>
								<strong>{r.name}</strong> <small>({r.userCount} here)</small>
								<div>
									<button onClick={() => joinRoom(r.id)} disabled={roomId === r.id}>Join</button>
									<button onClick={() => handleDeleteRoom(r.id)} style={{ marginLeft: 8 }}>Delete</button>
								</div>
							</li>
						))}
					</ul>
				</div>

				<div style={{ flex: 1 }}>
					<h3>Room: {roomId || '— not joined —'}</h3>
					{roomId ? <button onClick={leaveRoom}>Leave</button> : null}

					<div ref={messagesRef} style={{ border: '1px solid #ccc', height: 320, padding: 12, overflowY: 'auto', marginTop: 12 }}>
						{messages.map((m, i) => (
							<div key={i} style={{ marginBottom: 8 }}>
								<strong>{m.from}</strong>: {m.text} <small style={{ color: '#777' }}>— {new Date(m.ts).toLocaleTimeString()}</small>
							</div>
						))}
					</div>

					<form onSubmit={sendMessage} style={{ marginTop: 12 }}>
						<input value={text} onChange={e => setText(e.target.value)} style={{ width: '70%' }} disabled={!roomId} />
						<button type="submit" style={{ marginLeft: 8 }} disabled={!roomId}>Send</button>
					</form>
				</div>
			</div>
		</div>
	);
}
