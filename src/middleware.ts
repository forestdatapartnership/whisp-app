import { stackMiddlewares } from "./middlewares/stackMiddlewares";
import { withCors } from "./middlewares/withCors";

export default stackMiddlewares([withCors]);