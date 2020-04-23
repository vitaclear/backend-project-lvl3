import url from 'url';
import { promises as fs } from 'fs';
import axios from 'axios';

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
  return pathStr;
};

const pageLoader = (path, output) => {
  const urlObj = url.parse(path);
  const outfileName = `${str(urlObj.host)}${str(urlObj.path)}`;
  const outPath = output[output.length - 1] === '/'
    ? `${output}${myTrim(outfileName)}.html`
    : `${output}/${myTrim(outfileName)}.html`;
  return axios.get(path).then((response) => fs.writeFile(outPath, response.data))
    .catch((err) => console.log('BVBBB', output, err));
};

export default pageLoader;
