class UnusedLoadersPlugin {
  constructor() {
    this.rules = null
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.done.tap('UnusedLoadersPlugin', this.done.bind(this))
    } else {
      compiler.plugin('done', this.done.bind(this))
    }

    this.rules = compiler.options.module.loaders || compiler.options.module.rules
  }

  done(stats) {
    const compilation = stats.compilation

    const fileDependencies = compilation.fileDependencies // Array or Set
    const fileDependenciesWithoutNM = this.getFileDependenciesWithoutNM(fileDependencies)

    let usedRules = []
    let unusedRules = [...this.rules]

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

    const unusedLoaders = unusedRulesLoaders.filter(l => !usedRulesLoaders.includes(l))

    if (unusedRules.length) {
      compilation.warnings.push(`UNUSED RULES: ${unusedRules.map(r => r.test).join(', ')}`)
    }

    if (unusedLoaders.length) {
      compilation.warnings.push(`UNUSED LOADERS: ${unusedLoaders.join(', ')}`)
    }

  }

  isCanMatchFile(rule, filename) {
      const regExp = new RegExp(rule.test)
      return regExp.test(filename)
  }

  getFileDependenciesWithoutNM(fileDependencies) {
    fileDependencies = Array.isArray(fileDependencies) ? fileDependencies : Array.from(fileDependencies)
    return fileDependencies.filter(f => !f.includes('node_modules'))
  }

  formatUse(use) {
    if (Array.isArray(use)) {
      return use.map(item => (typeof item === 'string' ? { loader: item } : item))
    } else {
      return [use]
    }
  }

  getLoadersByRules(rules) {
    if (!rules.length) return []
  
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
