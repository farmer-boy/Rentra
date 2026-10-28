from pypdf import PdfReader
r=PdfReader(r'E:\Rentra\output\pdf\Synopsis-Muhammad-Kamran-formatted.pdf'); p=r.pages[3]
for name,rf in p['/Resources']['/Font'].items():
 f=rf.get_object(); print(name,f.get('/BaseFont'),f.get('/FirstChar'),f.get('/LastChar'),len(f.get('/Widths',[])),f.get('/FontDescriptor'))
