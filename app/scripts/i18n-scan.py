# SPDX-License-Identifier: Apache-2.0
# Liệt kê chuỗi tiếng Việt còn nằm cứng trong code UI (không tính comment, test, dữ liệu seed). GĐ 09 / I9.3.
import glob
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
VI = re.compile(r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", re.I)
files = [f for f in glob.glob('src/**/*.ts*', recursive=True)
         if '.test.' not in f and not re.search(r'classifier|kb-|recommender|[\\/]i18n[\\/]|test[\\/]', f.replace('\\', '/'))]
n = 0
for f in sorted(files):
    inblock = False
    for i, l in enumerate(open(f, encoding='utf8').read().split('\n'), 1):
        st = l.strip()
        if st.startswith('/*') and '*/' not in st:
            inblock = True
        if inblock or st.startswith('//') or st.startswith('*') or st.startswith('import '):
            if inblock and '*/' in st:
                inblock = False
            continue
        code = re.sub(r"t\('[^']*'(,\s*\{[^}]*\})?\)", '', l)
        code = re.sub(r'//.*$', '', code)
        code = re.sub(r'/\*.*?\*/', '', code)
        if VI.search(code):
            n += 1
            print(f"{f.replace(chr(92), '/')[4:]}:{i}: {l.strip()[:125]}")
print('còn lại:', n)
