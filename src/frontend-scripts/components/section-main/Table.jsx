'use strict';

import React from 'react';
import $ from 'jquery';
import Popup from 'semantic-ui-popup';
import _ from 'lodash';

$.fn.popup = Popup;

export default class Table extends React.Component {
	constructor() {
		this.state = {
			firstClickedCard: '',
			showClaims: true
		};
	}

	componentDidUpdate(prevProps) {
		const { gameInfo, userInfo } = this.props,
			{ gameState } = gameInfo;

		if (gameInfo.gameState.isStarted && !prevProps.gameInfo.gameState.isStarted) {
			const $cards = $('div.card'),
				centerTop = 190,
				centerLeft = 260,
				shuffleInterval = setInterval(() => {
					$cards.each(function () {
						$(this).css({
							top: `${(190 + (Math.floor(Math.random() * 30) - 15)).toString()}px`,
							left: `${(260 + (Math.floor(Math.random() * 30) - 15)).toString()}px`
						});
					});
				}, 300);

			setTimeout(() => { // quality stuff here
				clearInterval(shuffleInterval);
			}, 5000);
		}

		if (userInfo.seatNumber && gameState.isStarted && userInfo.gameSettings && !this.props.userInfo.gameSettings.disablePopups && !prevProps.gameInfo.gameState.isStarted) {
			$(this.refs.reportIcon).popup({
				inline: true,
				hoverable: true,
				lastResort: true,
				delay: {
					show: 700,
					hide: 800
				}
			});
		}

		console.log(gameInfo.gameState.secondsLeftInNight);
	}

	shouldComponentUpdate(nextProps) {
		return !_.isEqual(nextProps.gameInfo, this.props.gameInfo);  // todo-release review this
	}

	leaveGame() {
		let seatNumber;

		if (this.props.userInfo.seatNumber) {
			seatNumber = this.props.userInfo.seatNumber;
		}

		this.props.onLeaveGame(seatNumber);
	}

	handleSeatClicked(e) {
		const { seated } = this.props.gameInfo,
			{ userInfo, gameInfo } = this.props,
			$seat = $(e.currentTarget);

		if (userInfo.userName && !gameInfo.gameState.isNight) {
			if ($seat.hasClass('empty') && !userInfo.seatNumber && !gameInfo.gameState.isCompleted) {
				this.props.onSeatingUser($seat.attr('data-seatnumber'));
			} else if (!(gameInfo.gameState.isStarted && !gameInfo.gameState.isDay)) {
				this.props.selectedPlayer({
					playerName: $(e.currentTarget).find('span.username').text(),
					random: Math.random().toString(36).substring(2)
				});
			}
		} else if (!gameInfo.gameState.isStarted) {
			$(this.refs.signinModal).modal('show');
		}
	}

	createCards() {
		const { gameInfo, userInfo } = this.props,
			{ gameState, tableState } = gameInfo;

		return _.range(0, 10).map((num) => { 
			return (
				<div key={num} data-cardnumber={num} onClick={this.handleCardClicked.bind(this)} className={
						(() => {
							let classes = `card card${num}`;

							if (tableState.seats[num].swappedWithSeat || tableState.seats[num].swappedWithSeat === 0) {
								classes += ` seat${tableState.seats[num].swappedWithSeat}`;
							} else if (gameState.cardsDealt) {
								classes += ` seat${num}`;
							}

							if (gameState.isCompleted) {
								classes += ` notransition`;
							}

							return classes;
						})()
					}>
					<div className={
						(() => {
							let classes = 'card-flipper';

							if (tableState.seats[num].isFlipped) {
								classes += ' flip';
							}

							if (tableState.seats[num].highlight) {
								classes += ` card-${tableState.seats[num].highlight}`;
							}

							return classes;
						})()
					}><div className={
						(() => {
							let classes;

							if (!gameState.isCompleted && gameState.isStarted && tableState.seats[num].claim && this.state.showClaims) {
								classes = `claim claim-${tableState.seats[num].claim}`;
							} else {
								classes = 'card-back';
							}

							return classes;
						})()
					}></div>
						<div className={
							(() => {
								let classes = `card-front seat-${num}`;

								const seat = tableState.seats[num];

								if (seat.role) {
									classes += ` ${seat.role}`;
								}

								return classes;
							})()
						}></div>
					</div>
				</div>
			);
		});
	}

