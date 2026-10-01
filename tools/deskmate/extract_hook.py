# Extracts the GitHub nb-hook.py from the Swift multi-line string literal (decoding Swift escapes).
import sys, re
src = open(sys.argv[1]).read()
start = src.index('private let nbHookPythonGitHub = """\n') + len('private let nbHookPythonGitHub = """\n')
end = src.index('\n"""', start)
body = src[start:end]
assert '\\(' not in body, "unexpected Swift interpolation"
out = re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t', '\\': '\\', '"': '"', "'": "'"}[m.group(1)], body)
open(sys.argv[2], 'w').write(out + '\n')
