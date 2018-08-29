# UnusedLoadersPlugin

A webpack plugin to find unused rules/loaders

<img src="./images/unused-rules-loader.png" alt="unused-rules-loader" width="70%" />

<img src="./images/unused-rules.png" alt="unused-rules" width="70%" />

<img src="./images/wow.png" alt="wow" width="70%" />

## Install

```bash
npm i unused-loaders-plugin --save-dev 

# or use yarn :)
yarn add unused-loaders-plugin -dev
```

## Usage

```js
// webpack configuration
const UnusedLoadersPlugin = require('unused-loaders-plugin')

module.exports = {
  // other config
  plugins: [
    new UnusedLoadersPlugin()
    // other plugins
  ]
}
```
