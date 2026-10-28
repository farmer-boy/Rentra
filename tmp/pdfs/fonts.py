from pypdf import PdfReader
for fn in [r'C:\Downloads\1.pdf',r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf']:
 r=PdfReader(fn); p=r.pages[3]; print(fn)
 for name,rf in p['/Resources']['/Font'].items():
  f=rf.get_object();print(name,f.get('/BaseFont'),f.get('/Subtype'))