	createSeats() {
		const { gameInfo, userInfo } = this.props;

		return _.range(0, 10).map((el) => {
			const seated = this.props.gameInfo.seated[`seat${el}`],
				user = seated ? gameInfo.seated[`seat${el}`].userName : '';

			return (
					<div key={el} className={
						(() => {
							return `seat-container seat-container${el}`;								
						})()
					}>
						<div className={seated ? `seat seat${el}` : `seat seat${el} empty`} data-seatnumber={el} onClick={this.handleSeatClicked.bind(this)}>
							<span className={
								(() => {
									let classes = 'username';

									if (seated && !gameInfo.seated[`seat${el}`].connected) {
										classes += ' socket-not-present';
									}

									if (userInfo.seatNumber === el.toString()) {
										classes += ' currentuser';
									}

									return classes;												
								})()
							}>{user}</span>
						</div>
						<div className={
							(() => {
								let classes = 'eliminator';

								const { eliminations } = gameInfo.gameState;

								if (el < 7 && eliminations && eliminations[el]) {
									classes += ` target-seat${gameInfo.gameState.eliminations[el].seatNumber}`;
								}

								if (eliminations && eliminations[el] && eliminations[el].transparent) {
									classes += ' transparent';
								}

								return classes;
							})()
						}></div>
					</div>
				);
			});
	}

	handleCardClicked(e) {
		const $card = $(e.currentTarget),
			cardNumber = $card.attr('data-cardnumber'),
			{ gameInfo, userInfo } = this.props,
			{ tableState, gameState } = gameInfo,
			data = {
				uid: gameInfo.uid
			};

		if (tableState.nightAction && !tableState.nightAction.completed && !gameState.isDay && gameState.phase === tableState.nightAction.phase) {
			data.userName = userInfo.userName;

			if (tableState.nightAction.action === 'singleWerewolf' && $card.attr('data-cardnumber') > 6) {
				data.role = 'singleWerewolf';
				data.action = cardNumber;
				this.props.socket.emit('userNightActionEvent', data);
			}

			if (tableState.nightAction.action === 'insomniac' && cardNumber === userInfo.seatNumber) {
				data.role = 'insomniac';
				data.action = cardNumber;
				this.props.socket.emit('userNightActionEvent', data);
			}

			if (tableState.nightAction.action === 'troublemaker' && parseInt(cardNumber) < 7 && cardNumber !== userInfo.seatNumber) {
				const { firstClickedCard } = this.state;

				if (firstClickedCard) {
					if (cardNumber !== firstClickedCard) {
						data.role = 'troublemaker';
						data.action = [this.state.firstClickedCard, cardNumber];
						this.props.socket.emit('userNightActionEvent', data);
					}
				} else {
					this.setState({
						firstClickedCard: cardNumber
					});
				}
			}

			if (tableState.nightAction.action === 'seer' && cardNumber !== userInfo.seatNumber) {
				const { firstClickedCard } = this.state;

				if (firstClickedCard || parseInt(cardNumber) < 7) {
					const action = [cardNumber];

					if (firstClickedCard) {
						action.push(this.state.firstClickedCard);
					}

					data.role = 'seer';
					data.action = action;				
					this.props.socket.emit('userNightActionEvent', data);
				} else if (parseInt(cardNumber) > 6) {
					this.setState({
						firstClickedCard: cardNumber
					});
				}
			}

			if (tableState.nightAction.action === 'robber' && parseInt(cardNumber) < 7 && cardNumber !== userInfo.seatNumber) {
				data.role = 'robber';
				data.action = cardNumber;
				this.props.socket.emit('userNightActionEvent', data);
			}
		}

		if (gameInfo.tableState.isVotable && gameInfo.tableState.isVotable.enabled && userInfo.seatNumber) {
			const swappedWithSeat = tableState.seats[parseInt(cardNumber)].swappedWithSeat;

			if ((swappedWithSeat === 0 || swappedWithSeat) && userInfo.seatNumber !== swappedWithSeat || !swappedWithSeat && userInfo.seatNumber !== cardNumber) {
				$card.parent().find('.card').removeClass('card-select'); // todo-release remove jquery crap
				$card.addClass('card-select');
				this.props.socket.emit('updateSelectedForElimination', {
					uid: gameInfo.uid,
					seatNumber: userInfo.seatNumber,
					selectedForElimination: swappedWithSeat || cardNumber
				});
			}
		}
	}

	nightBlockerStatus(position) {
		const { gameInfo, userInfo } = this.props;

		// return position === 'top' ? 'nightblocker nightblocker-top-blocked' : 'nightblocker nightblocker-bottom-blocked';

		if (userInfo.seatNumber && (gameInfo.tableState.isNight || gameInfo.gameState.isNight && !gameInfo.tableState.nightAction || gameInfo.tableState.nightAction && gameInfo.gameState.isNight && gameInfo.tableState.nightAction.phase !== gameInfo.gameState.phase)) {
			return position === 'top' ? 'nightblocker nightblocker-top-blocked' : 'nightblocker nightblocker-bottom-blocked';
		} else {
			return position === 'top' ? 'nightblocker nightblocker-top': 'nightblocker nightblocker-bottom';
		}
	}
	
