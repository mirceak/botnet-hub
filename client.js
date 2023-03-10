import net from 'net';

let done = 0;
const client = new net.Socket();

client.on('close', () => {
  console.log('Client closed');
});
client.on('error', (err) => {
  console.error(err);
});
const c = client.connect(
  {
    port: '8080',
    host: '192.168.1.228'
  },
  () => {
    console.log(`client connected`);
    client.write('hey');
  }
);
client.on('data', (data) => {
  if (done < 3) {
    console.log(`Client received: ${data}`);

    client.write('hey');
    done++;
  } else {
    c.destroy();
  }
});
