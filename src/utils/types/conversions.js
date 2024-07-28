const MarkdownIt = require('markdown-it');
const sharp = require('sharp');
const csvtojson = require('csvtojson');
const yaml = require('js-yaml');

// Handle all the type conversions
module.exports.handleTypeConversion = async ({ currentType, finalType, fragmentData }) => {
  switch (finalType) {
    case 'text/plain':
      return await convertToTxtPlain(currentType, fragmentData);
    case 'text/html':
      return await convertToHTML(currentType, fragmentData);
    case 'application/json':
      return await convertToJson(currentType, fragmentData);
    case 'application/yaml':
      return await convertToYaml(currentType, fragmentData);
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
    case 'image/gif':
    case 'image/avif':
      return await convertToImage(currentType, finalType, fragmentData);
    default:
      throw new Error(
        `Type conversion from ${currentType} to ${finalType} is currently not supported by the API.`
      );
  }
};

const convertToTxtPlain = async (currentType, fragmentData) => {
  switch (currentType) {
    case 'application/json':
    case 'application/yaml':
      return fragmentData.toString();
    case 'text/html':
    case 'text/csv':
    case 'text/markdown':
      return fragmentData.toString();
    default:
      throw new Error(`Type conversion from ${currentType} to text/plain is not supported.`);
  }
};

const convertToHTML = async (currentType, fragmentData) => {
  const md = new MarkdownIt();
  switch (currentType) {
    case 'text/markdown':
      return md.render(fragmentData.toString());
    default:
      throw new Error(`Type conversion from ${currentType} to text/html is not supported.`);
  }
};

const convertToJson = async (currentType, fragmentData) => {
  switch (currentType) {
    case 'text/csv': {
      const jsonCSV = await csvtojson().fromString(fragmentData.toString());
      return JSON.stringify(jsonCSV);
    }
    default:
      throw new Error(`Type conversion from ${currentType} to application/json is not supported.`);
  }
};

const convertToYaml = async (currentType, fragmentData) => {
  switch (currentType) {
    case 'application/json':
      return yaml.dump(JSON.parse(fragmentData.toString()));
    default:
      throw new Error(`Type conversion from ${currentType} to application/yaml is not supported.`);
  }
};

const convertToImage = async (currentType, finalType, fragmentData) => {
  const image = sharp(fragmentData);
  switch (finalType) {
    case 'image/jpeg':
      return await image.jpeg().toBuffer();
    case 'image/png':
      return await image.png().toBuffer();
    case 'image/webp':
      return await image.webp().toBuffer();
    case 'image/gif':
      return await image.gif().toBuffer();
    case 'image/avif':
      return await image.avif().toBuffer();
    default:
      throw new Error(`Type conversion from ${currentType} to ${finalType} is not supported.`);
  }
};
