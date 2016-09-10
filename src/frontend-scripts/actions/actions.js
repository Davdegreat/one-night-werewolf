export const UPDATE_USER = 'UPDATE_USER';

export function updateUser(user) {
	return {
		type: UPDATE_USER,
		user
	}
}

export const UPDATE_MIDSECTION = 'UPDATE_MIDSECTION';

export function updateMidsection(midSection) {
	return {
		type: UPDATE_MIDSECTION,
		midSection
	}
}

export const UPDATE_GAMELIST = 'UPDATE_GAMELIST';

export function updateGameList(gameList) {
	return {
		type: UPDATE_GAMELIST,
		gameList
	}
}

export const UPDATE_GAMEINFO = 'UPDATE_GAMEINFO';

export function updateGameInfo(gameInfo) {
	return {
		type: UPDATE_GAMEINFO,
		gameInfo
	}
}

export const UPDATE_USERLIST = 'UPDATE_USERLIST';

export function updateUserList(userList) {
	return {
		type: UPDATE_USERLIST,
		userList
	}
}

export const UPDATE_EXPANDOINFO = 'UPDATE_EXPANDOINFO';

export function updateExpandoInfo(info) {
	return {
		type: UPDATE_EXPANDOINFO,
		info
	}
}

export const UPDATE_CLICKEDGAMEROLE = 'UPDATE_CLICKEDGAMEROLE';

export function updateClickedGamerole(info) {
	return {
		type: UPDATE_CLICKEDGAMEROLE,
		info
	}
}

export const UPDATE_CLICKEDPLAYER = 'UPDATE_CLICKEDPLAYER';

export function updateClickedPlayer(info) {
	return {
		type: UPDATE_CLICKEDPLAYER,
		info
	}
}

export const UPDATE_GENERALCHATS = 'UPDATE_GENERALCHATS';

export function updateGeneralChats(info) {
	return {
		type: UPDATE_GENERALCHATS,
		info
	}
}