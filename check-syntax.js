// check-syntax.js
// Recursively syntax-checks every .js file in src/ using `node --check`.
// Catches things like missing semicolons, mismatched brackets, bad tokens —
// exactly the class of bug that crashed the bot on deploy before.
//
// Usage:
//   node check-syntax.js
//
// Exits with code 1 (and prints every failure) if ANY file has a syntax error.
// Exits with code 0 silently-ish if everything is clean.

import { execSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = 'src'

function findJsFiles(dir) {
  let results = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (entry === 'node_modules') continue // skip, just in case
      results = results.concat(findJsFiles(fullPath))
    } else if (entry.endsWith('.js')) {
      results.push(fullPath)
    }
  }
  return results
}

const files = findJsFiles(SRC_DIR)
console.log(`Checking ${files.length} file(s) in ${SRC_DIR}/ ...\n`)

let hasErrors = false

for (const file of files) {
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' })
    console.log(`✅  ${file}`)
  } catch (err) {
    hasErrors = true
    console.log(`❌  ${file}`)
    console.log(err.stderr.toString())
  }
}

console.log('')
if (hasErrors) {
  console.log('❌  Syntax errors found. Fix these before deploying.')
  process.exit(1)
} else {
  console.log('✅  All files passed syntax check. Safe to deploy.')
  process.exit(0)
}