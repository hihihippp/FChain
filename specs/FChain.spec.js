var time = 0, jsDate = Date;

Date = function() {
	return new jsDate(time)
}

describe("FChain", function() {
	var t,
		results,
		tickone = 10, 
		ticktwo = 20, 
		tickthree = 30,
		aLongTime = 100000,
		fns = {
			one : function() { results.push(1);},
			two : function() { results.push(2);},
			three: function() {results.push(3);}
		},
		startSpy = function() {
			spyOn(fns,'one').andCallThrough();
			spyOn(fns,'two').andCallThrough();
			spyOn(fns,'three').andCallThrough();
		},
		tick = function() { //voodoo magic
			var i, l, x;
			for (i=0, l= arguments.length; i<l; i++) {
				x = arguments[i];
				(function(x) {
					setTimeout(function() {
						time += x;
					},x-1);
				}(x));
				jasmine.Clock.tick(x);
			}
		};



	beforeEach(function() {
		time = 0;
   		jasmine.Clock.useMock();
   		jasmine.Clock.installed.scheduledFunctions = {};
		t = FChain();
		startSpy();
		t.add(fns.one,tickone).add(fns.two,ticktwo).add(fns.three, tickthree);
		results = [];
	});

	it("accepts a list of functions in the constructor", function() {
		var fn, fn2;

		fn = function() {};
		fn2 = function() {};

		var fchain = FChain(fn,fn2);

		expect(fchain[0].fn).toBe(fn);
		expect(fchain[1].fn).toBe(fn2);
		expect(fchain.length).toBe(2);
	});

	it("add timed events to the chain", function() {
		expect(t[0]).toEqual({time: tickone, fn: fns.one});
		expect(t[1]).toEqual({time: ticktwo, fn: fns.two});
		expect(t[2]).toEqual({time: tickthree, fn: fns.three});
		expect(t.length).toBe(3);
	});

	it("starts and runs the event chain", function() {
		expect(results).toEqual([]);
		tick(tickone);
		expect(results).toEqual([1]);
		tick(ticktwo);
		expect(results).toEqual([1,2]);
		tick(tickthree);
		expect(results).toEqual([1,2,3]);
		tick(aLongTime);
		expect(results).toEqual([1,2,3]);
	});

	it("stops the event chain if one is running", function() {
		tick(tickone);
		expect(results).toEqual([1]);
		t.stopTimer();
		tick(ticktwo+tickthree);
		expect(results).toEqual([1]);
		expect(fns.two).not.toHaveBeenCalled();
		expect(fns.three).not.toHaveBeenCalled();
	});

	it("returns the current index waiting for execution", function() {
		expect(t.nextIndex()).toBe(0);
		tick(tickone);
		expect(t.nextIndex()).toBe(1);
		tick(ticktwo);
		expect(t.nextIndex()).toBe(2);
		tick(tickthree);
		expect(t.nextIndex()).toBe(null);
	});

	it("returns the time until next execution", function() {
		var elapse = 5;
		expect(t.remaining()).toBe(tickone);
		tick(elapse);
		expect(t.remaining()).toBe(tickone - elapse)
	});

	it("returns undefined if asked for the time until next execution and timer is not running", function() {
		t.stopTimer();
		expect(t.remaining()).toBe(undefined);
	});

	it("immediatly execute the next function in the chain", function() {
		t.next();
		expect(fns.one.callCount).toEqual(1);
		expect(t.nextIndex()).toEqual(1);
		t.next().next();
		expect(fns.two.callCount).toEqual(1);
		expect(fns.three.callCount).toEqual(1);
		expect(t.nextIndex()).toEqual(null);
	});

	it("resets the chain", function() {
		t.next();
		tick(ticktwo-1);
		t.pauseTimer();
		t.reset();
		expect(t.nextIndex()).toBe(0);
		expect(t.isTimerPaused()).toBe(false);
		expect(t.elapsed()).toBe(0);
		tick(tickone);
		expect(results).toEqual([1,1]);

	});

	it("clears the chain of all functions", function() {
		spyOn(t,'reset');
		t.clear();
		expect(t[0]).toBe(undefined);
		expect(t[1]).toBe(undefined);
		expect(t[2]).toBe(undefined);
		expect(t.length).toBe(0);
		expect(t.reset).toHaveBeenCalled();
	});

	it("runs the next index in the chain", function() {
		t.setNext(2).next();
		expect(results).toEqual([3]);
	});

	it("runs an arbitrary index in the chain", function() {
		t.runAt(1);
		expect(results).toEqual([2]);
		expect(t.nextIndex()).toEqual(0);
	});

	it("performs a no-op when the index to run is out of bounds", function() {
		t.runAt(t.length);
		expect(results).toEqual([]);
	});

	it("restarts the timer of the next index in the chain", function() {
		tick(tickone-1);
		t.restartTimer();
		expect(t.elapsed()).toEqual(0);
		expect(t.remaining()).toEqual(tickone);
	});

	it("schedules the next event at an arbitrary time", function() {
		t.add(function() {results.push(4)});
		t.next().next().next();
		t.scheduleNext(1);
		tick(1);
		expect(results).toEqual([1,2,3,4]);
	});

	it("replace it's current schedule by re-scheduling the next function", function() {
		t.scheduleNext(tickone*2);
		tick(tickone);
		expect(results).toEqual([]);
		tick(tickone);
		expect(results).toEqual([1]);
	});

	describe("when looping", function() {

		it("switches on the loop", function() {
			var i, runs = 100;
			t.loop();

			for (i=1;i<=runs;i++) {
				tick(tickone);
				expect(fns.one.callCount).toEqual(i);
				expect(fns.two.callCount).toEqual(i-1);
				expect(fns.three.callCount).toEqual(i-1);
				tick(ticktwo);
				expect(fns.one.callCount).toEqual(i);
				expect(fns.two.callCount).toEqual(i);
				expect(fns.three.callCount).toEqual(i-1);
				tick(tickthree);
				expect(fns.one.callCount).toEqual(i);
				expect(fns.two.callCount).toEqual(i);
				expect(fns.three.callCount).toEqual(i);

			}
		});

		it("switches off the loop", function() {
			t.loop().next().next().next().next();
			t.loop(false).next().next().next().next();
			expect(results).toEqual([1,2,3,1,2,3]);
		});

		it("restarts the loop if past the end of the chain", function() {
			t.next().next().next().loop();
			tick(tickone);
			expect(results).toEqual([1,2,3,1]);
		});

	});

	describe("when refreshing the chain", function() {
		it("has no effect if no changes were made", function() {
			tick(tickone-1);
			t.refresh();
			tick(1);
			expect(t.length).toEqual(3);
			expect(results).toEqual([1]);
			t.next().next().next();
			expect(results).toEqual([1,2,3]);
		});

		it("moves to the next function if one is added and the chain is already at the end", function() {
			t.next().next().next();
			expect(t.nextIndex()).toBe(null);
			t[3] = FChain.createLink(function() {results.push(4)});
			t.refresh();
			expect(t.nextIndex()).toBe(3);
			t.next();
			expect(results).toEqual([1,2,3,4]);
		});

		it("moves to the end of the chain if the next function is removed", function() {
			t.next().next();
			expect(t.nextIndex()).toBe(2);
			delete t[2];
			t.refresh();
			expect(t.nextIndex()).toBe(null);
		});

		it("resumes the next timer subtracting the time that has already been elapsed", function() {
			tick(tickone-1);
			t[0] = FChain.createLink(function() {results.push(4)},tickone*2);
			t.refresh();
			tick(1);
			expect(results).toEqual([]);
			tick(tickone);
			expect(results).toEqual([4]);
		});
	});

	describe("when adding new functions to the chain", function() {
		it("appears as an element of the chain in array-like form", function() {
			var fn = function() {};
			t.clear().add(fn,1);
			expect(t[0]).toEqual({fn: fn, time: 1});
		});

		it("never executes a timer if no time is provided on a function", function() {
			t.clear().add(function() {results.push(0)});
			tick(aLongTime);
			expect(results).toEqual([]);
			t.next();
			expect(results).toEqual([0]);
		});

		it("sets the added function to the last value if the timer is past the chain", function() {
			t.last().next();
			t.add(function() {results.push(4)}, 100);
			expect(results).toEqual([3]);
			tick(100);
			expect(results).toEqual([3,4]);
			t.add(function() {results.push(5)});
			t.next();
			expect(results).toEqual([3,4,5]);
		});
	});

	describe("when removing events from the chain", function() {
		it("removes an element at a specific index", function() {
			t.removeAt(0).next().next().next();
			expect(results).toEqual([2,3]);
		});

		it("maintains the correct order in the chain when a index before the next index gets removed", function() {
			t.next().removeAt(0).next().next();
			expect(results).toEqual([1,2,3]);
		});

		it("maintains the correct order in the chain when the index removed is the last and next index in the chain", function() {
			t.next().next().removeAt(2);
			expect(results).toEqual([1,2]);
			expect(t.nextIndex()).toBe(null);
		});
	});

	describe("when pausing the timer on the next event", function() {
		it("pauses the event chain if one is running", function() {
			tick(tickone);
			expect(fns.one.callCount).toEqual(1);
			t.pauseTimer();
			tick(ticktwo+tickthree);
			expect(fns.two).not.toHaveBeenCalled();
			expect(fns.three).not.toHaveBeenCalled();
		});

		it("resumes the event chain if one is paused", function() {
			tick(tickone, ticktwo * 0.5);
			expect(fns.one.callCount).toEqual(1);
			t.pauseTimer();
			tick(ticktwo * 0.5);
			expect(fns.two).not.toHaveBeenCalled();
			t.resumeTimer();
			tick(ticktwo * 0.5);
			expect(fns.two.callCount).toEqual(1);
		});

		it("indicates if the chain is paused", function() {
			expect(t.isTimerPaused()).toEqual(false);
			t.pauseTimer();
			expect(t.isTimerPaused()).toEqual(true);
			t.resumeTimer();
			expect(t.isTimerPaused()).toEqual(false);
		});

		it("Does not pause the event if the timer is not running", function() {
			t.stopTimer();
			t.pauseTimer();
			expect(t.isTimerPaused()).toEqual(false);
		});
	});

	describe("when setting the time for all functions", function() {
		it("changes the time for all functions", function() {
			t.setTime(tickone);
			tick(tickone*3);
			expect(results).toEqual([1,2,3]);
		});

		it("restars the timer with the new time", function() {
			tick(tickone-2);
			t.setTime(1);
			expect(t.elapsed()).toBe(0);
			expect(t.remaining()).toBe(1);
			tick(1);
			expect(results).toEqual([1]);
		});
	});

	describe("when setting the time for a single function", function() {
		it("changes the time for a single function", function() {
			t.next().setTimeFor(1,tickone);
			tick(tickone*2);
			expect(results).toEqual([1,2]);
		});

		it("restarts the timer if the next index is the index the time is set on", function() {
			tick(tickone-1);
			t.setTimeFor(0, tickone);
			tick(1);
			expect(results).toEqual([]);
			tick(tickone-1);
			expect(results).toEqual([1]);
		});
	});

	describe("when scaling time", function() {
		var scale = 10;

		it("scales the time based on the number passed", function() {
			t.scaleTime(scale);
			expect(t[0].time).toEqual(tickone*scale);
			expect(t[1].time).toEqual(ticktwo*scale);
			expect(t[2].time).toEqual(tickthree*scale);
		});

		it("scales the remaining time if the timer is paused", function() {
			tick(tickone*0.5);
			t.pauseTimer();
			expect(results).toEqual([]);
			t.scaleTime(scale);
			t.resumeTimer();
			tick(tickone*0.5);
			expect(results).toEqual([]);
			tick(tickone*(scale -1));
			expect(results).toEqual([1]);
		});

		it("scales the remaining time if the timer is running", function() {
			tick(tickone*0.5);
			t.scaleTime(scale);
			tick(tickone*0.5);
			expect(results).toEqual([]);
			tick(tickone*(scale -1));
			expect(results).toEqual([1]);
		});
	});

	describe("when traversing through the chain", function() {

		it("gets the next index in the chain", function() {
			expect(t.nextIndex()).toBe(0);
			t.next();
			expect(t.nextIndex()).toBe(1);
			t.next();
			expect(t.nextIndex()).toBe(2);
			t.next();
			expect(t.nextIndex()).toBe(null);
		});

		it("moves through the chain forward", function() {
			t.next().next().next();
			expect(results).toEqual([1,2,3]);
		});

		it("moves through the chain backwards", function() {
			t.last().previous().previous();
			expect(results).toEqual([3,2,1]);
		});

		it("can't move past the last entry in the chain", function() {
			t.next().next().next().next().next();
			expect(results).toEqual([1,2,3]);
		});

		it("moves to the previous entry after moving past the last entry", function() {
			t.last().next().previous().previous();
			expect(results).toEqual([3,2,1]);
		});

		it("can't move past the first entry", function() {
			t.previous();
			expect(results).toEqual([]);
			t.next();
			expect(results).toEqual([1]);
		});

		it("loops forwards and backwards through the chain", function() {
			t.loop().next().next().next().next().previous().previous().previous().previous().next();
			expect(results).toEqual([1, 2, 3, 1, 3, 2, 1, 3, 1]);
		});

		it("moves to the next entry after moving past the first entry", function() {
			t.next().previous().previous().next();
			expect(results).toEqual([1,2]);
		});

		it("loops forwards through the entries", function() {
			t.loop().next().next().next().next().next().next().next().next();
			expect(results).toEqual([1,2,3,1,2,3,1,2]);
		});

		it("loops backwards through the entries", function() {
			t.loop().previous().previous().previous().previous().previous().previous().previous();
			expect(results).toEqual([3,2,1,3,2,1,3]);
		});

		it("can loop after the end of chain is reached", function() {
			t.next().next().next().next().loop().next();
			expect(results).toEqual([1,2,3,1])
		})

		it("move to the next function in the chain", function() {
			tick(tickone-1);
			t.moveNextUp();
			tick(1);
			expect(fns.one.callCount).toBe(0);
			tick(ticktwo-2);
			expect(fns.two.callCount).toBe(0);
			tick(1);
			expect(fns.two.callCount).toBe(1);
		});

		it("move to the previous function in the chain", function() {
			tick(tickone);
			t.moveNextDown();
			tick(tickone);
			expect(fns.one.callCount).toBe(2);
		});

		it("moves to the begining of the chain", function() {
			t.loop().last();
			expect(t.nextIndex()).toEqual(0);
		});

		it("moves to an arbitrary part of the chain", function() {
			t.setNext(1);
			expect(t.remaining()).toBe(ticktwo);
			expect(t.nextIndex()).toEqual(1);
		});

		it("moves to the begining of the chain next is called at the end of the chain", function() {
			t.loop();
			t.setNext(t.length);
			expect(t.remaining()).toBe(tickone);
			expect(t.nextIndex()).toEqual(0);
		});

		it("moves to the end of the chain if previous is called at the begining of the chain", function() {
			t.loop();
			t.moveNextDown();
			expect(t.remaining()).toBe(tickthree);
			expect(t.nextIndex()).toEqual(t.length-1);
		});

	});
});