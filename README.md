# VaqMan
Multiplayer PacMan game for all your friends and family.

## Reference
* [Coding Train Agar.io Tutorial](https://www.youtube.com/watch?v=ZjVyKXp9hec)
* [Agar.io Tutorial Src](https://github.com/CodingTrain/website/tree/master/CodingChallenges/CC_032.2_agario_sockets)
* [Socket - Get Started](https://socket.io/get-started/chat/)

## Plan
1. Make 1-player PacMan
2. Sync player data with server
3. Host two moving player in real time
4. Update Pellet/Power Pellet statuses
5. Update player score frequently with live leader board
6. Deploy on Heroku
7. Sit back, relax, and play the best unblocked game of all time

## Architecture
* package.json
* server.js
* Procfile
	* node server.js
* node_modules/
	* socket.io
  * express
* public/
	* index.html
	* scripts/
		* pacman.js
		* client.js
		* main.js
	* sounds/
		* waka.wav
		* eat.wav
		* active.wav
	* cgi-bin/
		* pacman.png
		* red.png
		* blue.png
		* pink.png
		* blue.png
		* scared.gif
		* active.gif
	* libraries/
		* p5.js
		* p5.sound.js
		* p5.gif.js
		* socket.js
		* ply.js
