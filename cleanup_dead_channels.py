#!/usr/bin/env python3
from pathlib import Path
import json, shutil, datetime
IP='191.215.38.95'
ROOT=Path(__file__).resolve().parent
BACK=Path('/var/backups/tvpromedia/dead-channels-20260912/json-before')
BACK.mkdir(parents=True,exist_ok=True)
DEAD_KEYS={'dead','isdead','offline','isoffline','nosignal','no_signal','hasnosignal'}
SIGNAL_KEYS={'signal','hassignal','has_signal','isonline','is_online','online','available','active','connected','live'}
OWNER_KEYS={'createdby','created_by','owner','ownerid','owner_id','userid','user_id','author','authorid','custom','iscustom','is_custom','manual','is_manual','source'}
DEAD_STATUS={'dead','offline','down','inactive','nosignal','no signal','unavailable','broken','error'}

def flat_values(x):
    if isinstance(x,dict):
        for v in x.values(): yield from flat_values(v)
    elif isinstance(x,list):
        for v in x: yield from flat_values(v)
    elif isinstance(x,(str,int,float,bool)): yield str(x)

def owned(o):
    if not isinstance(o,dict): return False
    if IP in ' '.join(flat_values(o)): return True
    for k,v in o.items():
        nk=''.join(c for c in k.lower() if c.isalnum() or c=='_')
        if nk in OWNER_KEYS:
            s=str(v).lower()
            if nk in {'custom','iscustom','is_custom','manual','is_manual'} and s in {'true','1','yes','manual','custom'}: return True
            if s not in {'','none','null','false','0','unknown','system','import','imported','iptv'}: return True
    return False

def dead(o):
    if not isinstance(o,dict): return False
    for k,v in o.items():
        nk=''.join(c for c in k.lower() if c.isalnum() or c=='_')
        sv=str(v).lower().strip()
        if nk in DEAD_KEYS and sv in {'true','1','yes','dead','offline','none','null'}: return True
        if nk in SIGNAL_KEYS and sv in {'false','0','no','dead','offline','none','null',''}: return True
        if nk in {'status','state','health','streamstatus','stream_status'} and sv in DEAD_STATUS: return True
    return False

def channelish(o):
    if not isinstance(o,dict): return False
    keys={k.lower() for k in o}
    return bool(keys & {'name','title','url','streamurl','stream_url','m3u8source','rtmpurl','rtmp_url','source','lien','link'})

def clean_node(node):
    removed=kept=0
    if isinstance(node,list):
        out=[]
        for x in node:
            if channelish(x) and dead(x):
                if owned(x): out.append(x); kept+=1
                else: removed+=1
            else:
                y,r,k=clean_node(x); out.append(y); removed+=r; kept+=k
        return out,removed,kept
    if isinstance(node,dict):
        totalr=totalk=0
        for k,v in list(node.items()):
            y,r,kk=clean_node(v); node[k]=y; totalr+=r; totalk+=kk
        return node,totalr,totalk
    return node,0,0

for p in ROOT.rglob('*.json'):
    if any(part in {'node_modules','.git'} for part in p.parts) or 'backups' in str(p).lower(): continue
    try: data=json.loads(p.read_text(encoding='utf-8'))
    except Exception: continue
    new,removed,kept=clean_node(data)
    if removed:
        rel=p.relative_to(ROOT); dest=BACK/rel; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(p,dest)
        p.write_text(json.dumps(new,ensure_ascii=False,indent=2)+'
',encoding='utf-8')
        print(f'{p}: removed={removed} preserved_owned_dead={kept}')
