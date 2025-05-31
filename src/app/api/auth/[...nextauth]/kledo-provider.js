// app/api/auth/[...nextauth]/kledo-provider.js
export default function KledoProvider(options) {
  return {
    id: "kledo",
    name: "Kledo",
    type: "oauth",
    version: "2.0",
    options,
  };
}