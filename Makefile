compile : deps 
	@node_modules/.bin/grunt
deps: 
	@npm install
