'use strict';

import React from 'react';
import $ from 'jquery';
import _ from 'lodash';
import { roleList, roleMap } from '../../../../iso/util';

export default class Gamechat extends React.Component {
	constructor() {
		this.state = {
			chatFilter: 'All',
			lock: false,
			hotkey: 'init'
		};
	}

	componentDidMount() {
		this.scrollChats();
	}

	componentDidUpdate(prevProps) {
		let $input = $(this.refs.gameChatInput);

		this.scrollChats();

		if (prevProps && prevProps.selectedGamerole.random !== this.props.selectedGamerole.random && this.props.selectedGamerole.role) {
			$input.val(`${$input.val()}${this.props.selectedGamerole.role}`).next().removeClass('disabled');
		}

		if (prevProps && prevProps.selectedPlayer.random !== this.props.selectedPlayer.random && this.props.selectedPlayer.playerName.length) {
			if ($input.val() === 'I think that ') {
				$input.val(`${$input.val()}${this.props.selectedPlayer.playerName} is a `).next().removeClass('disabled');				
			} else {
				$input.val(`${$input.val()}${this.props.selectedPlayer.playerName}`).next().removeClass('disabled');
			}
		}
	}	

	displayHotkeys() {
		let textLeft, textRight;

		switch (this.state.hotkey) {   // todo-release expand this functionality to include nightaction events
			case 'init':
				textLeft = 'I claim..';
				textRight = 'I think..';
				break;
		}

		return (
			<div className="hotkey-container app-hidden">
				<div className="hotkey-left" onClick={this.handleLeftHotkeyClick.bind(this)}>
					{textLeft}
				</div>
				<div className="hotkey-right" onClick={this.handleRightHotkeyClick.bind(this)}>
					{textRight}
				</div>
			</div>
		);
	}

	handleLeftHotkeyClick(e) {
		let keyText = $(e.currentTarget).text(),
			$input = $(e.currentTarget).parent().parent().next().find('input');

		switch (keyText) {
			case 'I claim..':
				$input.val('I claim to be the ');
				this.props.roleState('notify');
				setTimeout(() => {
					this.props.roleState('');
				}, 1000);
				break;
		}
	}

	handleRightHotkeyClick(e) {
		let keyText = $(e.currentTarget).text(),
			$input = $(e.currentTarget).parent().parent().next().find('input');

		switch (keyText) {
			case 'I think..':
				$input.val('I think that ');
				break;
		}
	}

	handleChatClearClick(e) {
		$(e.currentTarget).addClass('app-hidden').prev().find('input').val('');
	}

	clickExpand(e) {
		let $icon = $(e.currentTarget);

		$icon.toggleClass('expand').toggleClass('compress');
		$icon.next().toggleClass('app-hidden');
	}

	handleKeyup(e) {
		let $input = $(e.currentTarget),
			inputValue = $input.val(),
			$button = $input.next(),
			$clearIcon = $input.parent().next();

		if (inputValue.length) {
			$button.removeClass('disabled');  // todo-release get this jquery nonsense out of here but I'm too lazy and there's other stuff to do
			$clearIcon.removeClass('app-hidden');
		} else {
			$button.addClass('disabled');
			$clearIcon.addClass('app-hidden');
		}
	}

	handleSubmit(e) {
		let input = $(e.currentTarget).find('input')[0],
			$button = $(e.currentTarget).find('button'),
			$clearIcon = $button.parent().next(),
			{ seatNumber } = this.props.userInfo,
			{ gameInfo, userInfo } = this.props;

		e.preventDefault();

		if (input.value) {
			let chat = {
				userName: this.props.userInfo.userName,
				chat: input.value,
				gameChat: false,
				uid: gameInfo.uid,
				inProgress: gameInfo.inProgress
			}

			if (gameInfo.gameState.isStarted && !gameInfo.gameState.isCompleted && userInfo.seatNumber) {
				let roles = _.uniq(gameInfo.roles),
					roleRegexes = roles.map((role) => {
						return new RegExp(`^i claim to be the ${role}`, 'gi');
					});
				
				roleRegexes.forEach((regex) => {
					if (regex.test(input.value)) {
						let claim = roles.filter((role) => {
							return input.value.match(new RegExp(`${role}$`, 'gi'));
						});

						chat.claim = claim;
					}
				});
			}

			this.props.onNewGameChat(chat, this.props.gameInfo.uid);
			input.value = '';
			input.focus();
			$button.addClass('disabled');
			$clearIcon.addClass('app-hidden');
		}
	}

	scrollChats() {
		let chatsContainer = document.querySelector('section.segment.chats'),
			$chatPusher = $('section.gamechat div.chatpusher'),
			chatCount = this.props.gameInfo.chats.length,
			$lockIcon = $('section.gamechat > .ui.menu > i');

		if (chatCount < 20) {
			$chatPusher.css({
				height: 290 - chatCount * 16,
			});
		} else {
			$chatPusher.remove();
		}

		if (!this.state.lock) {
			chatsContainer.scrollTop = chatsContainer.scrollHeight;
		}
	}

