# MapWalk

the map do be walkin' doe

## How to run

To run the server, run `npm run dev` in the `server/` directory.

To build the client, run `npm run build` in the `client/` directory.

The game is also playable on https://mapwalk.tk

## Just some notes, so I can keep track of things

### Socket events

#### Server lobby events (Clientside)

* `ServerLobbyJoined : { lobbyID: string, players: PlayerData[] }` - The lobby connection is fully established.
* `ServerLobbyNewPlayer : { player: PlayerData }` - A new player establishes a connection to the lobby
* `ServerLobbyChangeColor : { color: string, socketID: string }` - A player changes their color
* `ServerLobbyKick : { socketID: string }` - The player identified by `socketID` gets kicked 
* `ServerLobbyKicked : void` - The receiving player gets kicked
* `ServerLobbyMakeHost : { socketID: string }` - A new host identified by `socketID` has been selected
* `ServerLobbyChatMessage : { authorSocketID: string, username: string, content: string }` - Someone sends a chat message
* `ServerLobbyStartGame : { settings: GameSettings, objects: MapObjectData[], playerCoords: Record<string, L.LatLng>, playerOrder: string[], playerSettings: PlayerData[] }` - The host starts the game
* `ServerLobbySettingsChanged : { settings: GameSettings }` - Game settings have been changed by the host
* `ServerLobbyUserDisconnected : { socketID: string }` - A user disconnected

#### WebRTC signaling

* `P2PAddPeer`
* `P2PIceCandidate`
* `P2PSessionDesc`

#### Other

* `connect`
* `ChatbotVerifyAnswerResponse`
* `disconnect`

### GameEvents

* `PlayerMove`
* `PlayerRest`
* `NextTurn`
* `QuestionAnswer`
* `GameState`
* `GameEnd`
* `RestaurantVisited`
* `PlayerHungry`
