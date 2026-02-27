import { stackMiddlewares } from "./lib/edge-middleware/stackMiddlewares";
import { withCors } from "./lib/edge-middleware/withCors";
import { withAuth } from "./lib/edge-middleware/withAuth";

export default stackMiddlewares([withCors, withAuth]);
