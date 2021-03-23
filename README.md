# MapWalk

the map do be walkin' doe

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