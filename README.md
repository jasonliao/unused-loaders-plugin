# UnusedLoadersPlugin

A webpack plugin to find unused rules/loaders

![unused-rules-loader](./images/unused-rules-loader.png)

![unused-rules](./images/unused-rules.png)

![wow](./images/wow.png)

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