	handleTruncateClicked(e) {
		const { gameInfo, userInfo } = this.props;

		if (gameInfo.gameState.isDay && gameInfo.gameState.isStarted) {
			const clicked = !!$(e.currentTarget).is(':checked');

			this.props.socket.emit('updateTruncateGame', {
				truncate: clicked,
				userName: userInfo.userName,
				uid: gameInfo.uid
			});
		}
	}

	handleClickedReportGame() {
		this.props.socket.emit('updateReportGame', {
			seatNumber: this.props.userInfo.seatNumber,
			uid: this.props.gameInfo.uid
		});
	}

	createReportGame() {
		const { gameInfo, userInfo } = this.props,
			{ gameState, tableState } = gameInfo;

		if (userInfo.seatNumber && gameState.isStarted) {
			const iconClasses = () => {
				let classes = 'warning sign icon';

				if (gameState.reportedGame[parseInt(userInfo.seatNumber)]) {
					classes += ' report-game-clicked';
				}

				return classes;
			}

			return (
				<div className="table-uid">
					Game ID: {gameInfo.uid}
					<i onClick={this.handleClickedReportGame.bind(this)} ref="reportIcon" className={iconClasses()}></i>
					<div className="ui popup transition hidden">
							Player abuse? Mark this game for reporting to the administrators for review.  Found a bug?  Send us an email.
					</div>
				</div>
			);
		}
	}

	createUserGameOptions() {
		const { gameInfo, userInfo } = this.props,
			{ gameState, tableState } = gameInfo,
			toggleClaims = () => {
				this.setState({
					showClaims: !$('input', this.refs.showclaims).is(':checked')
				});
			}

		if (userInfo.seatNumber && gameState.isStarted && gameState.isDay && !gameState.isCompleted) {
			return (
				<div className="game-options-container">
					<div className="ui fitted toggle checkbox checked showclaims" ref="showclaims">
						<input type="checkbox" name="show-claims" onClick={toggleClaims}></input>
						<label>Hide claims</label>
					</div>
					{(() => {
						if (!tableState.isVotable) {
							return (
								<div className="ui fitted toggle checkbox truncate-game">
									<input type="checkbox" name="truncate-game" onClick={this.handleTruncateClicked.bind(this)}></input>
									<label>End game early</label>
								</div>
							);
						}
					})()}
				</div>
			);
		}
	}

	createGameInformation() {
		const { gameInfo } = this.props;

		return (
			<div className="gameinformation-container">
				<span className="game-name">{gameInfo.name}</span>
				<span className="game-time">{gameInfo.time}</span>
			</div>
		);
	}

	createMoon() {
		// top: 140px; left: -50px; left: 590px
		let top, left, percent;

		const { secondsLeftInNight, maxSecondsLeftInNight } = this.props.gameInfo.gameState;

		percent = secondsLeftInNight / maxSecondsLeftInNight;

		// let 100left = -50;
		// let 0left = 590;
		// let 100top = 140;
		// let 50top = 20;

		left = -50 + (640 - 640 * percent);

		console.log(percent, '%');

		if (percent >= .5) {
			top = 20 + (120 - 120 * (percent));
		} else {
			top = 20;
		}

		// @ 0 top = 140
		// @ 50 top = 20
		// @ 100 top = 140

		return <div className="moon" style={{top: `${top}px`, left: `${left}px`}}></div>;
	}

	render() {
		const { gameInfo, userInfo } = this.props;

		return (
			<section className="table">
				<div className={this.nightBlockerStatus('top')}>
				{this.createMoon()}
				</div>
				<div className={this.nightBlockerStatus('bottom')}></div>
				<div className="tableimage"></div>
				{this.createGameInformation()}
				{this.createSeats()}
				{this.createCards()}
				{(() => {
					if (!userInfo.seatNumber || !gameInfo.gameState.isStarted || gameInfo.gameState.isCompleted) {
						return <i onClick={this.leaveGame.bind(this)} className='remove icon'></i>
					}
				})()}
				{this.createReportGame()}
				{this.createUserGameOptions()}
				<div className="ui basic small modal signinnag" ref="signinModal">
					<div className="ui header">You will need to sign in or sign up for an account to play.</div>
				</div>
			</section>
		);
	}
};