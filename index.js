const chalk = require('chalk')

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
    
    this.display(unusedRules, unusedLoaders)
  }

  isCanMatchFile(rule, filename) {
    if (rule.test) {
      const regExp = new RegExp(rule.test)
      return regExp.test(filename)
    } else {
      // FIXME: log warning
      throw new Warning('original rules seem to be mutated, try to put UnusedLoadersPlugin before all plugins')
    }
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

  display(unusedRules, unusedLoaders) {
    process.stdout.write('\n')
    process.stdout.write(chalk.blue('============== UNUSED LOADERS PLUGIN TIPS ==============\n'))
    if (unusedRules.length) {
      process.stdout.write(
        chalk.red(`${unusedRules.length} unused rules found, you had better remove it from webpack config.\n\n`)
      )
      unusedRules.forEach(r => {
        process.stdout.write(chalk.yellow(`● ${r.test}\n`))
      })

      process.stdout.write('\n')

      if (unusedLoaders.length) {
        process.stdout.write(
          chalk.red(`${unusedLoaders.length} unused loaders found, check your packson.json devDependencies.\n\n`)
        )
        unusedLoaders.forEach(l => {
          process.stdout.write(chalk.yellow(`● ${l}\n`))
        })

        process.stdout.write('\n')
      }
    } else {
      process.stdout.write(
        chalk.green(`no unused rules or loaders found, cheers! 🍻\n\n`)
      )
    }
  }

}

module.exports = UnusedLoadersPlugin
