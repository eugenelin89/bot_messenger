import {BrowserClient} from '../../src/computer/client.js';
let ready=false;for(let i=0;i<10;i++){if(await new BrowserClient().confirmIdle()){ready=true;break;}await new Promise(r=>setTimeout(r,500));}
if(!ready)throw new Error('Browser broker did not become ready');
await new Promise(r=>setTimeout(r,50));
