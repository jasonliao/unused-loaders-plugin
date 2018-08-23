
class UnusedLoadersPlugin {
  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.done.tap('UnusedLoadersPlugin', this.done.bind(this))
    } else {
      compiler.plugin('done', this.done.bind(this))
    }
  }

  done(stats) {
    const compilation = stats.compilation
    const options = compilation.options

    const rules = options.module.loaders || options.module.rules

    let fileDependencies = compilation.fileDependencies // Array or Set
    fileDependencies = Array.isArray(fileDependencies) ? fileDependencies : Array.from(fileDependencies)

    const fileDependenciesWithoutNM = this.getFileDependenciesWithoutNM(fileDependencies)
    const realRules = this.getRealRules(rules)

    let usedRules = []
    let unusedRules = [...realRules]

    // for...of for break
    for (let filename of fileDependenciesWithoutNM) {
      let matchIndex = -1

      unusedRules.forEach((r, i) => {
        const isCanMatch = this.isCanMatchFile(r, filename)
        isCanMatch && (matchIndex = i)
      })

      if (matchIndex > -1) {
        usedRules = usedRules.concat(unusedRules.splice(matchIndex, 1))
      }

      if (!unusedRules.length) break
    }

    const unusedRulesLoaders = this.getLoadersByRules(unusedRules)
    const usedRulesLoaders = this.getLoadersByRules(usedRules)

    console.log('unusedRules', unusedRules, 'unusedRulesLoaders', unusedRulesLoaders)
    console.log('usedRules', usedRules, 'usedRulesLoaders', usedRulesLoaders)

    const unusedLoaders = unusedRulesLoaders.filter(l => !usedRulesLoaders.includes(l))

    console.log('unusedLoaders', unusedLoaders)

    compilation.warnings.push(`UNUSED LOADERS: ${unusedLoaders.join(', ')}`)
  }

  getRealRules(rules) {
    // TODO: why filter resourceQuery is null
    return rules.filter(r => !r.resourceQuery)
  }

  isCanMatchFile(rule, filename) {
    if (rule.test) {
      // webpack 1.x
      const regExp = new RegExp(rule.test)
      return regExp.test(filename)
    } else {
      // TODO: webpack 4 or webpack > 2.x
      // filter resourceQuery is null
      // use resource function or test
      // if (rule.resource && typeof rule.resource === 'function') {
      //     return rule.resource(filename)
      // } else if (rule.resource && typeof rule.resource === 'object') {
      //     return rule.resourceQuery(filename)
      // } else {
      //     return rule.resourceQuery ? rule.resourceQuery(filename) : false
      // }
      return rule.resource && typeof rule.resource === 'function'
        ? rule.resource(filename)
        : false
    }
  }

  getFileDependenciesWithoutNM(fileDependencies) {
    return fileDependencies.filter(f => !f.includes('node_modules'))
  }

  getLoadersByRules(rules) {
    if (!rules.length) return []

    // webpack 1.x
    /*
        loades: [
            { test: /\.jade$/, loader: 'jade' },
            { test: /\.css$/, loader: 'style!css' },
            { test: /\.css$/, loaders: ['style', 'css'] }
        ]
    */

    // webpack > 2.x
    /*
        rules: [
            { test: /\.css$/, loader: 'css-loader' },
            { test: /\.css$/, loader: 'style!css' },
            { test: /\.css$/, use: 'css-loader' },
            { test: /\.css$/, use: [{ loader: 'style-loader' }, 'css-loader'] },
        ]
    */

    // get loader, seperate by `!`
    // get loaders or use, if it's string, seperate by `!`, if it's array
    // ge item, string ? seperate by `!` : get `item.loader`

    const loaderName = rules.reduce((pre, cur) => {
      return cur.loader ? [...pre, cur.loader] : [...pre, ...(cur.loaders || cur.use.map(l => l.loader))]
    }, [])
      .map(s => s.split('?')[0])
      .map(s => s.includes('-loader') ? s : s + '-loader')

    return Array.from(new Set(loaderName))
  }

}

module.exports = UnusedLoadersPlugin
