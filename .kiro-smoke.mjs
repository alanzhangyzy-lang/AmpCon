const target = await fetch('http://localhost:9222/json/new?http://localhost:3000/', { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = [];
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  ws.send(JSON.stringify({ id: requestId, method, params }));
});
ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    return msg.error ? reject(msg.error) : resolve(msg.result);
  }
  if (msg.method === 'Runtime.exceptionThrown' || msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Log.entryAdded') events.push(msg);
};
await new Promise(resolve => ws.onopen = resolve);
await call('Runtime.enable');
await call('Page.enable');
await call('Log.enable');
await new Promise(resolve => setTimeout(resolve, 8000));
const result = await call('Runtime.evaluate', { expression: `({title:document.title,url:location.href,root:document.querySelector('#root')?.innerHTML.slice(0,500),bodyText:document.body.innerText.slice(0,500)})`, returnByValue: true });
console.log(JSON.stringify({ page: result.result.value, events }, null, 2));
ws.close();