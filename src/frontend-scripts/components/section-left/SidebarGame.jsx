import React from 'react';
import {roleMap} from '../../../../iso/util.js';

export default class SidebarGame extends React.Component {
	constructor() {
		super();
		this.routeToGame = this.routeToGame.bind(this);
	}

	routeToGame() {
		this.props.socket.emit('getGameInfo', this.props.game.uid);
	}

	render() {
		const setClass = (role) => roleMap[role].team,
			renderRoles = (roles) => roles.map((role, i) => <div key={i} className={setClass(role)}>{roleMap[role].initial}</div>),
			{game} = this.props,
			gameClasses = () => {
				let classes = 'ui vertical segment';

				if (game.gameState.isStarted && !game.gameState.isCompleted) {
					classes += ' inprogress';
				}

				if (game.gameState.isCompleted) {
					classes += ' completed';
				}

				return classes;
			};

// todo-release take closer look at functionality re: negative ternairy @ line 44

		return (
			<div className={gameClasses()} data-uid={game.uid} onClick={this.routeToGame}>
				<div>
					<span className={game.kobk ? 'gamename kobk' : 'gamename'}>{game.name}</span>
					<span className="gamelength">{game.time}</span>
					<span className="seatedcount">{game.seatedCount ? game.seatedCount.toString() : ''}/7</span>
				</div>
				<div className="rolelist">
					<div>
						{renderRoles(game.roles.slice(0, 5))}
					</div>
					<div>
						{renderRoles(game.roles.slice(5, 10))}
					</div>
				</div>
			</div>
		);
	}
}

SidebarGame.propTypes = {
	key: React.PropTypes.number,
	game: React.PropTypes.object,
	socket: React.PropTypes.func
};