FChain
=========

FChain is a library that can be used as a base to construct slideshows, presentations , image galleries or just used to run a predetermined number of functions in order. At it's core it is simply an array-like object of functions, which can be traversed through or automatically executed based on a timer.

Examples
--------

```javascript
var setColor = function(color) {
	return function() {
		document.body.style.backgroundColor = color;
		console.log(color);
	}
}

//setup a chain with 3 functions

var fchain = FChain(setColor('red'),setColor('green'),setColor('blue'));


fchain.nextIndex(); //Output: 0

fchain.next(); //logs: 'red'

fchain.next().next(); //logs: 'green', 'blue'

fchain.last().next(); //logs 'blue' then a no-op as we're at the end of the chain

fchain.loop().next().previous(); //enables looping around the chain. logs:  'red', 'blue'

fchain.random(); //executes a random method in the chain. logs: either 'red','green' or 'blue';

fchain.setNext(1).next(); //sets the next index to be 1, runs it. logs: 'green'

fchain.moveTo(1); //same as above

fchain.runAt(0); //runs an given index without changing the next pointer. logs: 'red'

fchain.loop(false); //turns off looping

fchain.add(setColor('violet')); //adds a new function to the end of the chain

fchain.addAt(2,setColor('hazel')); //adds a new function at an given position in the chain.

fchain.removeAt(2); //removes a function at a given index

fchain.clear(); //clears the chain of all functions

```

Timing examples
-------------

```javascript

var fchain = FChain(setColor('red'),setColor('green'),setColor('blue'));

fchain.add(setColor('violet'),100); 
//adds a new method that will be executed after 100ms of it being the next function in the chain.

fchain.setTime(500); //chain will automatically traverse every 500 ms

fchain.setTimeFor(2, 1000); 
//schedules index 2 to automatically execute after 1000ms  of it being the next function in the chain

fchain.scheduleNext(100); //next method will execute in 100 ms

fchain.pauseTimer(); //pauses the currently running timer

fchain.resumeTimer(); //resumes the paused timer

fchain.restartTimer(); //restarts the current timer

fchain.elapsed(); //gets the elapsed time since timer has started

fchain.remaining(); //gets the remaining time before execution of the next function

fchain.scaleTime(10); //scales the time of for all functions by a factor of 10

console.log(fchain); 
/* 
[
	{fn: Function, time: 1000}, 
	{fn: Function, time: 10000}, 
	{fn: Function, time: 5000},
	{fn: Function, time: 1000}
]
*/


```

Properties
---------
* length -- returns 'array' length

Methods
---------

All methods are chainable unless specified otherwise.

* add(fn,[time])
* addAt(index, fn, [time])
* clear()
* elapsed() -- returns time in ms 
* first() 
* isTimerPaused() -- returns boolean
* isTimerRunning() -- returns boolean
* restartTimer()  
* last()  
* loop(enable) -- undefined value for 'enable' gets set to 'true'
* moveNextDown() 
* moveNextUp() 
* moveTo(index) 
* next() 
* nextIndex() -- returns next 0-based index
* pauseTimer() 
* previous() 
* random(index) 
* refresh() 
* resumeTimer() 
* remove(fn) 
* removeAt(index) 
* remaining() -- returns time in ms
* reset() 
* runAt() 
* runNext() 
* scheduleNext(time) 
* setNext(index) 
* setNextRandom() 
* scaleTime(by) 
* setTime(time) 
* setTimeFor(index, time)
* stopTimer() 

Specs
--------

Check the specs/Fchain.spec.js file for full specifications and behaviors.
