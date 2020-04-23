import nock from 'nock';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import pageLoader from '../src';

const getFixturePath = (name) => path.join(__dirname, '..', '__tests__', '__fixtures__', name);

let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});
afterEach(async () => {
  await fs.unlink(`${tempDir}/test-com-smth3-qua-5.html`)
    .then(() => fs.rmdir(tempDir));
});

test('get exact page', async () => {
  const scope = nock('http://test.com')
    .get('/smth3?qua=5%N')
    .reply(200, 'Ok');
  await pageLoader('http://test.com/smth3?qua=5%N', tempDir);
  expect(scope.isDone()).toBe(true);
});

test('write exact info', async () => {
  console.log('BEGIN');
  console.log('-----', tempDir);
  const rightData = await fs.readFile(getFixturePath('data.html'), 'utf-8');
  nock('http://test.com')
    .get('/smth3?qua=5%N')
    .reply(200, rightData);
  await pageLoader('http://test.com/smth3?qua=5%N', tempDir);
  const writtenData = await fs.readFile(`${tempDir}/test-com-smth3-qua-5.html`, 'utf-8').catch((err) => console.log('++++', err));
  expect(writtenData).toEqual(rightData);
});
