import Composer from "./Composer";

export default function ComposePage() {
  const renderSeed = process.env.COMPOSE_DRAFT_TOKEN || "";
  return <Composer renderSeed={renderSeed} />;
}
