install:
	npm install
start:
	npm run babel-node -- src/bin/page-loader.js
run-help:
	npm run babel-node -- src/bin/page-loader.js -h
run-test:
	npm run babel-node -- src/bin/page-loader.js http://test.com
run-test4:
	npm run babel-node -- src/bin/page-loader.js http://test.com/smth3?qua=5%N
publish:
	npm publish
lint:
	npm run eslint .
test:
	npm test
