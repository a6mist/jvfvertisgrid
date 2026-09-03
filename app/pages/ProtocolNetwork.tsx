const SIMULATOR_URL = 'https://jvf-protocolnetwork.vercel.app/';

export function ProtocolNetwork() {
  return (
    <main className="min-h-screen bg-[#071015]">
      <iframe
        title="Protocol Network Simulator"
        src={SIMULATOR_URL}
        className="block h-screen min-h-[760px] w-full border-0"
      />
    </main>
  );
}
