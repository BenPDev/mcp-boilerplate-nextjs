import { validateProductionConfig } from "../src/config";

Reflect.set(process.env, "NODE_ENV", "production");
validateProductionConfig();
