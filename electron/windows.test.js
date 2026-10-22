import { describe, it, expect } from 'vitest';
import { winLocalScript, hermesHomeWin, hermesPythonWin, findGitBash } from './windows.js';

describe('windows local mode', () => {
  it('maps ~/.hermes to the Hermes home and python3 to the Hermes python', () => {
    const out = winLocalScript(
      'grep x "$HOME/.hermes/.env"; ls "$HOME"/.hermes/tools; python3 -V',
      'C:\\Users\\u\\AppData\\Local\\hermes',
      'C:\\h\\python.exe',
    );
    expect(out).toContain("export HERMES_ROOT='C:/Users/u/AppData/Local/hermes'");
    expect(out).toContain('"$HERMES_ROOT/.env"');
    expect(out).toContain('"$HERMES_ROOT"/tools');
    expect(out).not.toContain('$HOME/.hermes');
    expect(out).toContain("HERMES_BOT_PYTHON='C:/h/python.exe'");
  });
  it('resolves the Hermes home', () => {
    expect(hermesHomeWin({ HERMES_HOME: 'D:\\h' })).toBe('D:\\h');
    expect(hermesHomeWin({ LOCALAPPDATA: 'C:\\L', USERPROFILE: 'C:\\U' }, () => true)).toMatch(/hermes$/);
    expect(hermesHomeWin({ LOCALAPPDATA: 'C:\\L', USERPROFILE: 'C:\\U' }, () => false)).toMatch(/\.hermes$/);
  });
  it('finds python and bash', () => {
    expect(hermesPythonWin('/h', () => false)).toBe('python');
    expect(hermesPythonWin('/h', (p) => p.includes('venv'))).toMatch(/python\.exe$/);
    expect(findGitBash({ ProgramFiles: '/pf' }, (p) => p.includes('Git'))).toMatch(/bash\.exe$/);
    expect(findGitBash({}, () => false)).toBeNull();
  });
});
