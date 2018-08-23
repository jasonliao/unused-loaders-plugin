# UnusedLoadersPlugin

A webpack plugin to find unused rules/loaders

## Install

```js
npm i unused-loaders-plugin --save-dev 

// or use yarn :)
yarn add unused-loaders-plugin -dev
```

## Usage

```js
// webpack configuration
const UnusedLoadersPlugin = require('unused-loaders-plugin')

module.exports = {
  // other config
  plugins: [
    // other plugin
    new UnusedLoadersPlugin()
  ]
}
```

## Options

- [ ] `excludeLoaders`



