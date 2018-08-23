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

    let usedRules = []
    let unusedRules = [...rules]

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

  isCanMatchFile(rule, filename) {
    if (rule.test) {
      const regExp = new RegExp(rule.test)
      return regExp.test(filename)
    } else {
      return rule.resource && typeof rule.resource === 'function'
        ? rule.resource(filename)
        : false
    }
  }

  getFileDependenciesWithoutNM(fileDependencies) {
    return fileDependencies.filter(f => !f.includes('node_modules'))
  }

  formatUse(use) {
    // use is array or object
    // [{ loader: 'xxx' }]
    if (Array.isArray(use)) {
      return use.map(item => (typeof item === 'string' ? { loader: item } : item))
    } else {
      return [use]
    }
  }

  getLoadersByRules(rules) {
    if (!rules.length) return []
    /*
      loades: [
        { test: /\.css$/, loader: 'style' },
        { test: /\.css$/, loader: 'style!css?optison=here' },
        { test: /\.css$/, loaders: ['style', 'css-loader'] }
        { test: /\.css$/, use: 'css-loader' },
        { test: /\.css$/, use: [{ loader: 'style-loader' }, 'css-loader'] },
        { test: /\.css$/, use: { loader: 'style-loader' } },
      ]
    */
    const loaders = rules
      .reduce((arr, r) => {
        const loader = r.loader || r.loaders || r.use // string or array or object

        return typeof loader === 'string' 
          ? [...arr, ...this.formatUse(loader.split('!'))]
          : [...arr, ...this.formatUse(loader)]
      }, [])
      .map(l => l.loader)
      .map(l => l.split('?')[0])
      .map(l => l.includes('-loader') ? l : l + '-loader')

    return Array.from(new Set(loaders))
  }

}

module.exports = UnusedLoadersPlugin
