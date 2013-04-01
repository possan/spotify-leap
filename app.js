var sp = getSpotifyApi();
var models = sp.require('$api/models');


var Bump = function() {
	this._messagequeue = [];
	this._visible = false;
	this._visibletimer = 0;
	this.timer = null;
}

Bump.prototype._queue = function(item) {
	console.log('Bump queue', item);
	item.timeout = 5;
	this._messagequeue.push(item);
	this._tick();
}

Bump.prototype._tick = function() {
	if (this._visible)
		return;

	if (this.timer != null) {
		clearTimeout(this.timer);
		this.timer = null;
	}

	if (this._messagequeue.length > 0) {
		var p = this._messagequeue.splice(0, 1)[0];
		console.log('Tick show', p);
		this._visible = true;

		var el = document.createElement('div');
		var parent = document.getElementById('messagewrapper');
		parent.appendChild(el);
		el.innerHTML = p.text;
		el.className = 'size'+p.size;
		setTimeout(function() {
			el.className = 'size'+p.size+' show';
		}, 50);

		var self = this;
		setTimeout(function() {
			el.className = 'size'+p.size+' hide';
			self._visible = false;
			self._tick();
		}, 700);

		setTimeout(function() {
			el.parentNode.removeChild(el);
		}, 1000);
	}
}

Bump.prototype.text = function(text) {
	this._queue({
		text: text,
		size: 30
	});
}




var Player = function() {
	this.bump = new Bump();
	this.bump.text('Welcome!');
	this.lasttrack = null;
	this.lastplaying = false;
	var self = this;
	models.player.observe(models.EVENT.CHANGE, function(event) {
		console.log("Something changed!", models.player);

		if (models.player.playing != this.lastplaying) {
			this.lastplaying = models.player.playing;
			if (models.player.playing) {
				self.bump.text('Play');
			} else {
				self.bump.text('Pause');
			}
		}

		if (models.player.track.uri != self.lasttrack) {
			self.lasttrack = models.player.track.uri;
			self.bump.text(
				models.player.track.name + ' / ' +
				models.player.track.artists[0].name
			);
		}
	});
}

Player.prototype.prev = function() {
	this.bump.text('Prev track');
	models.player.previous(); // home
	models.player.previous(); // prev
}

Player.prototype.next = function() {
	this.bump.text('Next track');
	models.player.next();
}

Player.prototype.up = function() {
	this.bump.text('Like!');
}

Player.prototype.down = function() {
	this.bump.text('Dislike / skip');
	g_player.next();
}

Player.prototype.space = function() {
	// this.bump.text('Pause / Play / Stop');
}

Player.prototype.enter = function() {
	// this.bump.text('Enter');
}

Player.prototype.shuffle = function() {
	models.player.shuffle = !models.player.shuffle;
	if (models.player.shuffle) {
		this.bump.text('Shuffle playback');
	} else {
		this.bump.text('Don\'t shuffle playback');
	}
 	// this.bump.text('Pause / Play / Stop');
}

Player.prototype.repeat = function() {
	models.player.repeat = !models.player.repeat;
	if (models.player.repeat) {
		this.bump.text('Repeat tracks');
	} else {
		this.bump.text('Don\'t repeat tracks');
	}
 	// this.bump.text('Pause / Play / Stop');
}


Player.prototype.skip = function(delta) {
	var ms = Math.round(delta * 1000);
	models.player.position += ms;
	this.bump.text('Skip '+ms+'ms');
}


g_player = new Player();






Keyboard = {};

Keyboard.init = function() {

	document.body.addEventListener('keyup', function(e) {
		console.log('Key', e.keyCode);

		switch(e.keyCode) {
			case 37:
				// left
				g_player.prev();
				break;
			case 39:
				// right
				g_player.next();
				break;
			case 38:
				// up
				g_player.up();
				break;
			case 40:
				// down
				g_player.down();
				break;
			case 13:
				// enter
				g_player.enter();
				break;
			case 32:
				// space
				g_player.space();
				break;
			case 83:
				// s
				g_player.shuffle();
				break;
			case 82:
				// r
				g_player.repeat();
				break;
		}

		e.stopPropagation();
		return false;
	});

}

Keyboard.init();





var handtimer = 0;
var lastgesture = {};
var gesturetimer = 0;
var ignoregestures = (new Date()).getTime();

Leap.loop( {

	enableGestures: true

}, function(frame) {

	// console.log('Frame', frame);
	if (frame.fingers && frame.fingers.length > 0 ) {
		for (var i = 0; i < frame.fingers.length; i++) {
			var finger = frame.fingers[i];
			// console.log('Finger', finger);
		}
	}
	if (frame.hands && frame.hands.length > 0 ) {
		for (var i = 0; i < frame.hands.length; i++) {
			var hand = frame.hands[i];
			// console.log('Hand', hand);
			var h = document.getElementById('hand');
			h.style.left = Math.round(hand.palmPosition[0] - 50) + 'px';
			h.style.top = Math.round(-hand.palmPosition[1] - 50) + 'px';
			h.className = 'hand active';
			clearTimeout(handtimer);
			handtimer = setTimeout(function() {
				h.className = 'hand';
			}, 500)
			// h.innerHTML = JSON.stringify(html.palmNormal);
		}
	}
	if (frame.gestures) {
		for (var i = 0; i < frame.gestures.length; i++) {
			var gesture = frame.gestures[i];
			// console.log('Gesture!', gesture);
			if (gesture.state == 'stop') {
				// gesture ender.
				console.log('Gesture stop!', gesture.type, gesture);
			}
			if (gesture.state == 'update') {
				// gesture ender.
				console.log('Gesture update!', gesture.type, gesture);
				clearTimeout(gesturetimer);
				// if ((new Date()).getTime() > ignoregestures) {
					lastgesture = gesture;
					gesturetimer = setTimeout(function() {
						// fire!
						console.log('Gesture delayed fire!', lastgesture.type, lastgesture);

						if (lastgesture.type == 'swipe') {
							// kolla riktning

							var dx = lastgesture.direction[0];
							var dy = -lastgesture.direction[1];
							var dl = Math.sqrt(dx*dx + dy*dy);
							dx /= dl;
							dy /= dl;
							dx *= 100;
							dy *= 100;
							dx = Math.round(dx);
							dy = Math.round(dy);

							g_player.bump.text(
								'Swipe # dx:'+dx+', dy:'+dy+', speed:'+lastgesture.speed
							)

							if (dx < -70 && dy > -20 && dy < 20) {
								g_player.prev();
							}
							else if (dx > 70 && dy > -20 && dy < 20) {
								g_player.next();
							}
							else if (dy < -70 && dx > -20 && dx < 20) {
								g_player.up();
							}
							else if (dy > 70 && dx > -20 && dx < 20) {
								g_player.down();
							}

						} else if (lastgesture.type == 'circle') {

							var right = lastgesture.normal[2] < 0;

							g_player.bump.text(
								'Circle # right:'+right+', progress:'+lastgesture.progress
							)

							if (lastgesture.progress > 0.1) {
								var delta = lastgesture.progress * 10;
								if (!right) delta = -Math.abs(delta);
								g_player.skip(delta);
								/*
								if (right) {
									g_player.repeat();
								} else {
									g_player.shuffle();
								} */
							}
						}

						ignoregestures = (new Date()).getTime() + 500;
					}, 250);
				// }
			}
		}
	}

});

