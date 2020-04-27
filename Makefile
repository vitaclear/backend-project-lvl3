install:
	npm install
start:
	npm run babel-node -- src/bin/page-loader.js
run-help:
	npm run babel-node -- src/bin/page-loader.js -h
publish:
	npm publish
lint:
	npm run eslint .
test:
	npm test
