'use strict';
// Windows support for local mode: the app's host commands are bash snippets
// written for macOS/Linux. On Windows they run through Git Bash, with the
// Hermes home resolved from HERMES_HOME / %LOCALAPPDATA%\hermes.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

let cachedBash;

function findGitBash(env = process.env, exists = fs.existsSync) {
  if (cachedBash !== undefined && env === process.env) return cachedBash;
  const candidates = [];
  if (env.HERMES_BOT_BASH) candidates.push(env.HERMES_BOT_BASH);
  for (const base of [env.ProgramFiles, env['ProgramFiles(x86)'], env.ProgramW6432]) {
    if (base) candidates.push(path.join(base, 'Git', 'bin', 'bash.exe'));
  }
  if (env.LOCALAPPDATA) {
    candidates.push(path.join(env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'bash.exe'));
  }
  if (env === process.env && process.platform === 'win32') {
    try {
      const out = execFileSync('where', ['git'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      for (const line of out.split(/\r?\n/).filter(Boolean)) {
        candidates.push(path.join(path.dirname(path.dirname(line.trim())), 'bin', 'bash.exe'));
      }
    } catch { /* git not on PATH */ }
  }
  const found = candidates.find((c) => {
    try { return exists(c); } catch { return false; }
  }) || null;
  if (env === process.env) cachedBash = found;
  return found;
}

function hermesHomeWin(env = process.env, exists = fs.existsSync) {
  if (env.HERMES_HOME) return env.HERMES_HOME;
  const local = env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'hermes');
  if (local && exists(local)) return local;
  return path.join(env.USERPROFILE || os.homedir(), '.hermes');
}

function hermesPythonWin(home, exists = fs.existsSync) {
  for (const rel of [
    ['hermes-agent', 'venv', 'Scripts', 'python.exe'],
    ['hermes-agent', '.venv', 'Scripts', 'python.exe'],
  ]) {
    const candidate = path.join(home, ...rel);
    if (exists(candidate)) return candidate;
  }
  return 'python';
}

function toForward(p) {
  return String(p).replace(/\\/g, '/');
}

function sq(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/**
 * Rewrite a mac/linux host snippet for Git Bash: every ~/.hermes becomes the
 * real Hermes home (as C:/... so both bash and native python understand it),
 * python3 becomes the Hermes python.
 */
function winLocalScript(command, home, python) {
  const body = String(command)
    .replace(/"\$HOME"\/\.hermes/g, '"$HERMES_ROOT"')
    .replace(/\$HOME\/\.hermes/g, '$HERMES_ROOT');
  const preamble = [
    `export HERMES_ROOT=${sq(toForward(home))}`,
    'export HERMES_HOME="$HERMES_ROOT"',
    `export HERMES_BOT_PYTHON=${sq(toForward(python))}`,
    'export PYTHONIOENCODING=utf-8 PYTHONUTF8=1',
    'python3() { "$HERMES_BOT_PYTHON" "$@"; }',
    'export -f python3',
  ].join('\n');
  return `${preamble}\n${body}`;
}

module.exports = { findGitBash, hermesHomeWin, hermesPythonWin, winLocalScript };
