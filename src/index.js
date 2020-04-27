import url from 'url';
import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';
import cheerio from 'cheerio';

const str = (inStr) => {
  const reg = /[0-9a-z-]+/;
  const inArr = inStr.split('');
  const outArr = inArr.map((el) => {
    if (reg.exec(el)) {
      return el;
    }
    return '-';
  });
  return outArr.join('');
};

const myTrim = (pathStr) => {
  if (pathStr[pathStr.length - 1] === '-') {
    return myTrim(pathStr.slice(0, pathStr.length - 1));
  }
  if (pathStr[0] === '-') {
    return myTrim(pathStr.slice(1, pathStr.length));
  }
  return pathStr;
};

const tagsHandle = (obj, linkType, linksPath, key = 0, res = []) => {
  if (!obj[key]) {
    return res;
  }
  const link = obj[key].attribs.src;
  if (url.parse(link).host) {
    return tagsHandle(obj, linkType, linksPath, key + 1, res);
  }
  const ext = path.extname(link);
  const linkWithoutExt = link.slice(0, link.length - ext.length);
  const trimmedLink = myTrim(str(linkWithoutExt));
  const newLink = path.join(linksPath, `${trimmedLink}${ext}`);
  return tagsHandle(obj, linkType, linksPath, key + 1, [...res, { newLink, link, type: linkType }]);
};

const handle = (data, folder) => {
  const $ = cheerio.load(data);
  const allImgs = $('img[src]');
  const imgs = tagsHandle(allImgs, 'img', folder);
  const allLinks = $('link[src]');
  const links = tagsHandle(allLinks, 'link', folder);
  const allScripts = $('script[src]');
  const scripts = tagsHandle(allScripts, 'script', folder);
  const srcs = [...links, ...scripts];
  [...srcs, ...imgs].map((el) => $(`${el.type}[src="${el.link}"]`).attr('src', el.newLink));
  return { newData: $.html(), srcs, imgs };
};

const writeFiles = (file, folder, localFolder, mainUrl, obj) => {
  const getNWriteImgs = (sources) => sources.map((el) => axios.get(`${mainUrl}/${el.link}`, { responseType: 'arraybuffer' })
    .then((datas) => fs.writeFile(path.join(folder, el.newLink), datas.data, 'binary'))
    .catch((e) => console.log(e)));
  const getNWriteLinks = (sources) => sources.map((el) => axios.get(`${mainUrl}/${el.link}`)
    .then((res) => fs.writeFile(path.join(folder, el.newLink), res.data)));
  return fs.access(path.join(folder, localFolder))
    .catch(() => fs.mkdir(path.join(folder, localFolder)))
    .then(() => Promise.all([...getNWriteLinks(obj.srcs), ...getNWriteImgs(obj.imgs)]))
    .then(() => fs.writeFile(file, obj.newData));
};

const pageLoader = (address, output) => {
  const urlObj = url.parse(address);
  const outName = myTrim(`${str(urlObj.host)}${str(urlObj.path)}`);
  const outFile = `${path.join(output, outName)}.html`;
  const outLocalFolder = `${outName}_files`;
  const urlPath = urlObj.path === '/' ? address : path.dirname(address);
  return axios.get(address)
    .then((response) => handle(response.data, outLocalFolder))
    .then((response) => writeFiles(outFile, output, outLocalFolder, urlPath, response));
};

export default pageLoader;
