import fs from "fs-extra";
import { scanner } from "./parser/scanner";

const source = fs.readFileSync("test.env").toString();

const scanny = scanner({ tab_width: 4 });

const tokens = scanny.scan(source);

console.log(tokens);
