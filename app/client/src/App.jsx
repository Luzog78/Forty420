import React, { useEffect, useState, useRef } from 'react';
import { Manager } from './Manager';

function uid() {
	return Math.random().toString(36).slice(2, 9);
}

export function App() {
	const [username, setUsername] = useState('User-' + uid());

	useEffect(() => {
		Manager.connect();

		return () => {
			Manager.disconnect();
		};
	}, []);

	return (
		<div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: '24px auto' }}>
			<h1>App</h1>
			<div style={{ marginBottom: 12 }}>
				<strong>You: {username}</strong>
				<input value={username} onChange={e => setUsername(e.target.value)} style={{ marginLeft: 8 }} />
				<button onClick={() => console.log('Click-1')} style={{ marginLeft: 12 }}>Create room</button>
				<button onClick={() => console.log('Click-2')} style={{ marginLeft: 8 }}>Refresh rooms</button>
			</div>
		</div>
	);
}