	handleChatFilterClick(e) {
		this.setState({
			chatFilter: $(e.currentTarget).text()
		});
	}

	handleTimestamps(timestamp) {
		let { userInfo } = this.props;

		if (userInfo.userName && userInfo.gameSettings && userInfo.gameSettings.enableTimestamps) {
			let minutes = (`0${new Date(timestamp).getMinutes()}`).slice(-2),
				seconds = (`0${new Date(timestamp).getSeconds()}`).slice(-2);

			return (
				<span className="chat-timestamp">
					({minutes}: {seconds})
				</span>
			);
		}
	}

	processChats() {
		let { gameInfo } = this.props;

		return gameInfo.chats.map((chat, i) => {
			let chatContents = chat.chat,
				playerRegexes = Object.keys(gameInfo.seated).map((seatName) => {
					return gameInfo.seated[seatName].userName;
				}).map((playerName) => {
					return {
						playerName,
						regex: new RegExp(playerName, 'gi')
					};
				}),
				isObserver = () => {
					return !!Object.keys(gameInfo.seated).find((seatName) => {
						return gameInfo.seated[seatName].userName === chat.userName;
					});
				},
				roleRegexes = [{
						role: 'masons',
						team: 'village',
						regex: /masons/gi
					}, ..._.uniq(gameInfo.roles).map((role) => { // javascript!
						return {
							role,
							team: roleMap[role].team,
							regex: new RegExp(role, 'gi')
						};
					}),
					{
						role: 'werewolves', // YES IT HAS TO BE DONE IN THIS ORDER I have no idea why but if you want a good laugh put this one first.  Babel issue?  Lodash?  Aliens?
						team: 'werewolf',
						regex: /werewolves/gi
					}
				];

			roleRegexes.forEach((roleRegex) => {
				chatContents = chatContents.replace(roleRegex.regex, `<span class="chat-role--${roleRegex.team}">${roleRegex.role}</span>`);
			});

			playerRegexes.forEach((playerRegex) => {
				chatContents = chatContents.replace(playerRegex.regex, `<span class="chat-player">${playerRegex.playerName}</span>`);
			});

			if (chat.gameChat && (this.state.chatFilter === 'Game' || this.state.chatFilter === 'All')) {
				return (
					<div className="item" key={i}>
						<span className="chat-user--game">[GAME] {this.handleTimestamps.call(this, chat.timestamp)}: </span>
						<span className="game-chat" dangerouslySetInnerHTML={{__html: chatContents}}></span>
					</div>
				);
			} else if (!chat.gameChat && this.state.chatFilter !== 'Game') {
				return (
					<div className="item" key={i}>
						<span className="chat-user">{chat.userName}{isObserver() ? '' : ' (Observer)'}{this.handleTimestamps.call(this, chat.timestamp)}: </span>
						<span dangerouslySetInnerHTML={{__html: chatContents}}></span>
					</div>
				);
			};
		});	
	}

	handleChatLockClick(e) {
		if (this.state.lock) {
			this.setState({lock: false});
		} else {
			this.setState({lock: true});
		}
	}

	render() {
		return (
			<section className="gamechat">
				<section className="ui pointing menu">
					<a className={this.state.chatFilter === 'All' ? 'item active' : 'item'} onClick={this.handleChatFilterClick.bind(this)}>All</a>
					<a className={this.state.chatFilter === 'Chat' ? 'item active' : 'item'} onClick={this.handleChatFilterClick.bind(this)}>Chat</a>
					<a className={this.state.chatFilter === 'Game' ? 'item active' : 'item'} onClick={this.handleChatFilterClick.bind(this)}>Game</a>
					<i className={this.state.lock ? 'large lock icon' : 'large unlock alternate icon'} onClick={this.handleChatLockClick.bind(this)}></i>
				</section>
				<section className="segment chats">
					<div className="chatpusher"></div>
					<div className="ui list">
						{this.processChats()}
					</div>
				</section>
				<form className="segment inputbar" onSubmit={this.handleSubmit.bind(this)}>
					{(() => {
						let { gameInfo, userInfo } = this.props,
							classes = 'expando-container';

						if (!gameInfo.gameState.isStarted || !userInfo.seatNumber) {
							classes += ' app-visibility-hidden';
						}
						// todo-alpha this isn't working
						return (
							<div className={classes}>
								<i className="large expand icon" onClick={this.clickExpand.bind(this)}></i>
								{(() => {
									if (gameInfo.gameState.isStarted && userInfo.seatNumber) {
										{this.displayHotkeys()}
									}
								})()}
							</div>
						);
						
					})()}
					<div className={this.props.userInfo.userName ? "ui action input" : "ui action input disabled"}>
						<input placeholder="Chat.." ref="gameChatInput" onKeyUp={this.handleKeyup.bind(this)} maxLength="300"></input>
						<button className="ui primary button disabled">Chat</button>
					</div>
					<i className="large delete icon app-hidden" onClick={this.handleChatClearClick.bind(this)}></i>
				</form>
			</section>
		);
	}
};