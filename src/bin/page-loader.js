#! /usr/bin/env node
import exec from 'commander';
import pageLoader from '..';
import { version, description } from '../../package.json';

exec
  .version(version)
  .description(description)
  .usage('[options] <path-to-webpage>')
  .option('--output <output-dir>', 'output directory')
  .parse(process.argv);

const args = process.argv;
const lastInd = args.length - 1;
const optionInd = args.indexOf('--output');
const output = optionInd === -1 ? process.cwd() : args[optionInd + 1];
const path = optionInd < lastInd - 1 ? args[lastInd] : args[optionInd - 1];

pageLoader(path, output);
