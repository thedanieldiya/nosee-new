# Real pseudo-terminal check; fixture values and transcript never leave this process.
import errno, json, os, pty, select, subprocess, sys, time
values=json.load(open(sys.argv[1]))
master,slave=pty.openpty()
proc=subprocess.Popen(['node','--conditions=react-server','scripts/admin-bootstrap.mjs'],stdin=slave,stdout=slave,stderr=slave,env=os.environ.copy())
os.close(slave);transcript=b''
try:
 for label,value in [('First name',values['firstName']),('Last name',values['lastName']),('Email',values['email']),('Password (',values['password']),('Confirm password',values['password'])]:
  deadline=time.monotonic()+20
  while label.encode() not in transcript:
   if time.monotonic()>deadline: raise RuntimeError('Bootstrap prompt timed out.')
   if select.select([master],[],[],1)[0]:transcript+=os.read(master,65536)
  os.write(master,value.encode()+b'\r')
 deadline=time.monotonic()+20
 while proc.poll() is None and time.monotonic()<deadline:
  if select.select([master],[],[],0.2)[0]:
   try:transcript+=os.read(master,65536)
   except OSError as e:
    if e.errno!=errno.EIO:raise
 assert proc.wait(timeout=5)==0,'Interactive bootstrap failed.'
 assert values['password'].encode() not in transcript,'Password was echoed.'
 assert b'*' in transcript,'Masked input not observed.'
 assert b'Initial Super Admin created' in transcript,'Bootstrap not confirmed.'
 print('Masked interactive bootstrap passed.')
finally:
 if proc.poll() is None:proc.terminate();proc.wait(timeout=5)
 os.close(master)
