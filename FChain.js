// fchain v1.0.0
// (c) 2013 Sergey Melnikov 

// fchain may be freely distributed under the MIT license

(function () {
    "use strict";

    var root = this;

	function randomInt(min,max) {
		return Math.round(min+(Math.random()*(max-min)));
	}

	var objectCreate = ( Object.create ||  function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    });

	var FChain = function() {
		var i, l,
			o = this instanceof FChain ? this : objectCreate(FChain.prototype);

		o.reset();

		for (i=0,l=arguments.length; i<l; i++) {
			o.add(arguments[i]);
		}

		return o;
	};

	FChain.prototype = {
		length: 0,

		add : function(fn, time) {
			time || (time = this._defaultTime);

			if (typeof fn !== 'function') {
				throw "FChain add: not a function";
			}

			Array.prototype.push.call(this, FChain.createLink(fn, time));

			if (this._next == null) this._next = this.length-1;
			if (this._next === this.length-1) this.restartTimer();
			
			return this;
		},

		addAt : function(index, fn, time) {
			if (index < 0 || index >= this.length) {
				throw "FChain addAt: index out of bounds";
			}

			Array.prototype.splice.call(this, index, 0, FChain.createLink(fn,time));

		},

		clear : function() {
			for (var i=0,l=this.length; i<l; i++) {
				delete this[i];
			}

			this.length = 0;

			return this.reset();
		},

		elapsed : function() {
			return this._timerData ? this._timerData.time - this.remaining() : undefined;
		},

		first: function() {
			return this.moveTo(0);
		},

		isTimerPaused: function() {
			return this._timerPaused;
		},

		isTimerRunning: function() {
			return this._timerData != null;
		},

		restartTimer: function() {
			return this.setNext(this._next);
		},

		last: function() {
			return this.moveTo(this.length-1);
		},

		loop : function(loop) {
			this._looping = (loop == null) ? true : loop;

			if (this._looping && this._next === null) {
				this._next = 0;
				this.scheduleNext(this[0].time);
			}

			return this;
		},

		moveNextDown : function() {
			return this.setNext(this._next != null ? this._next - 1 : this.length - 1);
		},

		moveNextUp : function() {
			return this.setNext(this._next+1);
		},

		moveTo: function(index) {
			this.runAt(index);
			this.setNext(index+1);

			return this;
		},

		next : function() {
			if (this._next !== null) {
				this.runNext();
				this.moveNextUp();
			}

			return this;
		},

		nextIndex : function() {
			return this._next;
		},

		pauseTimer : function() {
			if (!this._timerPaused && this.isTimerRunning()) {
				this._remaining = this.remaining();
				this.stopTimer();
				this._timerPaused = true;
			}
			return this;
		},

		previous : function() {
			var runAt;

			if (this._next === null || this._next > 1 || this._looping) {
				if (this._last !== null) this.moveNextDown();

				runAt = this._next - 1;
				runAt = this._looping && runAt < 0 ? this.length -1 : runAt;

				this.runAt(runAt);
			}

			return this;
		},

		random: function() {
			return this.moveTo(randomInt(0,this.length-1));
		},

		refresh: function() {
			var run, i = 0, length = 0, oldLength = this.length;

			while(true) {
				if (this[i]) length +=1;
				else break;
				i++;
			}

			this.length = length;

			if (this._next >= length-1) {
				this._next = null;
			} else if (this._next === null && oldLength < length) {
				this._next = oldLength;
			}

			if (this[this._next]) {
				this.scheduleNext(this[this._next].time - (this.elapsed() || 0) );
			}

			return this;
		},

		resumeTimer : function() {
			if (this._timerPaused) {
				this.scheduleNext(this._remaining >= 0 ? this._remaining : 0);
			}
			return this;
		},

		remove : function(fn) {
			for (var i=0,l=this.length; i<l; i++) {
				if(this[i].fn === fn) {
					this.removeAt(i);
					i--; l--;
				}
			}
			return this;
		},

		removeAt: function(index) {
			if (index >= 0 && index < this.length) {

				for (var i=index+1,l=this.length; i<l; i++) {
					this[i-1] = this[i];
				}

				this.length--;
				delete this[this.length];

				if (this._next > index) {
					this._next--;
				} else if (this._next === index && this._next === this.length) {
					this._next = null;
				}

			} else {
				throw "FChain: Index is out of bounds";
			}
			return this;
		},

		remaining : function() {
			return this._timerData ? this._timerData.time - (new Date() - this._timerData.ran) : undefined;
		},

		reset: function() {
			this.stopTimer();
			this._next = 0;
			this._last = null;
			this._timerPaused = false;
			this._timerData = null;
			this._started = false;
			this._defaultTime  = null;
			if (this.length > 0) this.setNext(0);
			return this;
		},

		runAt : function(index) {
			if (this[index]) {
				this[index].fn();
				this._last = index;
			}

			return this;

		},

		runNext : function() {
			return this._next === null ? this : this.runAt(this._next);
		},

		scheduleNext : function(time) {
			var context = this;

			this.stopTimer();

			this._timerData = (time == null) ? null : {
				time: time,
				ran : new Date(),
				id : setTimeout(function() {
					context.next();
				},time)
			};
			this._timerPaused = false;
			this._remaining = null;
		},

		setNext: function(index) {
			if (index < 0) {
				index = this._looping ? this.length-1 : 0;
			} else if (index >= this.length) {
				index = this._looping ? 0 : null;
			} 

			if (this[index] && this[index].time) this.scheduleNext(this[index].time);
			else this.stopTimer();
		
			this._next = index;

			return this;
		},

		setNextRandom : function() {
			return this.setNext(randomInt(0,this.length-1));
		},

		scaleTime : function(x) {
			for (var i = 0, l = this.length; i < l; i++) {
				if (this[i].time) this[i].time *= x;
			}

	
			if (!this._timerPaused && this._timerData !== null) {
				this.pauseTimer();
				this._remaining *= x;
				this.resumeTimer();
			} else {
				this._remaining *= x;
			}
		

			return this;
		},

		setTime : function(time) {
			this._defaultTime = time;

			for (var i = 0, l = this.length; i < l; i++) {
				this[i].time = time;
			}

			if (this[this._next]) {
				this.scheduleNext(this[this._next].time);
			}

			return this;
		},

		setTimeFor : function(index, time) {
			this[index].time = time;

			if (index === this._next) {
				this.scheduleNext(this[index].time);
			}

			return this;
		},

		stopTimer : function() {
			if (this._timerData && this._timerData.id) {
				clearTimeout(this._timerData.id);
			}

			this._timerData = null;
			this._timerPaused = false;
			return this;
		},

		_last: null,
		_looping: null,
		_next: null,
		_timerData: null,
		_timerPaused: null,
		_remaining: null,
		_started: null,
		_defaultTime: null,
		splice : function() {throw "FChain: splice Not Implemented";}
	};

	FChain.prototype.constructor = FChain;
	
	FChain.createLink = function(fn,time) {
		var o = Object.create ? Object.create(null) : {};
		o.fn = fn;
		o.time = time;
		return o;
	};
   
    if (typeof exports !== 'undefined') {
        module.exports = exports = FChain;
    } else {
        root.FChain = FChain;
    }

}).call(this);