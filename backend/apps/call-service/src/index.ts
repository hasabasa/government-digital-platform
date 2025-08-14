import { server } from './app';

const PORT = process.env.PORT || 3008;

server.listen(PORT, () => {
  console.log(`🎥 Call service started on port ${PORT}`);
  console.log(`📞 WebRTC signaling server ready`);
  console.log(`🎯 Only managers can initiate calls`);
});
