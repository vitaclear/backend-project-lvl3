import nock from 'nock';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import pageLoader from '../src';

const getFixturePath = (name) => path
  .join(__dirname, '..', '__tests__', '__fixtures__', name);

let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});
afterEach(async () => {
  const iter = async (dirname) => {
    const items = await fs.readdir(dirname);
    const filepaths = items.map((file) => path.join(dirname, file));
    const stats = await Promise.all(filepaths.map(fs.stat));
    await Promise.all(stats.map((el, ind) => {
      if (el.isFile()) {
        return fs.unlink(filepaths[ind]);
      }
      return iter(filepaths[ind]);
    }));
    await fs.rmdir(dirname);
  };
  await iter(tempDir);
});

test('get exact page', async () => {
  const scope = nock('http://test.com')
    .get('/smth3?qua=5%N')
    .reply(200, 'Ok');
  await pageLoader('http://test.com/smth3?qua=5%N', tempDir);
  expect(scope.isDone()).toBe(true);
});

test('write exact info', async () => {
  const rightData = await fs
    .readFile(getFixturePath('data.html'), 'utf-8');
  nock('http://test.com')
    .get('/smth3?qua=5%N')
    .reply(200, rightData);
  await pageLoader('http://test.com/smth3?qua=5%N', tempDir);
  const writtenData = await fs
    .readFile(`${tempDir}/test-com-smth3-qua-5.html`, 'utf-8')
    .catch((err) => console.log('++++', err));
  expect(writtenData).toEqual(cheerio.load(rightData).html());
});

test('write info from local link', async () => {
  nock('http://test.com')
    .get('/scriptfile01.js')
    .reply(200, 'script');
  nock('http://test.com')
    .get('/links/img2.png')
    .reply(200, 'img2.png');
  const gif = await fs
    .readFile(getFixturePath('1.gif'));
  nock('http://test.com')
    .get('/links/1.gif')
    .reply(200, gif);
  const webpage = await fs
    .readFile(getFixturePath('testlinks.html'), 'utf-8');
  nock('http://test.com')
    .get('/testlinks.html')
    .reply(200, webpage);
  const linkData = await fs
    .readFile(getFixturePath('link1.htm'), 'utf-8');
  const scope = nock('http://test.com')
    .get('/links/link1.htm')
    .reply(200, linkData);
  const newPage = await fs
    .readFile(getFixturePath('testlinks-new.html'), 'utf-8');
  await pageLoader('http://test.com/testlinks.html', tempDir);
  const writtenLink = await fs
    .readFile(`${tempDir}/test-com-testlinks-html_files/links-link1.htm`, 'utf-8');
  const writtenBinaryData = await fs
    .readFile(`${tempDir}/test-com-testlinks-html_files/links-1.gif`);
  const writtenData = await fs
    .readFile(`${tempDir}/test-com-testlinks-html.html`, 'utf-8');
  await expect(scope.isDone()).toBe(true);
  await expect(writtenLink).toEqual(linkData);
  await expect(writtenBinaryData).toEqual(gif);
  await expect(writtenData).toEqual(cheerio.load(newPage).html());
});

test('don\'t write external link', async () => {
  const webpage = await fs
    .readFile(getFixturePath('externallinks.html'), 'utf-8');
  nock('http://test.com')
    .get('/external')
    .reply(200, webpage);
  const scope1 = nock('http://test.com')
    .get('/locallink')
    .reply(200, 'local link');
  const scope2 = nock('http://external.net')
    .get('/links/1.jpg')
    .reply(200, 'external link');
  await pageLoader('http://test.com/external', tempDir);
  const writtenData = await fs
    .readFile(`${tempDir}/test-com-external.html`, 'utf-8');
  const rightData = await fs
    .readFile(getFixturePath('externallinks-new.html'), 'utf-8');
  await expect(writtenData).toEqual(cheerio.load(rightData).html());
  await expect(scope1.isDone()).toBe(true);
  await expect(scope2.isDone()).toBe(false);
});

test('right handle of root\'s links', async () => {
  const webpage = await fs
    .readFile(getFixturePath('externallinks.html'), 'utf-8');
  nock('http://test.com')
    .get('/')
    .reply(200, webpage);
  const scope1 = nock('http://test.com')
    .get('/locallink')
    .reply(200, 'local link');
  const scope2 = nock('http://external.net')
    .get('/links/1.jpg')
    .reply(200, 'external link');
  await pageLoader('http://test.com', tempDir);
  await expect(scope1.isDone()).toBe(true);
  await expect(scope2.isDone()).toBe(false);
});
